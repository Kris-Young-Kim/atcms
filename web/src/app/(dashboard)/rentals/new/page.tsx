"use client";

import { RentalForm } from "@/components/rentals/RentalForm";
import { ProtectedRoute, useUserRole } from "@/components/auth/ProtectedRoute";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

/**
 * 새 대여 등록 페이지
 * Sprint 1: ERM-US-02
 *
 * 접근 권한: admin, leader, technician만 가능
 */

function NewRentalPageContent() {
  const { hasRole } = useUserRole();
  const canCreate = hasRole(["admin", "leader", "technician"]);

  if (!canCreate) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">접근 권한이 없습니다</h2>
          <p className="mt-2 text-sm text-red-600">
            대여 등록은 관리자, 팀장, 기술자만 가능합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">새 대여 등록</h1>
        <p className="mt-2 text-sm text-gray-600">기기 대여 정보를 입력하여 등록하세요.</p>
      </div>

      <RentalForm />
    </div>
  );
}

export default function NewRentalPage() {
  return (
    <ProtectedRoute requiredRole={["admin", "leader", "technician"]}>
      <NewRentalPageContent />
    </ProtectedRoute>
  );
}
