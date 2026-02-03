'use client';

import { TamboProvider } from '@tambo-ai/react';
import type { PropsWithChildren } from 'react';

import { tamboComponents } from '@/tambo/config';

export function Providers({ apiKey, children }: PropsWithChildren<{ apiKey?: string }>) {
  if (!apiKey) return children;

  return (
    <TamboProvider
      apiKey={apiKey}
      components={tamboComponents}
      initialMessages={[
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: [
                "You are Holocron Academy's AI tutor.",
                'Use the registered UI components to teach: AdaptiveQuiz, GalaxyModule, and DroidCodeLab.',
                'Keep responses concise and interactive.',
              ].join(' '),
            },
          ],
        },
      ]}
    >
      {children}
    </TamboProvider>
  );
}
