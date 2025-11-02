"use client";

import IntegratedSearchPage from "@/components/search/IntegratedSearch";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

/**
 * 통합 활동 검색 페이지
 * Phase 10: 통합 대상자 관리
 */
export default function SearchActivitiesPage() {
  return <IntegratedSearchPage />;
}
