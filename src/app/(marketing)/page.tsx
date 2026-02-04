import Link from 'next/link';
import { ArrowRight, Radar, Sparkles, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="pb-12 pt-14">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.36em] text-muted-foreground">UI Strikes Back Hackathon</p>
          <h1 className="text-4xl font-semibold tracking-tight text-sky-100 sm:text-5xl">
            A cinematic learning platform powered by a living Holocron.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Holocron Academy blends generative UI, adaptive quizzes, and a star-chart progress tracker — all rendered
            through a holographic terminal skin.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="gap-2">
              <Link href="/login?next=/dashboard">
                Enter the Academy
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register?next=/dashboard">Create an account</Link>
            </Button>
          </div>
        </div>

        <Card terminal className="border-sky-500/30 bg-background/40">
          <CardHeader>
            <CardTitle className="text-sky-100">Transmission</CardTitle>
            <CardDescription>Pick a side. The interface adapts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Rebel cadets get cool blue holographics. Imperial recruits get Sith red accents. Either way, the scanlines
              never stop.
            </p>
            <p>
              Head to the dashboard to see the GalaxyModule and AdaptiveQuiz live, or open the Holocron Terminal once
              your Tambo key is configured.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        <Card terminal className="border-sky-500/30 bg-background/30">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-sky-100">
              <Radar className="h-5 w-5" />
              <CardTitle>GalaxyModule</CardTitle>
            </div>
            <CardDescription>Track milestones as a star chart.</CardDescription>
          </CardHeader>
        </Card>

        <Card terminal className="border-sky-500/30 bg-background/30">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-sky-100">
              <Sparkles className="h-5 w-5" />
              <CardTitle>AdaptiveQuiz</CardTitle>
            </div>
            <CardDescription>Fail a question and Sith Mode unlocks.</CardDescription>
          </CardHeader>
        </Card>

        <Card terminal className="border-sky-500/30 bg-background/30">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-sky-100">
              <Wand2 className="h-5 w-5" />
              <CardTitle>Holocron Terminal</CardTitle>
            </div>
            <CardDescription>Ask the agent and watch UI render mid-stream.</CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
