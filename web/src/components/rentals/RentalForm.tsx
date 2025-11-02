"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { rentalSchema, type RentalFormData } from "@/lib/validations/rental";
import type { Equipment } from "@/lib/validations/equipment";
import type { Client } from "@/lib/validations/client";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { auditLogger } from "@/lib/logger/auditLogger";

/**
 * 대여 신청 폼 컴포넌트
 * Sprint 1: ERM-US-02
 */

interface RentalFormProps {
  initialData?: Partial<RentalFormData>;
  rentalId?: string;
  mode?: "create" | "edit";
  equipmentId?: string; // 기기 상세 페이지에서 호출 시
  clientId?: string; // 대상자 상세 페이지에서 호출 시
}

export function RentalForm({
  initialData,
  rentalId,
  mode = "create",
  equipmentId,
  clientId,
}: RentalFormProps) {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [clientList, setClientList] = useState<Client[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RentalFormData>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      ...initialData,
      equipment_id: equipmentId || initialData?.equipment_id,
      client_id: clientId || initialData?.client_id,
      rental_date: initialData?.rental_date || new Date().toISOString().split("T")[0],
      quantity: initialData?.quantity || 1,
    },
  });

  const selectedEquipmentId = watch("equipment_id");
  const quantity = watch("quantity") || 1;

  // 기기 목록 로드
  useEffect(() => {
    fetchEquipmentList();
  }, []);

  // 대상자 목록 로드
  useEffect(() => {
    fetchClientList();
  }, []);

  // 선택된 기기 정보 로드
  useEffect(() => {
    if (selectedEquipmentId) {
      const equipment = equipmentList.find((eq) => eq.id === selectedEquipmentId);
      setSelectedEquipment(equipment || null);
    } else {
      setSelectedEquipment(null);
    }
  }, [selectedEquipmentId, equipmentList]);

  async function fetchEquipmentList() {
    try {
      setLoadingEquipment(true);
      const response = await fetch("/api/equipment?status=normal");
      if (response.ok) {
        const data = await response.json();
        setEquipmentList(data.data || []);
      }
    } catch (error) {
      showError("기기 목록을 불러올 수 없습니다.");
    } finally {
      setLoadingEquipment(false);
    }
  }

  async function fetchClientList() {
    try {
      setLoadingClients(true);
      const response = await fetch("/api/clients?status=active");
      if (response.ok) {
        const data = await response.json();
        setClientList(data.data || []);
      }
    } catch (error) {
      showError("대상자 목록을 불러올 수 없습니다.");
    } finally {
      setLoadingClients(false);
    }
  }

  const onSubmit = async (data: RentalFormData) => {
    setIsSubmitting(true);

    try {
      auditLogger.info(`rental_form_submitted_${mode}`, {
        metadata: { rentalId, equipmentId: data.equipment_id, clientId: data.client_id },
      });

      // API 호출
      const url = mode === "edit" ? `/api/rentals/${rentalId}` : "/api/rentals";
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `${mode === "edit" ? "수정" : "등록"}에 실패했습니다.`);
      }

      const result = await response.json();

      success(
        mode === "edit"
          ? "대여 기록이 성공적으로 수정되었습니다."
          : "대여가 성공적으로 등록되었습니다.",
      );

      auditLogger.info(`rental_form_success_${mode}`, {
        metadata: { rentalId: result.id },
      });

      // 2초 후 목록 페이지로 이동
      setTimeout(() => {
        router.push("/rentals");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `${mode === "edit" ? "수정" : "등록"} 중 오류가 발생했습니다.`;
      showError(errorMessage);
      auditLogger.error(`rental_form_failed_${mode}`, {
        error: err,
        metadata: { errorMessage, rentalId },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* 기본 정보 섹션 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">기본 정보</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 기기 선택 */}
            <div>
              <label htmlFor="equipment_id" className="block text-sm font-medium text-gray-700">
                기기 <span className="text-red-500">*</span>
              </label>
              <select
                {...register("equipment_id", { required: "기기를 선택하세요." })}
                id="equipment_id"
                disabled={!!equipmentId || loadingEquipment}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">기기를 선택하세요</option>
                {equipmentList.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} {eq.brand && `(${eq.brand})`} - 가용: {eq.available_quantity || 0}개
                  </option>
                ))}
              </select>
              {errors.equipment_id && (
                <p className="mt-1 text-sm text-red-600">{errors.equipment_id.message}</p>
              )}
              {selectedEquipment && (
                <p className="mt-1 text-xs text-gray-500">
                  가용 수량: {selectedEquipment.available_quantity || 0}개 / 전체 수량:{" "}
                  {selectedEquipment.total_quantity || 0}개
                </p>
              )}
            </div>

            {/* 대상자 선택 */}
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                대상자 <span className="text-red-500">*</span>
              </label>
              <select
                {...register("client_id", { required: "대상자를 선택하세요." })}
                id="client_id"
                disabled={!!clientId || loadingClients}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">대상자를 선택하세요</option>
                {clientList.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
              )}
            </div>

            {/* 대여일 */}
            <div>
              <label htmlFor="rental_date" className="block text-sm font-medium text-gray-700">
                대여일
              </label>
              <input
                {...register("rental_date")}
                type="date"
                id="rental_date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.rental_date && (
                <p className="mt-1 text-sm text-red-600">{errors.rental_date.message}</p>
              )}
            </div>

            {/* 예상 반납일 */}
            <div>
              <label
                htmlFor="expected_return_date"
                className="block text-sm font-medium text-gray-700"
              >
                예상 반납일
              </label>
              <input
                {...register("expected_return_date")}
                type="date"
                id="expected_return_date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.expected_return_date && (
                <p className="mt-1 text-sm text-red-600">{errors.expected_return_date.message}</p>
              )}
            </div>

            {/* 수량 */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                수량 <span className="text-red-500">*</span>
              </label>
              <input
                {...register("quantity", {
                  required: "수량은 필수 항목입니다.",
                  valueAsNumber: true,
                  min: { value: 1, message: "수량은 1 이상이어야 합니다." },
                  validate: (value) => {
                    if (selectedEquipment && value > (selectedEquipment.available_quantity || 0)) {
                      return `가용 수량(${selectedEquipment.available_quantity || 0}개)을 초과할 수 없습니다.`;
                    }
                    return true;
                  },
                })}
                type="number"
                id="quantity"
                min="1"
                max={selectedEquipment?.available_quantity || 999}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
              {selectedEquipment && (
                <p className="mt-1 text-xs text-gray-500">
                  최대 {selectedEquipment.available_quantity || 0}개까지 대여 가능
                </p>
              )}
            </div>

            {/* 메모 */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                메모
              </label>
              <textarea
                {...register("notes")}
                id="notes"
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="대여 관련 메모를 입력하세요"
              />
              {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
            </div>
          </div>
        </section>

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
            disabled={isSubmitting || loadingEquipment || loadingClients}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? mode === "edit"
                ? "수정 중..."
                : "등록 중..."
              : mode === "edit"
                ? "수정"
                : "대여 등록"}
          </button>
        </div>
      </form>
    </>
  );
}
