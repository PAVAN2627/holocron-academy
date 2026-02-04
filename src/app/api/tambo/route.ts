import { handleChatStream } from '@mastra/ai-sdk';
import type { ChatStreamHandlerParams } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import type { UIMessage } from 'ai';
import { z } from 'zod';

import { mastra } from '@/mastra';
import { HOLOCRON_AGENT_ID } from '@/mastra/agents/holocron-agent';
import { assertAzureOpenAIConfig, getAzureOpenAIChatModel } from '@/lib/azure-openai';

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

const chatParamsSchema: z.ZodType<ChatStreamHandlerParams<UIMessage>> = z
  .object({
    messages: z.array(uiMessageSchema),
    resumeData: z.record(jsonValueSchema).optional(),
    trigger: z.enum(['submit-message', 'regenerate-message']).optional(),
  });

export async function POST(req: Request) {
  const [nodeMajor, nodeMinor] = process.versions.node.split('.').map((part) => Number.parseInt(part, 10));
  if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 13)) {
    return new Response('Mastra /api/tambo route requires Node.js >= 22.13.0.', { status: 500 });
  }

  try {
    assertAzureOpenAIConfig();
    getAzureOpenAIChatModel();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server misconfiguration.';
    return new Response(message, { status: 500 });
  }

  let params: unknown;
  try {
    params = await req.json();
  } catch {
    return new Response('Invalid JSON body.', { status: 400 });
  }

  const parsed = chatParamsSchema.safeParse(params);
  if (!parsed.success) {
    return new Response('Invalid request body.', { status: 400 });
  }

  const { messages, resumeData, trigger } = parsed.data;
  const chatParams: ChatStreamHandlerParams<UIMessage> = {
    messages,
    ...(resumeData ? { resumeData } : {}),
    ...(trigger ? { trigger } : {}),
  };

  try {
    const stream = await handleChatStream({
      mastra,
      agentId: HOLOCRON_AGENT_ID,
      params: chatParams,
    });

    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    console.error('Failed to start chat stream:', err);
    return new Response('Failed to start chat stream.', { status: 500 });
  }
}
