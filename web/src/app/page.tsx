"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  // Clerk 키 존재 여부 확인 (렌더링 시점에 직접 확인)
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerkKey = !!key && key !== "pk_test_placeholder";

  // React 훅 규칙 준수: 훅은 항상 컴포넌트 최상위에서 호출되어야 함
  // useUser는 ClerkProvider 내부에서 안전하게 호출됨 (Provider가 없으면 기본값 반환)
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    // 로그인 상태이면 대시보드로 리디렉션
    if (hasClerkKey && isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [hasClerkKey, isLoaded, isSignedIn, router]);

  if (hasClerkKey && !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-primary-600"></div>
          <p className="text-sm font-medium text-neutral-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우 랜딩 페이지 표시
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in">
          <div className="mb-8 flex justify-center">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 shadow-xl">
              <span className="text-6xl">🏥</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">AT-CMP</h1>
          <p className="mt-4 text-xl font-semibold text-gray-700">보조공학 사례관리 플랫폼</p>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 leading-relaxed">
            대상자 관리, 상담 기록, 기기 대여를 한 곳에서 체계적으로 관리할 수 있는
            <br />
            전문적인 통합 플랫폼입니다.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/sign-in"
              className="btn btn-primary inline-flex items-center justify-center gap-2 px-8 py-3 text-base"
            >
              로그인
            </Link>
            <Link
              href="/sign-up"
              className="btn btn-secondary inline-flex items-center justify-center gap-2 px-8 py-3 text-base"
            >
              회원가입
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-3 animate-slide-in">
          {[
            {
              icon: "👥",
              title: "대상자 관리",
              description: "대상자 정보를 체계적으로 등록하고 관리합니다.",
              gradient: "from-blue-500 to-cyan-500",
            },
            {
              icon: "📝",
              title: "상담 기록",
              description: "상담 내용과 평가 결과를 기록하고 추적합니다.",
              gradient: "from-purple-500 to-pink-500",
            },
            {
              icon: "🔧",
              title: "기기 관리",
              description: "보조기기 재고와 대여 현황을 실시간으로 관리합니다.",
              gradient: "from-indigo-500 to-blue-500",
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
              />
              <div className="relative">
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
