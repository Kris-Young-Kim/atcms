"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";


interface ProvidersProps {
  readonly children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    // 빌드/프리렌더 단계에서 키가 없으면 Provider를 생략해 SSR 오류를 방지합니다.
    return <>{children}</>;
  }
  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
