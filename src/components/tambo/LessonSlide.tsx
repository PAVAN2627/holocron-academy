"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type LessonSlideProps = {
  title: string;
  summary: string;
  highlights: string[];
};

export function LessonSlide({ title, summary, highlights }: LessonSlideProps) {
  return (
    <Card className="border-emerald-500/30 bg-card/60">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base text-emerald-100">{title}</CardTitle>
          <Badge variant="outline" className="border-emerald-500/40">
            Lesson slide
          </Badge>
        </div>
        <p className="text-sm text-emerald-100/80">{summary}</p>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-2 pl-5 text-sm text-emerald-100/80">
          {highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
