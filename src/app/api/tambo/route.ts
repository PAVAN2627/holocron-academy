import { handleChatStream } from '@mastra/ai-sdk';
import type { ChatStreamHandlerParams } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import type { UIMessage } from 'ai';
import { z } from 'zod';

import { mastra } from '@/mastra';
import { HOLOCRON_AGENT_ID } from '@/mastra/agents/holocron-agent';

export const runtime = 'nodejs';

const [nodeMajor, nodeMinor] = process.versions.node.split('.').map((part) => Number.parseInt(part, 10));
if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 13)) {
  throw new Error('Mastra /api/tambo route requires Node.js >= 22.13.0.');
}

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
  if (!process.env.OPENAI_API_KEY) {
    return new Response('Server misconfiguration: OPENAI_API_KEY is not set.', { status: 500 });
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

  const stream = await handleChatStream({
    mastra,
    agentId: HOLOCRON_AGENT_ID,
    params: chatParams,
  });

  return createUIMessageStreamResponse({ stream });
}
