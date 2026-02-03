import type { TamboComponent } from '@tambo-ai/react';

import { AdaptiveQuiz, adaptiveQuizPropsSchema } from '@/components/holocron/AdaptiveQuiz';
import { DroidCodeLab, droidCodeLabPropsSchema } from '@/components/holocron/DroidCodeLab';
import { GalaxyModule, galaxyModulePropsSchema } from '@/components/holocron/GalaxyModule';

export const tamboComponents: TamboComponent[] = [
  {
    name: 'AdaptiveQuiz',
    description:
      'A dynamic quiz builder. Takes a schema-driven question list, grades it, and can show a remediation LessonSlide when the score is below the passing threshold.',
    component: AdaptiveQuiz,
    propsSchema: adaptiveQuizPropsSchema,
  },
  {
    name: 'GalaxyModule',
    description:
      "A visual progress tracker that renders learning milestones as 'planets' and highlights the learner's current position.",
    component: GalaxyModule,
    propsSchema: galaxyModulePropsSchema,
  },
  {
    name: 'DroidCodeLab',
    description: "A live code lab with immediate syntax validation and error highlighting in 'Sith Red'.",
    component: DroidCodeLab,
    propsSchema: droidCodeLabPropsSchema,
  },
];
