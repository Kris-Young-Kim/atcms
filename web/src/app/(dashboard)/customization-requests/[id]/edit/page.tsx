"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { CustomizationForm } from "@/components/customization/CustomizationForm";
import type { CustomizationRequest } from "@/lib/validations/customization";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

/**
 * 맞춤제작 요청 수정 페이지
 * Phase 10: CDM-US-02
 */

export default function EditCustomizationPage() {
  const params = useParams();
  const customizationId = params.id as string;

  const [customization, setCustomization] = useState<CustomizationRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomization = useCallback(async () => {
    try {
      const response = await fetch(`/api/customization-requests/${customizationId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomization(data);
      }
    } catch (error) {
      console.error("맞춤제작 요청 정보 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [customizationId]);

  useEffect(() => {
    fetchCustomization();
  }, [fetchCustomization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (!customization) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">맞춤제작 요청을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">맞춤제작 요청 수정</h1>
        <p className="mt-2 text-sm text-gray-600">
          {customization.title}의 정보를 수정합니다. 필수 항목은{" "}
          <span className="text-red-500">*</span>로 표시됩니다.
        </p>
      </div>

      <CustomizationForm
        initialData={customization}
        customizationId={customizationId}
        mode="edit"
        clientId={customization.client_id}
      />
    </div>
  );
}
