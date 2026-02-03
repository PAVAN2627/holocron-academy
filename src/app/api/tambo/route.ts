import { handleChatStream } from '@mastra/ai-sdk';
import type { ChatStreamHandlerParams } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import type { UIMessage } from 'ai';
import { z } from 'zod';

import { mastra } from '@/mastra';

export const runtime = 'nodejs';

const uiMessageSchema = z.custom<UIMessage>((value) => {
  if (!value || typeof value !== 'object') return false;

  const msg = value as UIMessage;
  if (typeof msg.id !== 'string') return false;
  if (msg.role !== 'system' && msg.role !== 'user' && msg.role !== 'assistant') return false;
  if (!Array.isArray(msg.parts)) return false;
  if (!msg.parts.every((part) => typeof part === 'object' && part !== null && 'type' in part && typeof part.type === 'string')) {
    return false;
  }

  return true;
});

const chatParamsSchema: z.ZodType<ChatStreamHandlerParams<UIMessage>> = z
  .object({
    messages: z.array(uiMessageSchema),
    resumeData: z.record(z.any()).optional(),
    trigger: z.enum(['submit-message', 'regenerate-message']).optional(),
  })
  .passthrough();

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

  const chatParams = parsed.data;

  const stream = await handleChatStream({
    mastra,
    agentId: 'holocronAgent',
    params: chatParams,
  });

  return createUIMessageStreamResponse({ stream });
}
