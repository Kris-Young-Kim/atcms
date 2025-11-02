"use client";

import { ClientForm } from "@/components/clients/ClientForm";
import { ProtectedRoute, useUserRole } from "@/components/auth/ProtectedRoute";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

/**
 * 대상자 등록 페이지
 * Sprint 1: CMS-US-01
 *
 * 접근 권한: admin, leader, specialist만 가능
 */

function NewClientPageContent() {
  const { hasRole } = useUserRole();
  const canCreate = hasRole(["admin", "leader", "specialist"]);

  if (!canCreate) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">접근 권한이 없습니다</h2>
          <p className="mt-2 text-sm text-red-600">
            대상자 등록은 관리자, 팀장, 전문가만 가능합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">새 대상자 등록</h1>
        <p className="mt-2 text-sm text-gray-600">
          대상자의 기본 정보를 입력하세요. 필수 항목은 <span className="text-red-500">*</span>로
          표시됩니다.
        </p>
      </div>

      <ClientForm />
    </div>
  );
}

export default function NewClientPage() {
  return (
    <ProtectedRoute requiredRole={["admin", "leader", "specialist"]}>
      <NewClientPageContent />
    </ProtectedRoute>
  );
}
