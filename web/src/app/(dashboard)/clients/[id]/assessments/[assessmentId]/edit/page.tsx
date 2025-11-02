"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AssessmentForm } from "@/components/clients/AssessmentForm";
import { ProtectedRoute, useUserRole } from "@/components/auth/ProtectedRoute";
import type { Assessment } from "@/lib/validations/assessment";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

/**
 * 평가 기록 수정 페이지
 * Sprint 1: CMS-US-05
 *
 * 접근 권한: 작성자 본인 또는 admin/leader만 가능
 */

function EditAssessmentPageContent({
  clientId,
  assessmentId,
}: {
  clientId: string;
  assessmentId: string;
}) {
  const router = useRouter();
  const { hasRole } = useUserRole();
  const [assessment, setAssessment] = useState<Partial<Assessment> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessment();
  }, [clientId, assessmentId]);

  async function fetchAssessment() {
    try {
      const response = await fetch(`/api/clients/${clientId}/assessments/${assessmentId}`);
      if (response.ok) {
        const data = await response.json();
        // content를 파싱하여 Assessment 타입으로 변환
        if (data.content) {
          try {
            const parsed = JSON.parse(data.content);
            setAssessment({
              ...data,
              assessment_type: parsed.assessment_type || data.assessment_type,
              items: parsed.items || [],
              total_score: parsed.total_score || data.total_score,
              summary: parsed.summary || data.summary,
            });
          } catch {
            setAssessment(data);
          }
        } else {
          setAssessment(data);
        }
      }
    } catch (error) {
      console.error("평가 기록 조회 실패:", error);
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

  if (!assessment) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">평가 기록을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">평가 기록 수정</h1>
        <p className="mt-2 text-sm text-gray-600">
          평가 기록을 수정합니다. 평가 항목과 점수를 수정할 수 있습니다.
        </p>
      </div>

      <AssessmentForm
        clientId={clientId}
        assessmentId={assessmentId}
        initialData={assessment}
        mode="edit"
      />
    </div>
  );
}

export default function EditAssessmentPage() {
  const params = useParams();
  const clientId = params.id as string;
  const assessmentId = params.assessmentId as string;

  return (
    <ProtectedRoute requiredRole={["admin", "leader", "specialist"]}>
      <EditAssessmentPageContent clientId={clientId} assessmentId={assessmentId} />
    </ProtectedRoute>
  );
}
