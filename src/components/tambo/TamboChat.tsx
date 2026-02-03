"use client";

import { useMemo } from "react";
import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ThreadMessage = {
  id: string;
  role?: string;
  content: unknown;
  renderedComponent?: React.ReactNode;
};

function isThreadMessage(m: unknown): m is ThreadMessage {
  return (
    m !== null &&
    typeof m === "object" &&
    "id" in m &&
    typeof (m as { id?: unknown }).id === "string" &&
    "content" in m
  );
}

function getTextParts(content: unknown) {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    const textSegments = content
      .filter(
        (p): p is { type?: unknown; text?: unknown } =>
          p !== null &&
          typeof p === "object" &&
          "type" in p &&
          (p as { type?: unknown }).type === "text" &&
          "text" in p,
      )
      .map((p) => p.text)
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0);

    return textSegments.length ? textSegments.join("\n") : null;
  }

  return null;
}

export function TamboChat() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  const messages = useMemo(() => {
    const raw = thread?.messages;
    if (!Array.isArray(raw)) return [];
    return (raw as unknown[]).filter(isThreadMessage);
  }, [thread]);

  return (
    <Card className="border-emerald-500/25 bg-card/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base text-emerald-100">Tambo Console</CardTitle>
        <p className="text-sm text-emerald-100/70">
          Ask for a quiz, a galaxy tracker, or a code lab.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-80 space-y-4 overflow-auto rounded-md border border-emerald-500/20 bg-background/10 p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-emerald-100/70">
              Start by asking: “Give me a 3 question quiz about HTML.”
            </p>
          ) : null}
          {messages.map((m) => {
            const text = getTextParts(m.content);
            const isUser = m.role === "user";

            return (
              <div
                key={m.id}
                className={cn(
                  "space-y-2",
                  isUser ? "text-right" : "text-left",
                )}
              >
                {text ? (
                  <p className="whitespace-pre-wrap text-sm text-emerald-100/90">
                    {text}
                  </p>
                ) : null}
                {m.renderedComponent ? (
                  <div className="pt-1">{m.renderedComponent}</div>
                ) : null}
              </div>
            );
          })}
        </div>

        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type a request..."
            className="border-emerald-500/25 bg-background/10 text-emerald-100 placeholder:text-emerald-100/40"
          />
          <Button
            type="submit"
            disabled={isPending}
            className="bg-emerald-400/20 text-emerald-50 hover:bg-emerald-400/30"
          >
            {isPending ? "Sending..." : "Send"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
