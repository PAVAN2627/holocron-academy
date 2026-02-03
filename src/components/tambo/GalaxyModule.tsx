"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type GalaxyMilestone = {
  name: string;
  completed: boolean;
};

export type GalaxyModuleProps = {
  title?: string;
  milestones: GalaxyMilestone[];
};

export function GalaxyModule({
  title = "Galaxy Module",
  milestones,
}: GalaxyModuleProps) {
  const completedCount = milestones.filter((m) => m.completed).length;

  return (
    <Card className="border-emerald-500/25 bg-card/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base text-emerald-100">{title}</CardTitle>
        <p className="text-sm text-emerald-100/70">
          {completedCount}/{milestones.length} planets stabilized
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          {milestones.map((m) => (
            <div key={m.name} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "h-12 w-12 rounded-full border border-emerald-500/25 shadow-[0_0_16px_rgba(16,185,129,0.15)]",
                  m.completed
                    ? "bg-gradient-to-br from-emerald-300/80 to-emerald-700/60"
                    : "bg-gradient-to-br from-slate-500/30 to-slate-950/60",
                )}
              />
              <span
                className={cn(
                  "text-xs",
                  m.completed ? "text-emerald-100" : "text-emerald-100/60",
                )}
              >
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
