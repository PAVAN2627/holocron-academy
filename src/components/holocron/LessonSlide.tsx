'use client';

import { z } from 'zod';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const lessonSlidePropsSchema = z.object({
  title: z.string(),
  content: z.string().describe('Plain text or Markdown'),
});

export type LessonSlideProps = z.infer<typeof lessonSlidePropsSchema>;

export function LessonSlide({ title, content }: LessonSlideProps) {
  return (
    <Card terminal className="border-ring/60 bg-muted/10">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{content}</p>
      </CardContent>
    </Card>
  );
}
