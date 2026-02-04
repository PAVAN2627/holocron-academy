import { generateObject } from 'ai';
import type { LanguageModel } from 'ai';
import { z } from 'zod';

import { assertAzureOpenAIConfig, resolveAzureOpenAIChatModel } from '@/lib/azure-openai';

export const runtime = 'nodejs';

function jsonError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
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

  const prompt = [
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

  try {
    const result = await generateObject({
      model,
      schema: responseSchema,
      prompt,
    });

    return Response.json(result.object);
  } catch (err) {
    console.error('Failed to generate quiz:', err);
    return jsonError('generation_failed', 'Failed to generate quiz.', 500);
  }
}
