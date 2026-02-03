'use client';

import { useMemo } from 'react';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{title}</CardTitle>
            {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
          </div>
          <Badge variant="secondary">{progress}%</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Progress value={progress} />

        <div className="grid gap-3 sm:grid-cols-2">
          {planets.map((planet, index) => {
            const isCurrent = index === safeIndex;
            const isComplete = index < safeIndex;

            return (
              <div
                key={`${planet.name}-${index}`}
                className={cn(
                  'rounded-md border bg-card px-3 py-2',
                  isCurrent && 'border-ring bg-accent/30',
                  isComplete && !isCurrent && 'border-border/60'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{planet.name}</p>
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
