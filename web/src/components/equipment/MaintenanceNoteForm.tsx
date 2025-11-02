"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import {
  maintenanceNoteSchema,
  type MaintenanceNoteFormData,
  MAINTENANCE_TYPES,
  MAINTENANCE_TYPE_LABELS,
} from "@/lib/validations/maintenance-note";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { auditLogger } from "@/lib/logger/auditLogger";

/**
 * 유지보수 노트 작성 폼 컴포넌트
 * Sprint 1: ERM-US-03
 */

interface MaintenanceNoteFormProps {
  equipmentId: string;
  initialData?: Partial<MaintenanceNoteFormData>;
  maintenanceNoteId?: string;
  mode?: "create" | "edit";
}

export function MaintenanceNoteForm({
  equipmentId,
  initialData,
  maintenanceNoteId,
  mode = "create",
}: MaintenanceNoteFormProps) {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaintenanceNoteFormData>({
    resolver: zodResolver(maintenanceNoteSchema),
    defaultValues: {
      ...initialData,
      equipment_id: equipmentId,
      note_date: initialData?.note_date || new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: MaintenanceNoteFormData) => {
    setIsSubmitting(true);

    try {
      auditLogger.info(`maintenance_note_form_submitted_${mode}`, {
        metadata: { equipmentId, maintenanceNoteId, title: data.title },
      });

      // API 호출
      const url = `/api/equipment/${equipmentId}/maintenance-notes`;
      const method = "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "등록에 실패했습니다.");
      }

      const result = await response.json();

      success("유지보수 노트가 성공적으로 등록되었습니다.");

      auditLogger.info(`maintenance_note_form_success_${mode}`, {
        metadata: { maintenanceNoteId: result.id },
      });

      // 2초 후 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/equipment/${equipmentId}`);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.";
      showError(errorMessage);
      auditLogger.error(`maintenance_note_form_failed_${mode}`, {
        error: err,
        metadata: { errorMessage, equipmentId, maintenanceNoteId },
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
            {/* 제목 (필수) */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                {...register("title", { required: "제목은 필수 항목입니다." })}
                type="text"
                id="title"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="유지보수 노트 제목을 입력하세요"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            {/* 노트 작성일 */}
            <div>
              <label htmlFor="note_date" className="block text-sm font-medium text-gray-700">
                노트 작성일
              </label>
              <input
                {...register("note_date")}
                type="date"
                id="note_date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.note_date && (
                <p className="mt-1 text-sm text-red-600">{errors.note_date.message}</p>
              )}
            </div>

            {/* 유지보수 유형 */}
            <div>
              <label htmlFor="maintenance_type" className="block text-sm font-medium text-gray-700">
                유지보수 유형
              </label>
              <select
                {...register("maintenance_type")}
                id="maintenance_type"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">선택 안 함</option>
                {Object.entries(MAINTENANCE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.maintenance_type && (
                <p className="mt-1 text-sm text-red-600">{errors.maintenance_type.message}</p>
              )}
            </div>

            {/* 비용 */}
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                비용
              </label>
              <input
                {...register("cost", {
                  valueAsNumber: true,
                  min: { value: 0, message: "비용은 0 이상이어야 합니다." },
                })}
                type="number"
                id="cost"
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0"
              />
              {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>}
            </div>

            {/* 내용 */}
            <div className="md:col-span-2">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                내용
              </label>
              <textarea
                {...register("content")}
                id="content"
                rows={8}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="유지보수 내용을 자유롭게 기록하세요"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
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
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </>
  );
}
