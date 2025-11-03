"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { ClientForm } from "@/components/clients/ClientForm";
import type { Client } from "@/lib/validations/client";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

/**
 * 대상자 수정 페이지
 * ClientForm 재사용
 */

export default function EditClientPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = useCallback(async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      }
    } catch (error) {
      console.error("대상자 정보 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">대상자를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대상자 정보 수정</h1>
        <p className="mt-2 text-sm text-gray-600">
          {client.name}님의 정보를 수정합니다. 필수 항목은 <span className="text-red-500">*</span>로
          표시됩니다.
        </p>
      </div>

      <ClientForm initialData={client} clientId={clientId} mode="edit" />
    </div>
  );
}
