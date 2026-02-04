'use client';

import { Fragment, useMemo } from 'react';
import { CheckCircle2, Globe, Lock, Orbit, Star } from 'lucide-react';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const planetSchema = z.object({
  name: z.string().describe('Planet / milestone name'),
  description: z.string().optional().describe('Short milestone description'),
});

export const galaxyModulePropsSchema = z.object({
  title: z.string().default('Galaxy Module'),
  subtitle: z.string().optional(),
  planets: z.array(planetSchema).min(1),
  currentIndex: z.number().int().min(0).default(0),
});

export type GalaxyModuleProps = z.input<typeof galaxyModulePropsSchema>;

export function GalaxyModule({
  title = 'Galaxy Module',
  subtitle,
  planets,
  currentIndex = 0,
}: GalaxyModuleProps) {
  const safeIndex = Math.min(Math.max(currentIndex, 0), planets.length - 1);
  const progress = useMemo(() => {
    if (planets.length === 1) return 100;
    return Math.round((safeIndex / (planets.length - 1)) * 100);
  }, [planets.length, safeIndex]);

  const annotatedPlanets = useMemo(() => {
    return planets.map((planet, index) => {
      const isCurrent = index === safeIndex;
      const isComplete = index < safeIndex;
      const isLocked = index > safeIndex;

      return {
        key: `${planet.name}-${index}`,
        planet,
        index,
        isCurrent,
        isComplete,
        isLocked,
      };
    });
  }, [planets, safeIndex]);

  return (
    <Card terminal className="border-sky-500/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-sky-100">{title}</CardTitle>
            {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
          </div>
          <Badge variant="secondary" className="border-sky-500/30 bg-sky-500/10 text-sky-100">
            {progress}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/10 p-4 overflow-x-auto">
          <div className="relative min-w-max">
            <div className="absolute inset-x-4 top-5 h-px bg-gradient-to-r from-sky-500/0 via-sky-300/40 to-sky-500/0" />
            <div className="flex items-center justify-between gap-6">
              {annotatedPlanets.map(({ key, planet, index, isCurrent, isComplete, isLocked }) => {
                return (
                  <Fragment key={key}>
                    <div className="relative z-10 flex w-24 flex-col items-center gap-2">
                      <div
                        className={cn(
                          'relative flex h-10 w-10 items-center justify-center rounded-full border bg-background/30',
                          isCurrent && 'border-sky-300/70 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]',
                          isComplete && !isCurrent && 'border-sky-500/35 text-sky-100',
                          isLocked && 'border-border/40 text-muted-foreground'
                        )}
                      >
                        {isCurrent ? <Orbit className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                        {isComplete ? <CheckCircle2 className="absolute -bottom-1 -right-1 h-4 w-4 text-sky-200" /> : null}
                        {isLocked ? <Lock className="absolute -bottom-1 -right-1 h-4 w-4" /> : null}
                      </div>
                      <p className={cn('text-center text-xs', isLocked ? 'text-muted-foreground' : 'text-sky-100')}>
                        {planet.name}
                      </p>
                    </div>

                    {index < planets.length - 1 ? (
                      <Star
                        className={cn(
                          'h-4 w-4',
                          isComplete
                            ? 'text-sky-200'
                            : isCurrent
                              ? 'text-sky-300'
                              : 'text-muted-foreground/50'
                        )}
                      />
                    ) : null}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {annotatedPlanets.map(({ key, planet, isCurrent, isComplete }) => {
            return (
              <div
                key={key}
                className={cn(
                  'rounded-md border bg-card px-3 py-2',
                  isCurrent && 'border-sky-300/60 bg-sky-500/10',
                  isComplete && !isCurrent && 'border-border/60'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {isCurrent ? (
                      <Orbit className="h-4 w-4 text-sky-200" />
                    ) : (
                      <Globe className={cn('h-4 w-4', isComplete ? 'text-sky-200' : 'text-muted-foreground')} />
                    )}
                    <p className="truncate font-medium">{planet.name}</p>
                  </div>
                  <Badge variant={isCurrent ? 'default' : isComplete ? 'secondary' : 'outline'}>
                    {isCurrent ? 'You are here' : isComplete ? 'Cleared' : 'Locked'}
                  </Badge>
                </div>
                {planet.description ? <p className="mt-1 text-sm text-muted-foreground">{planet.description}</p> : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
