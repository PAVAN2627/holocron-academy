"use client";

import { useState } from "react";
import * as acorn from "acorn";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type DroidCodeLabProps = {
  title?: string;
  initialCode?: string;
};

function getSyntaxErrorMessage(code: string) {
  try {
    acorn.parse(code, { ecmaVersion: "latest" });
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

export function DroidCodeLab({
  title = "Droid Code Lab",
  initialCode = "const greeting = 'Hello, Padawan'\nconsole.log(greeting)",
}: DroidCodeLabProps) {
  const [code, setCode] = useState(initialCode);
  const errorMessage = getSyntaxErrorMessage(code);
  const hasError = errorMessage !== null;

  return (
    <Card className="border-emerald-500/25 bg-card/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base text-emerald-100">{title}</CardTitle>
        <p className="text-sm text-emerald-100/70">
          Syntax errors are highlighted in Sith Red.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="droid-code" className="text-emerald-100/80">
            Code
          </Label>
          <Textarea
            id="droid-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={
              "min-h-40 font-mono text-sm " +
              (hasError
                ? "border-[var(--sith-red)] shadow-[0_0_0_1px_var(--sith-red)] focus-visible:ring-[var(--sith-red)]"
                : "border-emerald-500/25 focus-visible:ring-emerald-400/40")
            }
          />
        </div>

        {hasError ? (
          <div className="rounded-md border border-[var(--sith-red)]/60 bg-[color-mix(in_oklab,var(--sith-red)_12%,transparent)] p-3">
            <p className="text-sm font-medium text-[var(--sith-red)]">
              {errorMessage}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-500/25 bg-background/10 p-3">
            <p className="text-sm text-emerald-100/80">No syntax errors found.</p>
            <Button
              type="button"
              variant="outline"
              className="border-emerald-500/30 text-emerald-100 hover:bg-emerald-400/10"
              onClick={() => setCode(initialCode)}
            >
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
