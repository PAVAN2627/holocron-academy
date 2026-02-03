import type { TamboComponent } from "@tambo-ai/react";
import { z } from "zod/v4";

import { AdaptiveQuiz } from "@/components/tambo/AdaptiveQuiz";
import { DroidCodeLab } from "@/components/tambo/DroidCodeLab";
import { GalaxyModule } from "@/components/tambo/GalaxyModule";

const quizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(z.string()).min(1),
  correctOption: z.string(),
});

export const tamboComponents = [
  {
    name: "AdaptiveQuiz",
    description:
      "A dynamic quiz that validates answers with Zod and triggers a lesson slide when the score is below a threshold.",
    component: AdaptiveQuiz,
    propsSchema: z.object({
      title: z.string().optional(),
      passThreshold: z.number().min(0).max(100).optional(),
      questions: z.array(quizQuestionSchema).min(1),
    }),
  },
  {
    name: "GalaxyModule",
    description:
      "A visual progress tracker that renders planets as milestones in a learning path.",
    component: GalaxyModule,
    propsSchema: z.object({
      title: z.string().optional(),
      milestones: z
        .array(
          z.object({
            name: z.string(),
            completed: z.boolean(),
          }),
        )
        .min(1),
    }),
  },
  {
    name: "DroidCodeLab",
    description:
      "A live code editor that highlights syntax errors in Sith Red.",
    component: DroidCodeLab,
    propsSchema: z.object({
      title: z.string().optional(),
      initialCode: z.string().optional(),
    }),
  },
] satisfies TamboComponent[];

export const tamboConfig = {
  components: tamboComponents,
};
