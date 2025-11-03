"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { reportWebVitals } from "@/lib/performance/web-vitals";

interface ProvidersProps {
  readonly children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Web Vitals 측정 초기화 (클라이언트에서만 실행, 한 번만 실행)
  useEffect(() => {
    if (typeof window !== "undefined") {
      reportWebVitals();
    }
  }, []);

  // ClerkProvider는 항상 렌더링되어야 합니다 (useUser 훅 사용 가능)
  // 키가 없으면 Clerk가 자체적으로 처리합니다
  if (!publishableKey || publishableKey === "pk_test_placeholder") {
    console.warn(
      "⚠️ Clerk Publishable Key가 설정되지 않았습니다. " +
        "인증 기능을 사용하려면 .env.local에 NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY를 설정하세요.",
    );
    // 개발 환경에서는 빈 키로도 Provider를 렌더링하여 오류 방지
    // 프로덕션에서는 키가 반드시 필요합니다
    const fallbackKey = process.env.NODE_ENV === "development" ? "pk_test_placeholder" : "";
    return <ClerkProvider publishableKey={fallbackKey || publishableKey}>{children}</ClerkProvider>;
  }

  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
