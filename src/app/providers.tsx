"use client";

import { TamboProvider } from "@tambo-ai/react";

import { tamboComponents } from "@/tambo/tamboConfig";

export function AppProviders({
  children,
  tamboApiKey,
}: {
  children: React.ReactNode;
  tamboApiKey: string | null;
}) {
  if (!tamboApiKey) return children;

  return (
    <TamboProvider apiKey={tamboApiKey} components={tamboComponents}>
      {children}
    </TamboProvider>
  );
}
