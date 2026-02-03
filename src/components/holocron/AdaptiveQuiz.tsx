'use client';

import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { LessonSlide } from './LessonSlide';

const quizQuestionSchema = z.object({
  id: z.string().describe('Stable identifier for the question'),
  prompt: z.string().describe('The question text'),
  choices: z.array(z.string()).min(2).describe('Multiple choice answers'),
  correctIndex: z.number().int().nonnegative().describe('0-based index into choices'),
  explanation: z.string().optional().describe('Optional explanation shown after grading'),
  lessonSlide: z
    .object({
      title: z.string(),
      content: z.string().describe('Short remediation lesson, plain text or Markdown'),
    })
    .optional()
    .describe('Optional lesson to show when the question is missed'),
});

export const adaptiveQuizPropsSchema = z.object({
  title: z.string().default('Adaptive Quiz'),
  description: z
    .string()
    .optional()
    .describe('Optional context for the quiz (what the user is being tested on)'),
  passingScorePercent: z
    .number()
    .min(0)
    .max(100)
    .default(60)
    .describe('Score threshold for passing'),
  questions: z.array(quizQuestionSchema).min(1).describe('Question list'),
  remediation: z
    .object({
      title: z.string(),
      content: z.string().describe('Short remediation lesson, plain text or Markdown'),
    })
    .optional()
    .describe('Fallback lesson if the user scores below the passing threshold'),
});

export type AdaptiveQuizProps = z.input<typeof adaptiveQuizPropsSchema>;

export function AdaptiveQuiz({
  title = 'Adaptive Quiz',
  description,
  passingScorePercent = 60,
  questions,
  remediation,
}: AdaptiveQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sithModeEnabled, setSithModeEnabled] = useState(false);
  const [sithUnlocked, setSithUnlocked] = useState(false);

  const score = useMemo(() => {
    const total = questions.length;
    if (!submitted || total === 0) return null;

    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) correct += 1;
    }

    return { correct, total, percent: (correct / total) * 100 };
  }, [answers, questions, submitted]);

  const missed = useMemo(() => {
    if (!score) return [];
    return questions.filter((q) => answers[q.id] !== q.correctIndex);
  }, [answers, questions, score]);

  const hasMissedQuestion = submitted && missed.length > 0;

  useEffect(() => {
    if (!sithUnlocked && hasMissedQuestion) {
      setSithUnlocked(true);
      setSithModeEnabled(true);
    }
  }, [hasMissedQuestion, sithUnlocked]);

  const isSithTheme = sithUnlocked && sithModeEnabled;

  const shouldRemediate = score ? score.percent < passingScorePercent : false;
  const remediationSlide = useMemo(() => {
    if (!shouldRemediate) return null;

    const fromQuestion = missed.find((q) => q.lessonSlide)?.lessonSlide;
    if (fromQuestion) return fromQuestion;

    return remediation ?? null;
  }, [missed, remediation, shouldRemediate]);

  const statusBadgeVariant = submitted ? (shouldRemediate ? 'destructive' : 'secondary') : 'secondary';
  const statusBadgeClassName = cn(
    isSithTheme && 'border-destructive/55 bg-destructive/10 text-destructive-foreground',
    !isSithTheme && !shouldRemediate && 'border-sky-500/30 bg-sky-500/10 text-sky-100'
  );

  const sithToggleLabel = `Sith Mode: ${sithModeEnabled ? 'On' : 'Off'}`;
  const sithToggleVariant = isSithTheme ? 'destructive' : 'outline';
  const sithToggleClassName = cn(
    !isSithTheme && 'border-sky-500/30 text-sky-100 hover:bg-sky-500/10',
    !sithUnlocked && 'cursor-not-allowed opacity-60'
  );

  const choiceHoverClassName = isSithTheme ? 'hover:bg-destructive/10' : 'hover:bg-sky-500/10';
  const choiceSelectedClassName = isSithTheme ? 'border-destructive/60 bg-destructive/10' : 'border-sky-400/60 bg-sky-500/10';
  const choiceCorrectRevealClassName = isSithTheme ? 'border-destructive/60' : 'border-sky-400/60';

  return (
    <Card className={cn('terminal-overlay', isSithTheme ? 'border-destructive/55' : 'border-sky-500/30')}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className={cn('truncate', isSithTheme ? 'text-destructive' : 'text-sky-100')}>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusBadgeVariant} className={statusBadgeClassName}>
              {submitted ? (shouldRemediate ? 'Needs review' : 'Passed') : 'Quiz'}
            </Badge>
            <Button
              type="button"
              size="sm"
              variant={sithToggleVariant}
              className={sithToggleClassName}
              disabled={!sithUnlocked}
              onClick={() => {
                setSithModeEnabled((prev) => !prev);
              }}
            >
              {sithToggleLabel}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {questions.map((q, index) => {
          const selected = answers[q.id];
          const isCorrect = submitted ? selected === q.correctIndex : null;

          return (
            <div key={q.id} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">
                  {index + 1}. {q.prompt}
                </p>
                {submitted ? (
                  <Badge variant={isCorrect ? 'default' : 'destructive'}>{isCorrect ? 'Correct' : 'Incorrect'}</Badge>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {q.choices.map((choice, choiceIndex) => {
                  const isSelected = selected === choiceIndex;
                  return (
                    <button
                      key={choiceIndex}
                      type="button"
                      onClick={() => {
                        if (submitted) return;
                        setAnswers((prev) => ({ ...prev, [q.id]: choiceIndex }));
                      }}
                      className={cn(
                        'rounded-md border bg-card px-3 py-2 text-left text-sm transition-colors',
                        choiceHoverClassName,
                        isSelected && choiceSelectedClassName,
                        submitted && !isCorrect && choiceIndex === q.correctIndex && choiceCorrectRevealClassName,
                        submitted && isSelected && !isCorrect && 'border-destructive/60'
                      )}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {submitted && (q.explanation || q.lessonSlide) ? (
                <div className="rounded-md border bg-muted/20 p-3 text-sm">
                  {q.explanation ? <p className="text-muted-foreground">{q.explanation}</p> : null}
                  {q.lessonSlide ? (
                    <p className="mt-2 text-muted-foreground">
                      Remediation available: <span className="font-medium text-foreground">{q.lessonSlide.title}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              <Separator />
            </div>
          );
        })}

        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="text-sm text-muted-foreground">
            {score ? (
              <span>
                Score: {score.correct}/{score.total} ({Math.round(score.percent)}%) — passing is {passingScorePercent}%
              </span>
            ) : (
              <span>Choose an answer for each question, then submit to get your score.</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
                setSithModeEnabled(false);
                setSithUnlocked(false);
              }}
            >
              Reset
            </Button>
            <Button
              type="button"
              disabled={submitted}
              onClick={() => {
                setSubmitted(true);
              }}
            >
              Submit
            </Button>
          </div>
        </div>

        {remediationSlide ? (
          <LessonSlide title={remediationSlide.title} content={remediationSlide.content} />
        ) : null}
      </CardContent>
    </Card>
  );
}
