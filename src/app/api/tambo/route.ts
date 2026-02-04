import { AzureOpenAIGateway } from '@mastra/core/llm';
import { convertToModelMessages, smoothStream, streamText } from 'ai';
import type { SystemModelMessage } from 'ai';
import type { UIMessage } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { holocronAgent } from '@/mastra/agents/holocron-agent';

export const runtime = 'nodejs';

const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(jsonValueSchema)])
);

const uiMessagePartsSchema = z.array(z.any()).refine(
  (parts) => parts.every((part) => typeof part === 'object' && part !== null && 'type' in part && typeof part.type === 'string'),
  { message: 'Invalid message parts.' }
);

const uiMessageSchema: z.ZodType<UIMessage> = z
  .object({
    id: z.string(),
    role: z.enum(['system', 'user', 'assistant']),
    parts: uiMessagePartsSchema,
    metadata: z.unknown().optional(),
  })
  .passthrough();

const chatParamsSchema = z
  .object({
    messages: z.array(uiMessageSchema),
    resumeData: z.record(jsonValueSchema).optional(),
    trigger: z.enum(['submit-message', 'regenerate-message']).optional(),
  })
  .passthrough();

function isSystemModelMessage(value: unknown): value is SystemModelMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('role' in value) || (value as { role?: unknown }).role !== 'system') {
    return false;
  }

  if (!('content' in value)) {
    return false;
  }

  return typeof (value as { content?: unknown }).content === 'string';
}

function getAzureEnvConfig() {
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT;
  const explicitResourceName = process.env.AZURE_OPENAI_RESOURCE_NAME;

  if (!apiKey) {
    throw new Error('Missing AZURE_OPENAI_KEY.');
  }

  if (!endpoint) {
    throw new Error('Missing AZURE_OPENAI_ENDPOINT.');
  }

  if (!deploymentName) {
    throw new Error('Missing AZURE_OPENAI_DEPLOYMENT.');
  }

  if (explicitResourceName) {
    return { apiKey, resourceName: explicitResourceName, deploymentName };
  }

  let resourceName: string;
  try {
    const url = new URL(endpoint);
    const hostname = url.hostname;
    const hostnameParts = hostname.split('.');

    if (hostnameParts.length < 4) {
      throw new Error(`Azure OpenAI endpoint hostname is too short: ${hostname}`);
    }

    const openAiIndex = hostnameParts.findIndex(
      (part, idx) => part === 'openai' && hostnameParts[idx + 1] === 'azure' && hostnameParts[idx + 2] === 'com'
    );

    if (openAiIndex > 0) {
      resourceName = hostnameParts[openAiIndex - 1] ?? '';
    } else {
      throw new Error(`Unrecognized Azure OpenAI endpoint hostname pattern: ${hostname}`);
    }
  } catch (err) {
    console.error('Invalid AZURE_OPENAI_ENDPOINT format:', { endpoint, err });
    throw new Error('Invalid AZURE_OPENAI_ENDPOINT. Set AZURE_OPENAI_RESOURCE_NAME to override.');
  }

  if (!resourceName) {
    throw new Error(
      'Could not extract Azure OpenAI resource name from AZURE_OPENAI_ENDPOINT. Set AZURE_OPENAI_RESOURCE_NAME to override.'
    );
  }

  return { apiKey, resourceName, deploymentName };
}

export async function POST(req: Request) {
  const [nodeMajor, nodeMinor] = process.versions.node.split('.').map((part) => Number.parseInt(part, 10));
  if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 13)) {
    return NextResponse.json(
      { error: 'This API route requires Node.js >= 22.13.0.', code: 'NODE_VERSION_UNSUPPORTED' },
      { status: 500 }
    );
  }

  if (req.headers.get('content-type')?.includes('application/json') !== true) {
    return NextResponse.json(
      { error: 'Content-Type must be application/json.', code: 'UNSUPPORTED_MEDIA_TYPE' },
      { status: 415 }
    );
  }

  let azureConfig: { apiKey: string; resourceName: string; deploymentName: string };
  try {
    azureConfig = getAzureEnvConfig();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server misconfiguration.';
    return NextResponse.json({ error: message, code: 'AZURE_CONFIG_INVALID' }, { status: 500 });
  }

  let params: unknown;
  try {
    params = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.', code: 'BAD_JSON' }, { status: 400 });
  }

  const parsed = chatParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body.', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const { messages, resumeData, trigger } = parsed.data;
  if (resumeData) {
    return NextResponse.json(
      {
        error: 'resumeData is not supported in the current streaming implementation.',
        code: 'RESUME_UNSUPPORTED',
        details: {
          keys: Object.keys(resumeData),
          hint: 'Remove resumeData from the request body.',
        },
      },
      { status: 400 }
    );
  }

  const lastMessage = messages.at(-1);
  let effectiveTrigger = trigger;
  if (trigger === 'regenerate-message' && lastMessage?.role !== 'assistant') {
    console.warn('Invalid regenerate request: expected last message to be assistant. Falling back to submit-message.', {
      lastRole: lastMessage?.role,
    });
    effectiveTrigger = 'submit-message';
  }

  const effectiveMessages = effectiveTrigger === 'regenerate-message' ? messages.slice(0, -1) : messages;
  let system: string | SystemModelMessage | Array<SystemModelMessage>;
  try {
    const instructions = await holocronAgent.getInstructions();

    if (typeof instructions === 'string') {
      system = instructions;
    } else if (Array.isArray(instructions) && instructions.every((item) => typeof item === 'string')) {
      system = instructions.join('\n');
    } else if (isSystemModelMessage(instructions)) {
      system = instructions;
    } else if (Array.isArray(instructions) && instructions.every(isSystemModelMessage)) {
      system = instructions;
    } else {
      throw new Error('Invalid agent instructions.');
    }
  } catch (err) {
    console.error('Failed to load holocron agent instructions:', err);
    return NextResponse.json({ error: 'Failed to initialize agent instructions.', code: 'AGENT_INIT_FAILED' }, { status: 500 });
  }

  try {
    const gateway = new AzureOpenAIGateway({
      apiKey: azureConfig.apiKey,
      resourceName: azureConfig.resourceName,
    });

    const model = await gateway.resolveLanguageModel({
      modelId: azureConfig.deploymentName,
      providerId: gateway.id,
      apiKey: azureConfig.apiKey,
    });

    const modelMessages = await convertToModelMessages(effectiveMessages.map(({ role, parts }) => ({ role, parts })));

    const result = streamText({
      model,
      system,
      messages: modelMessages,
      experimental_transform: smoothStream(),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
    });
  } catch (err) {
    console.error('Failed to start chat stream:', err);
    return NextResponse.json({ error: 'Failed to start chat stream.', code: 'STREAM_INIT_FAILED' }, { status: 500 });
  }
}
