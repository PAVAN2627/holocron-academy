'use client';

import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export const droidCodeLabPropsSchema = z.object({
  title: z.string().default('Droid Code Lab'),
  instructions: z.string().optional(),
  starterCode: z.string().describe('Initial code shown in the editor'),
});

export type DroidCodeLabProps = z.input<typeof droidCodeLabPropsSchema>;

function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

export function DroidCodeLab({ title = 'Droid Code Lab', instructions, starterCode }: DroidCodeLabProps) {
  const [code, setCode] = useState(starterCode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setCode(starterCode);
  }, [starterCode]);

  const isValid = useMemo(() => errorMessage === null, [errorMessage]);

  function validate(nextCode: string) {
    try {
      // Syntax check only. We intentionally don't execute untrusted user code.
      // eslint-disable-next-line no-new-func
      new Function(nextCode);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(normalizeError(err));
    }
  }

  return (
    <Card terminal className="border-sky-500/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{title}</CardTitle>
            {instructions ? <CardDescription>{instructions}</CardDescription> : null}
          </div>
          <Badge variant={isValid ? 'default' : 'destructive'}>{isValid ? 'Green' : 'Sith Red'}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <Textarea
          value={code}
          onChange={(e) => {
            const next = e.target.value;
            setCode(next);
            validate(next);
          }}
          className={cn('min-h-[160px] font-mono text-sm', !isValid && 'border-destructive focus-visible:ring-destructive')}
          spellCheck={false}
        />

        {errorMessage ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 font-mono text-sm text-destructive">
            {errorMessage}
          </div>
        ) : (
          <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
            No syntax errors detected.
          </div>
        )}

        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setCode(starterCode);
            validate(starterCode);
          }}
        >
          Restore starter code
        </Button>
      </CardContent>
    </Card>
  );
}
