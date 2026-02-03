'use client';

import { GenerationStage, useTamboThread, useTamboThreadInput } from '@tambo-ai/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function extractText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
}

export function TamboChat() {
  const { thread, generationStage, generationStatusMessage } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  const canSend = generationStage === GenerationStage.IDLE && !isPending;

  return (
    <Card className="terminal-overlay border-sky-500/30">
      <CardHeader>
        <CardTitle>Holocron Terminal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[420px] space-y-3 overflow-auto rounded-md border bg-background/40 p-3">
          {thread.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask for a quiz, a lesson plan, or a progress tracker. Tambo can respond with interactive UI.
            </p>
          ) : null}

          {thread.messages.map((message) => {
            const text = extractText(message.content);
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={cn(
                  'rounded-md border px-3 py-2',
                  isUser ? 'ml-auto w-[92%] bg-accent/20 sm:w-[84%]' : 'mr-auto w-[92%] bg-muted/10 sm:w-[84%]'
                )}
              >
                <p className="text-xs text-muted-foreground">{isUser ? 'You' : 'Holocron'}</p>
                {text ? <p className="whitespace-pre-wrap text-sm">{text}</p> : null}
                {message.renderedComponent ? <div className="mt-3">{message.renderedComponent}</div> : null}
              </div>
            );
          })}

          {generationStage !== GenerationStage.IDLE ? (
            <p className="text-xs text-muted-foreground">{generationStatusMessage || 'Generating…'}</p>
          ) : null}
        </div>

        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSend) return;
            await submit({ streamResponse: true });
          }}
        >
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask the Holocron…"
            disabled={!canSend}
          />
          <Button type="submit" disabled={!canSend || value.trim().length === 0}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
