"use client";

import { CustomizationForm } from "@/components/customization/CustomizationForm";
import { ProtectedRoute, useUserRole } from "@/components/auth/ProtectedRoute";

/**
 * 맞춤제작 요청 등록 페이지
 * Phase 10: CDM-US-01
 */

function NewCustomizationPageContent() {
  const { hasRole } = useUserRole();
  const canCreate = hasRole(["admin", "leader", "specialist", "technician"]);

  if (!canCreate) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">접근 권한이 없습니다</h2>
          <p className="mt-2 text-sm text-red-600">
            맞춤제작 요청 등록은 관리자, 팀장, 전문가, 기술자만 가능합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">새 맞춤제작 요청</h1>
        <p className="mt-2 text-sm text-gray-600">
          맞춤제작 요청 정보를 입력하세요. 필수 항목은 <span className="text-red-500">*</span>로
          표시됩니다.
        </p>
      </div>

      <CustomizationForm />
    </div>
  );
}

export default function NewCustomizationPage() {
  return (
    <ProtectedRoute>
      <NewCustomizationPageContent />
    </ProtectedRoute>
  );
}

