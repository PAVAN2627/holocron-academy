import Link from 'next/link';
import { ArrowRight, GraduationCap, LineChart, MessagesSquare } from 'lucide-react';

import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="pb-12 pt-14">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal className="space-y-6">
          <p className="text-xs uppercase tracking-[0.36em] text-muted-foreground">Professional demo</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            A polished education platform with a Star Wars-inspired interface.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Holocron Academy combines adaptive quizzes, progress tracking, and agent-driven chat — wrapped in a deep
            navy holographic theme.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="gap-2">
              <Link href="/signup?next=/dashboard">
                Enroll Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-primary/20 bg-white/5 hover:bg-white/10">
              <Link href="/login?next=/dashboard">Log in</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <Card terminal className="border-primary/20 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-foreground">Welcome</CardTitle>
              <CardDescription>A full user journey, ready for the hackathon demo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Start on this page, sign up, and land inside a protected dashboard that hosts the quiz, progress
                tracker, and Holocron chat.
              </p>
              <p>
                Primary actions use Jedi Blue, the background is Deep Navy, and Sith Red stays reserved for errors and
                warnings.
              </p>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        <Reveal delay={0.05}>
          <Card terminal className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 text-foreground">
                <LineChart className="h-5 w-5 text-primary" />
                <CardTitle>My Progress</CardTitle>
              </div>
              <CardDescription>Track milestones and quiz outcomes in real time.</CardDescription>
            </CardHeader>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card terminal className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 text-foreground">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle>Jedi Trials</CardTitle>
              </div>
              <CardDescription>Adaptive questions with a remediation slide when needed.</CardDescription>
            </CardHeader>
          </Card>
        </Reveal>

        <Reveal delay={0.15}>
          <Card terminal className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 text-foreground">
                <MessagesSquare className="h-5 w-5 text-primary" />
                <CardTitle>Holocron Chat</CardTitle>
              </div>
              <CardDescription>Ask the agent and watch UI appear mid-stream.</CardDescription>
            </CardHeader>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
