import { cookies } from 'next/headers';

import { AdaptiveQuiz } from '@/components/holocron/AdaptiveQuiz';
import { GalaxyModule } from '@/components/holocron/GalaxyModule';
import { TamboChat } from '@/components/tambo/TamboChat';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { coerceHolocronFaction, HOLOCRON_FACTION_COOKIE } from '@/lib/holocron-auth';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const hasTamboKey = Boolean(process.env.NEXT_PUBLIC_TAMBO_API_KEY);
  const faction = coerceHolocronFaction(cookies().get(HOLOCRON_FACTION_COOKIE)?.value);
  const accentTextClassName = faction === 'imperial' ? 'text-destructive' : 'text-sky-100';

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className={cn('text-2xl font-semibold tracking-tight sm:text-3xl', accentTextClassName)}>
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Your hub for modules, quizzes, and the Holocron Terminal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">GalaxyModule</Badge>
            <Badge variant="secondary">AdaptiveQuiz</Badge>
          </div>
        </div>
        <Separator />
      </header>

      <main className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-6">
          <GalaxyModule
            planets={[
              { name: 'Tatooine', description: 'Fundamentals' },
              { name: 'Coruscant', description: 'UI patterns' },
              { name: 'Dagobah', description: 'Adaptive practice' },
              { name: 'Mustafar', description: 'Error handling (careful)' },
            ]}
            currentIndex={1}
            subtitle="Milestones tracked as planets"
          />

          <AdaptiveQuiz
            title="Adaptive Quiz"
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
                choices: ['Show a LessonSlide remediation', 'Close the app', 'Hide the score', 'Restart the browser'],
                correctIndex: 0,
                explanation: 'Holocron Academy nudges the learner with a remediation slide.',
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
          />
        </section>

        <section className="space-y-6">
          {hasTamboKey ? (
            <TamboChat />
          ) : (
            <Card terminal className="border-sky-500/30">
              <CardHeader>
                <CardTitle>Holocron Terminal</CardTitle>
                <CardDescription>
                  To enable Generative UI in the terminal, add a Tambo API key to your environment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Create a <span className="font-mono text-foreground">.env.local</span> file with:
                </p>
                <pre className="overflow-auto rounded-md border bg-muted/20 p-3 text-sm">
                  NEXT_PUBLIC_TAMBO_API_KEY=your_key_here
                </pre>
                <p className="text-sm text-muted-foreground">
                  Restart <span className="font-mono text-foreground">pnpm dev</span> and ask for an interactive quiz
                  or progress tracker.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
