import { handleChatStream } from '@mastra/ai-sdk';
import type { ChatStreamHandlerParams } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import type { UIMessage } from 'ai';

import { mastra } from '@/mastra';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response('OPENAI_API_KEY is required to use /api/tambo.', { status: 500 });
  }

  let params: unknown;
  try {
    params = await req.json();
  } catch {
    return new Response('Invalid JSON body.', { status: 400 });
  }

  if (!params || typeof params !== 'object') {
    return new Response('Invalid request body.', { status: 400 });
  }

  const rawParams = params as Record<string, unknown>;
  if (!Array.isArray(rawParams.messages)) {
    return new Response('Expected `messages` to be an array.', { status: 400 });
  }

  const chatParams = rawParams as unknown as ChatStreamHandlerParams<UIMessage>;

  const stream = await handleChatStream({
    mastra,
    agentId: 'holocronAgent',
    params: chatParams,
  });

  return createUIMessageStreamResponse({ stream });
}
