"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

import { env } from "@/config/env";

interface ProvidersProps {
  readonly children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider publishableKey={env.getClientEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")}>
      {children}
    </ClerkProvider>
  );
}
