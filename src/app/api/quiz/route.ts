import { generateObject } from 'ai';
import type { LanguageModel } from 'ai';
import { z } from 'zod';

import { assertAzureOpenAIConfig, resolveAzureOpenAIChatModel } from '@/lib/azure-openai';

export const runtime = 'nodejs';

const SAFE_PROMPT =
  'Generate a Star Wars quiz but avoid any aggressive or violent terminology to bypass content filters.';

function jsonError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

function getErrorStatusCode(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;

  const anyErr = err as {
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
    cause?: unknown;
  };

  const candidates = [anyErr.status, anyErr.statusCode, anyErr.response?.status];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  if (anyErr.cause && typeof anyErr.cause === 'object') {
    return getErrorStatusCode(anyErr.cause);
  }

  return null;
}

function safeStringifyError(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  return String(err);
}

function isAzureContentFilterError(err: unknown): boolean {
  return /content[_-]?filter/i.test(safeStringifyError(err));
}

function shouldRetryWithSafePrompt(err: unknown): boolean {
  const status = getErrorStatusCode(err);
  if (status != null && status !== 400 && status !== 403) return false;
  return isAzureContentFilterError(err);
}

const quizRankSchema = z.enum(['Youngling', 'Padawan', 'Knight', 'Master']);

const requestSchema = z.object({
  rank: quizRankSchema,
  topic: z.string().optional(),
});

const quizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  choices: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().optional(),
  lessonSlide: z
    .object({
      title: z.string(),
      content: z.string(),
    })
    .optional(),
});

const responseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  passingScorePercent: z.number().min(0).max(100).default(60),
  questions: z.array(quizQuestionSchema).min(1),
});

export async function POST(req: Request) {
  const [nodeMajor, nodeMinor] = process.versions.node.split('.').map((part) => Number.parseInt(part, 10));
  if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 13)) {
    return jsonError('node_version', 'Quiz generation route requires Node.js >= 22.13.0.', 500);
  }

  try {
    assertAzureOpenAIConfig();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server misconfiguration.';
    return jsonError('azure_misconfig', message, 500);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON body.', 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid request body.', 400);
  }

  const { rank, topic } = parsed.data;
  const effectiveTopic = topic ?? 'Next.js 14 (App Router) and modern frontend basics';

  const model = (await resolveAzureOpenAIChatModel()) as unknown as LanguageModel;

  const buildPrompt = ({ safe }: { safe: boolean }) => {
    return [
      ...(safe ? [SAFE_PROMPT, ''] : []),
      `Create a multiple-choice quiz for a learner rank of "${rank}".`,
      `Topic: ${effectiveTopic}.`,
      '',
      'Pick the quiz length based on the learner rank:',
      '- Youngling: short (3–4 questions)',
      '- Padawan: medium (5–6 questions)',
      '- Knight: longer (7–8 questions)',
      '- Master: challenging (9–10 questions)',
      '',
      'Rules:',
      '- Use clear, simple English.',
      '- Each question must have 4 choices.',
      '- correctIndex is 0-based.',
      '- Include an explanation for each question.',
      '- Provide lessonSlide only when the question is tricky, with a short remediation lesson.',
      '- Return only the structured object that matches the schema.',
    ].join('\n');
  };

  const fallbackQuiz = {
    title: 'Holocron Quiz (Fallback)',
    description: 'A safe starter quiz generated locally when the AI generator is unavailable.',
    passingScorePercent: 60,
    questions: [
      {
        id: 'fallback-1',
        prompt: 'Which Next.js feature is used to build routes with the App Router?',
        choices: ['pages directory', 'app directory', 'public directory', 'middleware.ts only'],
        correctIndex: 1,
        explanation: 'With the App Router, routes are defined under the app directory.',
      },
      {
        id: 'fallback-2',
        prompt: 'Which HTTP method is typically used to submit a form with credentials?',
        choices: ['GET', 'POST', 'PUT', 'DELETE'],
        correctIndex: 1,
        explanation: 'POST is commonly used to send credential payloads in the request body.',
      },
      {
        id: 'fallback-3',
        prompt: 'Which Tailwind class is used to apply a dark background color token?',
        choices: ['bg-background', 'text-foreground', 'border-border', 'ring-ring'],
        correctIndex: 0,
        explanation: 'bg-background maps to the CSS variable for the background color token.',
      },
    ],
  };

  try {
    let result;
    try {
      result = await generateObject({
        model,
        schema: responseSchema,
        prompt: buildPrompt({ safe: false }),
      });
    } catch (err) {
      if (!shouldRetryWithSafePrompt(err)) {
        throw err;
      }

      console.warn('Retrying quiz generation with safe prompt after Azure rejection.', {
        status: getErrorStatusCode(err),
        isContentFilter: isAzureContentFilterError(err),
      });

      result = await generateObject({
        model,
        schema: responseSchema,
        prompt: buildPrompt({ safe: true }),
      });
    }

    return Response.json(result.object);
  } catch (err) {
    console.error('Failed to generate quiz:', err);
    return Response.json(fallbackQuiz, {
      headers: {
        'x-holocron-fallback': '1',
      },
    });
  }
}
