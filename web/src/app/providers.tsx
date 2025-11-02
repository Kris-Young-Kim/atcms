"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";


interface ProvidersProps {
  readonly children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Clerk 키가 없으면 Provider 없이 렌더링 (개발 모드)
  if (!publishableKey || publishableKey === "pk_test_placeholder") {
    console.warn(
      "⚠️ Clerk Publishable Key가 설정되지 않았습니다. " +
      "인증 기능을 사용하려면 .env.local에 NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY를 설정하세요."
    );
    return <>{children}</>;
  }
  
  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
