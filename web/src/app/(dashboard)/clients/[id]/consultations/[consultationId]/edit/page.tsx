"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConsultationForm } from "@/components/clients/ConsultationForm";
import { ProtectedRoute, useUserRole } from "@/components/auth/ProtectedRoute";
import type { Consultation } from "@/lib/validations/consultation";

/**
 * 상담 기록 수정 페이지
 * Sprint 1: CMS-US-04
 *
 * 접근 권한: 작성자 본인 또는 admin/leader만 가능
 */

function EditConsultationPageContent({
  clientId,
  consultationId,
}: {
  clientId: string;
  consultationId: string;
}) {
  const router = useRouter();
  const { hasRole } = useUserRole();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsultation();
  }, [clientId, consultationId]);

  async function fetchConsultation() {
    try {
      const response = await fetch(`/api/clients/${clientId}/consultations/${consultationId}`);
      if (response.ok) {
        const data = await response.json();
        setConsultation(data);
      }
    } catch (error) {
      console.error("상담 기록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">상담 기록을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">상담 기록 수정</h1>
        <p className="mt-2 text-sm text-gray-600">
          상담 기록을 수정합니다. SOAP 형식을 사용할 수 있습니다.
        </p>
      </div>

      <ConsultationForm
        clientId={clientId}
        consultationId={consultationId}
        initialData={consultation}
        mode="edit"
      />
    </div>
  );
}

export default function EditConsultationPage() {
  const params = useParams();
  const clientId = params.id as string;
  const consultationId = params.consultationId as string;

  return (
    <ProtectedRoute requiredRole={["admin", "leader", "specialist"]}>
      <EditConsultationPageContent clientId={clientId} consultationId={consultationId} />
    </ProtectedRoute>
  );
}

