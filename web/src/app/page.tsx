"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [hasClerkKey, setHasClerkKey] = useState(true);
  
  // Clerk 키 존재 여부 확인
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    setHasClerkKey(!!key && key !== "pk_test_placeholder");
  }, []);

  // Clerk가 설정된 경우에만 useUser 훅 사용
  let isLoaded = true;
  let isSignedIn = false;
  
  if (hasClerkKey) {
    try {
      const user = useUser();
      isLoaded = user.isLoaded;
      isSignedIn = user.isSignedIn;
    } catch (error) {
      // Clerk Provider가 없는 경우 무시
      console.log("Clerk not available");
    }
  }

  useEffect(() => {
    // 로그인 상태이면 대시보드로 리디렉션
    if (hasClerkKey && isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [hasClerkKey, isLoaded, isSignedIn, router]);

  if (hasClerkKey && !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  // 로그인되지 않은 경우 랜딩 페이지 표시
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <span className="text-6xl">🏥</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900">AT-Care</h1>
          <p className="mt-4 text-xl text-gray-600">보조공학 사례관리 시스템</p>
          <p className="mx-auto mt-6 max-w-2xl text-gray-500">
            대상자 관리, 상담 기록, 기기 대여를 한 곳에서 관리할 수 있는 통합 플랫폼입니다.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/sign-in"
              className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              로그인
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              회원가입
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-3">
          {[
            {
              icon: "👥",
              title: "대상자 관리",
              description: "대상자 정보를 체계적으로 등록하고 관리합니다.",
            },
            {
              icon: "📝",
              title: "상담 기록",
              description: "상담 내용과 평가 결과를 기록하고 추적합니다.",
            },
            {
              icon: "🔧",
              title: "기기 관리",
              description: "보조기기 재고와 대여 현황을 실시간으로 관리합니다.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="text-4xl">{feature.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
