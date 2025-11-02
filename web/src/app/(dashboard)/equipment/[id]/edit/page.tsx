"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EquipmentForm } from "@/components/equipment/EquipmentForm";
import { ProtectedRoute, useUserRole } from "@/components/auth/ProtectedRoute";
import type { Equipment } from "@/lib/validations/equipment";

/**
 * 기기 수정 페이지
 * Sprint 1: ERM-US-01
 *
 * 접근 권한: admin, leader, technician만 가능
 */

function EditEquipmentPageContent({ equipmentId }: { equipmentId: string }) {
  const router = useRouter();
  const { hasRole } = useUserRole();
  const [equipment, setEquipment] = useState<Partial<Equipment> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipment();
  }, [equipmentId]);

  async function fetchEquipment() {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error("기기 조회 실패:", error);
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

  if (!equipment) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">기기를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">기기 수정</h1>
        <p className="mt-2 text-sm text-gray-600">
          기기 정보를 수정합니다.
        </p>
      </div>

      <EquipmentForm equipmentId={equipmentId} initialData={equipment} mode="edit" />
    </div>
  );
}

export default function EditEquipmentPage() {
  const params = useParams();
  const equipmentId = params.id as string;

  return (
    <ProtectedRoute requiredRole={["admin", "leader", "technician"]}>
      <EditEquipmentPageContent equipmentId={equipmentId} />
    </ProtectedRoute>
  );
}

