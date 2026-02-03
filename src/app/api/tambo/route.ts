import { handleChatStream } from '@mastra/ai-sdk';
import type { ChatStreamHandlerParams } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import type { UIMessage } from 'ai';
import { z } from 'zod';

import { mastra } from '@/mastra';

export const runtime = 'nodejs';

const uiMessagePartSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

const uiMessageSchema: z.ZodType<UIMessage> = z
  .object({
    id: z.string(),
    role: z.enum(['system', 'user', 'assistant']),
    parts: z.array(uiMessagePartSchema),
    metadata: z.unknown().optional(),
  })
  .passthrough() as unknown as z.ZodType<UIMessage>;

const chatParamsSchema: z.ZodType<ChatStreamHandlerParams<UIMessage>> = z
  .object({
    messages: z.array(uiMessageSchema),
    resumeData: z.record(z.unknown()).optional(),
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
