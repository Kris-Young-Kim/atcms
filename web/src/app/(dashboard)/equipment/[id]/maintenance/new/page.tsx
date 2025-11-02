"use client";

import { useParams } from "next/navigation";
import { MaintenanceNoteForm } from "@/components/equipment/MaintenanceNoteForm";
import { ProtectedRoute, useUserRole } from "@/components/auth/ProtectedRoute";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

/**
 * 새 유지보수 노트 작성 페이지
 * Sprint 1: ERM-US-03
 *
 * 접근 권한: admin, leader, technician만 가능
 */

function NewMaintenanceNotePageContent({ equipmentId }: { equipmentId: string }) {
  const { hasRole } = useUserRole();
  const canCreate = hasRole(["admin", "leader", "technician"]);

  if (!canCreate) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">접근 권한이 없습니다</h2>
          <p className="mt-2 text-sm text-red-600">
            유지보수 노트 작성은 관리자, 팀장, 기술자만 가능합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">새 유지보수 노트 작성</h1>
        <p className="mt-2 text-sm text-gray-600">유지보수 내용을 기록하세요.</p>
      </div>

      <MaintenanceNoteForm equipmentId={equipmentId} />
    </div>
  );
}

export default function NewMaintenanceNotePage() {
  const params = useParams();
  const equipmentId = params.id as string;

  return (
    <ProtectedRoute requiredRole={["admin", "leader", "technician"]}>
      <NewMaintenanceNotePageContent equipmentId={equipmentId} />
    </ProtectedRoute>
  );
}
