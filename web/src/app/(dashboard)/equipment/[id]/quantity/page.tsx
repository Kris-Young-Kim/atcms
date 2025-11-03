"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  equipmentQuantityUpdateSchema,
  type EquipmentQuantityUpdateData,
} from "@/lib/validations/equipment";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { auditLogger } from "@/lib/logger/auditLogger";
import type { Equipment } from "@/lib/validations/equipment";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

/**
 * 기기 수량 조정 페이지
 * Sprint 1: ERM-US-01
 *
 * 접근 권한: admin, leader, technician만 가능
 */

function QuantityAdjustPageContent({ equipmentId }: { equipmentId: string }) {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EquipmentQuantityUpdateData>({
    resolver: zodResolver(equipmentQuantityUpdateSchema),
    defaultValues: {
      total_quantity: 0,
      available_quantity: 0,
    },
  });

  const totalQuantity = watch("total_quantity") || 0;

  const fetchEquipment = useCallback(async () => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
        setValue("total_quantity", data.total_quantity || 0);
        setValue("available_quantity", data.available_quantity || 0);
      }
    } catch (error) {
      showError("기기 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [equipmentId, setValue, showError]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const onSubmit = async (data: EquipmentQuantityUpdateData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/equipment/${equipmentId}/quantity`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        success("수량이 성공적으로 조정되었습니다.");
        auditLogger.info("equipment_quantity_adjusted", {
          metadata: { equipmentId, ...data },
        });
        setTimeout(() => {
          router.push(`/equipment/${equipmentId}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "수량 조정에 실패했습니다.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "수량 조정 중 오류가 발생했습니다.";
      showError(errorMessage);
      auditLogger.error("equipment_quantity_adjust_failed", {
        error: err,
        metadata: { equipmentId },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const rentedQuantity = (equipment.total_quantity || 0) - (equipment.available_quantity || 0);

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">기기 수량 조정</h1>
          <p className="mt-2 text-sm text-gray-600">{equipment.name}의 수량을 조정합니다.</p>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h2 className="text-sm font-medium text-gray-700">현재 수량 정보</h2>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">전체 수량:</span>
              <span className="ml-2 font-medium">{equipment.total_quantity || 0}개</span>
            </div>
            <div>
              <span className="text-gray-500">가용 수량:</span>
              <span className="ml-2 font-medium">{equipment.available_quantity || 0}개</span>
            </div>
            <div>
              <span className="text-gray-500">대여 중:</span>
              <span className="ml-2 font-medium">{rentedQuantity}개</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">수량 조정</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* 전체 수량 */}
              <div>
                <label htmlFor="total_quantity" className="block text-sm font-medium text-gray-700">
                  전체 수량 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("total_quantity", {
                    required: "전체 수량은 필수 항목입니다.",
                    valueAsNumber: true,
                    min: { value: 0, message: "수량은 0 이상이어야 합니다." },
                  })}
                  type="number"
                  id="total_quantity"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.total_quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.total_quantity.message}</p>
                )}
              </div>

              {/* 가용 수량 */}
              <div>
                <label
                  htmlFor="available_quantity"
                  className="block text-sm font-medium text-gray-700"
                >
                  가용 수량 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("available_quantity", {
                    required: "가용 수량은 필수 항목입니다.",
                    valueAsNumber: true,
                    min: { value: 0, message: "수량은 0 이상이어야 합니다." },
                    validate: (value) => {
                      if (value > totalQuantity) {
                        return "가용 수량은 전체 수량을 초과할 수 없습니다.";
                      }
                      return true;
                    },
                  })}
                  type="number"
                  id="available_quantity"
                  min="0"
                  max={totalQuantity}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.available_quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.available_quantity.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  최대 {totalQuantity}개까지 입력 가능 (대여 중: {rentedQuantity}개)
                </p>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "저장 중..." : "수량 조정"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function QuantityAdjustPage() {
  const params = useParams();
  const equipmentId = params.id as string;

  return (
    <ProtectedRoute requiredRole={["admin", "leader", "technician"]}>
      <QuantityAdjustPageContent equipmentId={equipmentId} />
    </ProtectedRoute>
  );
}
