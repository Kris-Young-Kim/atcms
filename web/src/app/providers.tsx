"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";


interface ProvidersProps {
  readonly children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // 개발 환경에서는 임시 키를 사용하여 항상 Provider를 렌더링
  // 프로덕션에서는 반드시 실제 키가 있어야 함
  const effectiveKey = publishableKey || "pk_test_placeholder";
  
  return <ClerkProvider publishableKey={effectiveKey}>{children}</ClerkProvider>;
}
