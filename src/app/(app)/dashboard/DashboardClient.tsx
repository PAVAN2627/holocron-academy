'use client';

import { useMemo, useState } from 'react';

import { AdaptiveQuiz, type AdaptiveQuizCompletion } from '@/components/holocron/AdaptiveQuiz';
import { GalaxyModule } from '@/components/holocron/GalaxyModule';
import { Reveal } from '@/components/motion/Reveal';
import { TamboChat } from '@/components/tambo/TamboChat';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

type QuizProgress = {
  attempts: number;
  passed: number;
  totalPercent: number;
  lastPercent: number | null;
};

// In-memory demo state (not persisted across refreshes).

type DashboardClientProps = {
  hasTamboKey: boolean;
};

export function DashboardClient({ hasTamboKey }: DashboardClientProps) {
  const [quizProgress, setQuizProgress] = useState<QuizProgress>({
    attempts: 0,
    passed: 0,
    totalPercent: 0,
    lastPercent: null,
  });

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
            <GalaxyModule
              title="GalaxyModule"
              planets={[
                { name: 'Tatooine', description: 'Fundamentals' },
                { name: 'Coruscant', description: 'UI patterns' },
                { name: 'Dagobah', description: 'Adaptive practice' },
                { name: 'Mustafar', description: 'Error handling' },
              ]}
              currentIndex={1}
              subtitle="Milestones tracked as planets"
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div id="quizzes" className="scroll-mt-24">
              <AdaptiveQuiz
                title="Jedi Trials"
                passingScorePercent={60}
                questions={[
                  {
                    id: 'q1',
                    prompt: 'In Next.js 14, where does the App Router live by default?',
                    choices: ['pages/', 'app/', 'src/app/', 'routes/'],
                    correctIndex: 2,
                    explanation: 'This repo uses create-next-app with the src directory enabled.',
                    lessonSlide: {
                      title: 'App Router refresher',
                      content:
                        'The App Router lives in src/app/. Each folder can define a route segment, and layout/page files compose your UI.',
                    },
                  },
                  {
                    id: 'q2',
                    prompt: 'What should happen if the quiz score is below 60%?',
                    choices: ['Show a remediation slide', 'Close the app', 'Hide the score', 'Restart the browser'],
                    correctIndex: 0,
                    explanation: 'Holocron Academy nudges the learner with extra context.',
                  },
                  {
                    id: 'q3',
                    prompt: 'What is Tambo used for in this project?',
                    choices: ['Image optimization', 'Generative UI / component hydration', 'Database migrations', 'CSS minification'],
                    correctIndex: 1,
                    explanation: 'We register UI components so Tambo can respond with interactive experiences.',
                  },
                ]}
                remediation={{
                  title: 'Lesson: Passing the basics',
                  content: 'Review the explanations above and try again. The Holocron adapts when you need extra context.',
                }}
                onCompleted={handleQuizCompleted}
              />
            </div>
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
