"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { LessonSlide } from "@/components/tambo/LessonSlide";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctOption: string;
};

export type AdaptiveQuizProps = {
  title?: string;
  questions: QuizQuestion[];
  passThreshold?: number;
  onScore?: (scorePercent: number) => void;
};

function buildQuizSchema(questions: QuizQuestion[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const question of questions) {
    if (question.options.length === 0) {
      shape[question.id] = z.never();
      continue;
    }

    const [first, ...rest] = question.options;
    shape[question.id] = z.enum([first, ...rest] as [string, ...string[]]);
  }

  return z.object(shape);
}

export function AdaptiveQuiz({
  title = "Adaptive Quiz",
  questions,
  passThreshold = 60,
  onScore,
}: AdaptiveQuizProps) {
  const rawThreshold = Number.isFinite(passThreshold) ? passThreshold : 60;
  const effectiveThreshold = Math.min(100, Math.max(0, rawThreshold));
  const schema = useMemo(() => buildQuizSchema(questions), [questions]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<
    | { scorePercent: number; correctCount: number; totalCount: number }
    | null
  >(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setAnswers({});
    setResult(null);
    setValidationError(null);
  }, [schema]);

  const totalCount = questions.length;
  const hasOptionlessQuestion = questions.some((q) => q.options.length === 0);

  function submit() {
    if (totalCount === 0) {
      setValidationError("This quiz has no questions configured.");
      setResult(null);
      return;
    }

    if (hasOptionlessQuestion) {
      setValidationError("This quiz is misconfigured (a question has no options).");
      setResult(null);
      return;
    }

    const invalidCorrectOption = questions.find(
      (q) => !q.options.includes(q.correctOption),
    );

    if (invalidCorrectOption) {
      setValidationError(
        `Quiz misconfigured: correctOption for "${invalidCorrectOption.id}" is not in options.`,
      );
      setResult(null);
      return;
    }

    const parsed = schema.safeParse(answers);

    if (!parsed.success) {
      setValidationError("Answer every question before submitting.");
      setResult(null);
      return;
    }

    setValidationError(null);

    const correctCount = questions.reduce((acc, q) => {
      const answer = parsed.data[q.id];
      return answer === q.correctOption ? acc + 1 : acc;
    }, 0);

    const scorePercent = Math.round((correctCount / totalCount) * 100);
    setResult({ scorePercent, correctCount, totalCount });
    onScore?.(scorePercent);
  }

  const showLessonSlide =
    result !== null &&
    result.totalCount > 0 &&
    result.scorePercent < effectiveThreshold;

  return (
    <Card className="border-emerald-500/25 bg-card/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base text-emerald-100">{title}</CardTitle>
        <p className="text-sm text-emerald-100/70">
          Score below {effectiveThreshold}% triggers a lesson slide.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-5">
          {questions.map((q, idx) => (
            <fieldset key={q.id} className="space-y-3">
              <legend className="text-sm font-medium text-emerald-50">
                {idx + 1}. {q.prompt}
              </legend>
              <div className="grid gap-2">
                {q.options.map((opt) => {
                  const id = `${q.id}-${opt}`;

                  return (
                    <label
                      key={id}
                      htmlFor={id}
                      className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-emerald-500/20 bg-background/20 px-3 py-2 text-sm text-emerald-100/90 transition-colors hover:border-emerald-400/35"
                    >
                      <span className="leading-snug">{opt}</span>
                      <span className="flex items-center gap-2">
                        <Label htmlFor={id} className="sr-only">
                          {opt}
                        </Label>
                        <input
                          id={id}
                          name={q.id}
                          type="radio"
                          className="h-4 w-4 accent-emerald-300"
                          checked={answers[q.id] === opt}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                          }
                        />
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={submit}
            className="bg-emerald-400/20 text-emerald-50 hover:bg-emerald-400/30"
          >
            Submit
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAnswers({});
              setResult(null);
              setValidationError(null);
            }}
            className="border-emerald-500/30 text-emerald-100 hover:bg-emerald-400/10"
          >
            Reset
          </Button>
          {validationError ? (
            <p className="text-sm text-[var(--sith-red)]">{validationError}</p>
          ) : null}
        </div>

        {result ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-emerald-100/80">
              <span>
                {result.correctCount}/{result.totalCount} correct
              </span>
              <span>{result.scorePercent}%</span>
            </div>
            <Progress value={result.scorePercent} />
          </div>
        ) : null}

        {showLessonSlide ? (
          <LessonSlide
            title="Lesson Slide: Refresher Protocol"
            summary="Your score is below the threshold, so the holocron surfaces a short recap before you try again."
            highlights={[
              "Re-read each prompt and eliminate options that directly contradict the question.",
              "Focus on the core concept, not the flavor text.",
              "Retry the quiz after reviewing the recap.",
            ]}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
