'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { AdaptiveQuiz, type AdaptiveQuizCompletion } from '@/components/holocron/AdaptiveQuiz';
import { GalaxyModule } from '@/components/holocron/GalaxyModule';
import { Reveal } from '@/components/motion/Reveal';
import { TamboChat } from '@/components/tambo/TamboChat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { HolocronProfile } from '@/lib/holocron-auth';

type QuizProgress = {
  attempts: number;
  passed: number;
  totalPercent: number;
  lastPercent: number | null;
};

type QuizRank = 'Youngling' | 'Padawan' | 'Knight' | 'Master';

const quizRanks: QuizRank[] = ['Youngling', 'Padawan', 'Knight', 'Master'];

type GeneratedQuiz = {
  title: string;
  description?: string;
  passingScorePercent: number;
  questions: {
    id: string;
    prompt: string;
    choices: string[];
    correctIndex: number;
    explanation?: string;
    lessonSlide?: {
      title: string;
      content: string;
    };
  }[];
};

type QuizApiErrorPayload = {
  error: {
    code: string;
    message: string;
  };
};

function isQuizApiErrorPayload(value: unknown): value is QuizApiErrorPayload {
  if (!value || typeof value !== 'object') return false;

  const payload = value as QuizApiErrorPayload;
  if (!payload.error || typeof payload.error !== 'object') return false;

  return typeof payload.error.code === 'string' && typeof payload.error.message === 'string';
}

function isGeneratedQuiz(value: unknown): value is GeneratedQuiz {
  if (!value || typeof value !== 'object') return false;

  const quiz = value as Partial<GeneratedQuiz>;
  if (typeof quiz.title !== 'string') return false;
  if (typeof quiz.passingScorePercent !== 'number') return false;
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) return false;

  return quiz.questions.every((question) => {
    if (!question || typeof question !== 'object') return false;

    const q = question as GeneratedQuiz['questions'][number];
    return (
      typeof q.id === 'string' &&
      typeof q.prompt === 'string' &&
      Array.isArray(q.choices) &&
      q.choices.length >= 2 &&
      q.choices.every((choice) => typeof choice === 'string') &&
      typeof q.correctIndex === 'number' &&
      Number.isInteger(q.correctIndex) &&
      q.correctIndex >= 0 &&
      q.correctIndex < q.choices.length
    );
  });
}

// In-memory demo state (not persisted across refreshes).

type DashboardClientProps = {
  hasTamboKey: boolean;
  profile: HolocronProfile | null;
};

export function DashboardClient({ hasTamboKey, profile }: DashboardClientProps) {
  const [quizProgress, setQuizProgress] = useState<QuizProgress>({
    attempts: 0,
    passed: 0,
    totalPercent: 0,
    lastPercent: null,
  });

  const [quizRank, setQuizRank] = useState<QuizRank>('Padawan');
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizErrorCode, setQuizErrorCode] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const quizRequestControllerRef = useRef<AbortController | null>(null);

  const averagePercent = useMemo(() => {
    if (quizProgress.attempts === 0) return null;
    return quizProgress.totalPercent / quizProgress.attempts;
  }, [quizProgress.attempts, quizProgress.totalPercent]);

  const handleQuizCompleted = (completion: AdaptiveQuizCompletion) => {
    setQuizProgress((prev) => {
      return {
        attempts: prev.attempts + 1,
        passed: prev.passed + (completion.passed ? 1 : 0),
        totalPercent: prev.totalPercent + completion.percent,
        lastPercent: completion.percent,
      };
    });
  };

  const generateQuiz = async (rank: QuizRank) => {
    quizRequestControllerRef.current?.abort();
    const controller = new AbortController();
    quizRequestControllerRef.current = controller;

    setQuizLoading(true);
    setQuizError(null);
    setQuizErrorCode(null);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rank }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const payload: unknown = await res.json().catch(() => null);
        if (isQuizApiErrorPayload(payload)) {
          const error = new Error(payload.error.message) as Error & { code?: string };
          error.code = payload.error.code;
          throw error;
        }

        throw new Error('Failed to generate quiz.');
      }

      const data: unknown = await res.json();

      if (!isGeneratedQuiz(data)) {
        throw new Error('Quiz generation returned an invalid format.');
      }

      setQuiz(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('Failed to generate quiz:', err);

      const message = err instanceof Error ? err.message : 'Failed to generate quiz.';
      setQuizError(message);
      setQuizErrorCode(typeof (err as { code?: unknown }).code === 'string' ? (err as { code: string }).code : null);
      setQuiz(null);
    } finally {
      if (quizRequestControllerRef.current === controller) {
        setQuizLoading(false);
        quizRequestControllerRef.current = null;
      }
    }
  };

  useEffect(() => {
    void generateQuiz(quizRank);

    return () => {
      quizRequestControllerRef.current?.abort();
      quizRequestControllerRef.current = null;
    };
  }, [quizRank]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Your hub for progress, quizzes, and Holocron chat.</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">GalaxyModule</Badge>
              <Badge variant="secondary">AdaptiveQuiz</Badge>
            </div>
          </div>
        </Reveal>
        <Separator />
      </header>

      <main className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-6">
          <Reveal>
            <Card
              id="progress"
              terminal
              className="scroll-mt-24 border-white/10 bg-white/5 backdrop-blur-xl"
            >
              <CardHeader>
                <CardTitle className="text-foreground">My Progress</CardTitle>
                <CardDescription>Updated instantly when you finish a quiz.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Quizzes completed</p>
                    <p className="text-lg font-semibold text-foreground">{quizProgress.attempts}</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Passed</p>
                    <p className="text-lg font-semibold text-foreground">
                      {quizProgress.attempts === 0 ? '-' : `${quizProgress.passed}/${quizProgress.attempts}`}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Average score</p>
                    <p className="text-lg font-semibold text-foreground">
                      {averagePercent == null ? '-' : `${Math.round(averagePercent)}%`}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Latest score</span>
                    <span className="font-medium text-foreground">
                      {quizProgress.lastPercent == null ? '—' : `${Math.round(quizProgress.lastPercent)}%`}
                    </span>
                  </div>
                  <Progress value={quizProgress.lastPercent ?? 0} />
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.05}>
            <div id="lessons" className="scroll-mt-24">
              <GalaxyModule
                title="Lessons"
                planets={[
                  { name: 'Tatooine', description: 'Fundamentals' },
                  { name: 'Coruscant', description: 'UI patterns' },
                  { name: 'Dagobah', description: 'Adaptive practice' },
                  { name: 'Mustafar', description: 'Error handling' },
                ]}
                currentIndex={1}
                subtitle="Your learning path"
              />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div id="quizzes" className="scroll-mt-24 space-y-4">
              <Card terminal className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-foreground">Quizzes</CardTitle>
                  <CardDescription>Adaptive quizzes generated by AI based on your rank.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Rank</span>
                    <select
                      value={quizRank}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (quizRanks.includes(value as QuizRank)) {
                          setQuizRank(value as QuizRank);
                        }
                      }}
                      disabled={quizLoading}
                      className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="Youngling">Youngling</option>
                      <option value="Padawan">Padawan</option>
                      <option value="Knight">Knight</option>
                      <option value="Master">Master</option>
                    </select>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="border-primary/25 bg-white/5 text-foreground hover:bg-white/10"
                    disabled={quizLoading}
                    onClick={() => {
                      void generateQuiz(quizRank);
                    }}
                  >
                    {quizLoading ? 'Generating…' : 'Regenerate quiz'}
                  </Button>
                </CardContent>
              </Card>

              {quizError ? (
                <Card terminal className="border-destructive/40 bg-destructive/10">
                  <CardHeader>
                    <CardTitle className="text-destructive">Quiz generation failed</CardTitle>
                    <CardDescription className="text-destructive/80">
                      {quizError}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-destructive/80">Please try again in a moment.</p>
                    {quizErrorCode === 'azure_misconfig' ? (
                      <p className="mt-2 text-xs text-destructive/70">
                        Technical hint: check AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT, and AZURE_OPENAI_KEY.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {quiz ? (
                <AdaptiveQuiz
                  title={quiz.title}
                  description={quiz.description}
                  passingScorePercent={quiz.passingScorePercent}
                  questions={quiz.questions}
                  onCompleted={handleQuizCompleted}
                />
              ) : (
                <Card terminal className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-foreground">Generating quiz</CardTitle>
                    <CardDescription>Waiting for the Holocron…</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </Reveal>
        </section>

        <section id="student-profile" className="scroll-mt-24 space-y-6">
          <Reveal>
            <Card terminal className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-foreground">Student Profile</CardTitle>
                <CardDescription>Your account details for this session.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-muted-foreground">Full Name</span>
                  <span className="font-medium text-foreground">{profile?.fullName ?? '—'}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground">{profile?.email ?? '—'}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-muted-foreground">Class/Year</span>
                  <span className="font-medium text-foreground">{profile?.classYear ?? '—'}</span>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </section>

        <section id="chat" className="scroll-mt-24 space-y-6">
          <Reveal>
            {hasTamboKey ? (
              <TamboChat />
            ) : (
              <Card terminal className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-foreground">Holocron Chat</CardTitle>
                  <CardDescription>
                    Add a Tambo API key to enable Generative UI during chat.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Create a <span className="font-mono text-foreground">.env.local</span> file with:
                  </p>
                  <pre className="overflow-auto rounded-md border border-white/10 bg-white/5 p-3 text-sm">
                    NEXT_PUBLIC_TAMBO_API_KEY=your_key_here
                  </pre>
                  <p className="text-sm text-muted-foreground">
                    Restart <span className="font-mono text-foreground">pnpm dev</span> and ask for an interactive quiz
                    or progress tracker.
                  </p>
                </CardContent>
              </Card>
            )}
          </Reveal>
        </section>
      </main>
    </div>
  );
}
