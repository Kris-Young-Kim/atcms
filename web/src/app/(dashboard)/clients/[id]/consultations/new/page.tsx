"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ConsultationForm } from "@/components/clients/ConsultationForm";
import { ProtectedRoute, useUserRole } from "@/components/auth/ProtectedRoute";

/**
 * 상담 기록 등록 페이지
 * Sprint 1: CMS-US-04
 *
 * 접근 권한: admin, leader, specialist만 가능
 */

function NewConsultationPageContent({ clientId }: { clientId: string }) {
  const { hasRole } = useUserRole();
  const canCreate = hasRole(["admin", "leader", "specialist"]);

  if (!canCreate) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">접근 권한이 없습니다</h2>
          <p className="mt-2 text-sm text-red-600">
            상담 기록 등록은 관리자, 팀장, 전문가만 가능합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">새 상담 기록</h1>
        <p className="mt-2 text-sm text-gray-600">
          상담 내용을 기록하세요. SOAP 형식을 사용할 수 있습니다.
        </p>
      </div>

      <ConsultationForm clientId={clientId} />
    </div>
  );
}

export default function NewConsultationPage() {
  const params = useParams();
  const clientId = params.id as string;

  return (
    <ProtectedRoute requiredRole={["admin", "leader", "specialist"]}>
      <NewConsultationPageContent clientId={clientId} />
    </ProtectedRoute>
  );
}
