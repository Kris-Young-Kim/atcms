"use client";

import { useMemo, useState } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { ToastContainer, useToast } from "@/components/ui/Toast";
import { auditLogger } from "@/lib/logger/auditLogger";
import {
  equipmentSchema,
  type EquipmentFormData,
  EQUIPMENT_STATUS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CATEGORY_LABELS,
} from "@/lib/validations/equipment";

/**
 * 기기 등록/수정 폼 컴포넌트
 * Sprint 1: ERM-US-01
 */

interface EquipmentFormProps {
  initialData?: Partial<EquipmentFormData> & { id?: string };
  equipmentId?: string;
  mode?: "create" | "edit";
}

export function EquipmentForm({ initialData, equipmentId, mode = "create" }: EquipmentFormProps) {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = useMemo<Partial<EquipmentFormData>>(
    () => ({
      status: initialData?.status || EQUIPMENT_STATUS.NORMAL,
      total_quantity: initialData?.total_quantity ?? 1,
      available_quantity: initialData?.available_quantity ?? 0,
      ...initialData,
    }),
    [initialData],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues,
  });

  const totalQuantity = watch("total_quantity") ?? 0;
  const availableQuantity = watch("available_quantity") ?? 0;

  const onSubmit = async (data: EquipmentFormData) => {
    setIsSubmitting(true);

    try {
      auditLogger.info(`equipment_form_submitted_${mode}`, {
        metadata: { equipmentId, name: data.name },
      });

      // 가용 수량 검증
      if (data.available_quantity > data.total_quantity) {
        showError("가용 수량은 전체 수량을 초과할 수 없습니다.");
        setIsSubmitting(false);
        return;
      }

      // API 호출
      const url = mode === "edit" ? `/api/equipment/${equipmentId}` : "/api/equipment";
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
        mode === "edit" ? "기기가 성공적으로 수정되었습니다." : "기기가 성공적으로 등록되었습니다.",
      );

      auditLogger.info(`equipment_form_success_${mode}`, {
        metadata: { equipmentId: result.id },
      });

      // 2초 후 목록 페이지로 이동
      setTimeout(() => {
        router.push("/equipment");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `${mode === "edit" ? "수정" : "등록"} 중 오류가 발생했습니다.`;
      showError(errorMessage);
      auditLogger.error(`equipment_form_failed_${mode}`, {
        error: err,
        metadata: { errorMessage, equipmentId },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <BasicInfoSection register={register} errors={errors} />
        <QuantityInfoSection
          register={register}
          errors={errors}
          totalQuantity={totalQuantity}
          availableQuantity={availableQuantity}
        />
        <AdditionalInfoSection register={register} errors={errors} />
        <FormActions isSubmitting={isSubmitting} mode={mode} onCancel={() => router.back()} />
      </form>
    </>
  );
}

interface SectionProps {
  register: UseFormRegister<EquipmentFormData>;
}

interface SectionWithErrorsProps extends SectionProps {
  errors: FieldErrors<EquipmentFormData>;
}

function SectionContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function BasicInfoSection({ register, errors }: SectionWithErrorsProps) {
  return (
    <SectionContainer title="기본 정보">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            기기명 <span className="text-red-500">*</span>
          </label>
          <input
            {...register("name", { required: "기기명은 필수 항목입니다." })}
            type="text"
            id="name"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-required="true"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            카테고리
          </label>
          <select
            {...register("category")}
            id="category"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">선택 안 함</option>
            {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
            브랜드
          </label>
          <input
            {...register("brand")}
            type="text"
            id="brand"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>}
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">
            모델명
          </label>
          <input
            {...register("model")}
            type="text"
            id="model"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>}
        </div>

        <div>
          <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700">
            시리얼 번호
          </label>
          <input
            {...register("serial_number")}
            type="text"
            id="serial_number"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.serial_number && (
            <p className="mt-1 text-sm text-red-600">{errors.serial_number.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            상태
          </label>
          <select
            {...register("status")}
            id="status"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
        </div>
      </div>
    </SectionContainer>
  );
}

interface QuantitySectionProps extends SectionWithErrorsProps {
  totalQuantity: number;
  availableQuantity: number;
}

function QuantityInfoSection({
  register,
  errors,
  totalQuantity,
  availableQuantity,
}: QuantitySectionProps) {
  return (
    <SectionContainer title="수량 정보">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

        <div>
          <label htmlFor="available_quantity" className="block text-sm font-medium text-gray-700">
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
            최대 {totalQuantity}개까지 입력 가능 (대여 중:{" "}
            {Math.max(totalQuantity - availableQuantity, 0)}개)
          </p>
        </div>
      </div>
    </SectionContainer>
  );
}

function AdditionalInfoSection({ register, errors }: SectionWithErrorsProps) {
  return (
    <SectionContainer title="추가 정보">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            보관 위치
          </label>
          <input
            {...register("location")}
            type="text"
            id="location"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
            구매일
          </label>
          <input
            {...register("purchase_date")}
            type="date"
            id="purchase_date"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.purchase_date && (
            <p className="mt-1 text-sm text-red-600">{errors.purchase_date.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700">
            구매 가격
          </label>
          <input
            {...register("purchase_price", {
              valueAsNumber: true,
              min: { value: 0, message: "가격은 0 이상이어야 합니다." },
            })}
            type="number"
            id="purchase_price"
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.purchase_price && (
            <p className="mt-1 text-sm text-red-600">{errors.purchase_price.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="warranty_expires" className="block text-sm font-medium text-gray-700">
            보증 만료일
          </label>
          <input
            {...register("warranty_expires")}
            type="date"
            id="warranty_expires"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.warranty_expires && (
            <p className="mt-1 text-sm text-red-600">{errors.warranty_expires.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            설명
          </label>
          <textarea
            {...register("description")}
            id="description"
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="기기에 대한 설명을 입력하세요"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            메모
          </label>
          <textarea
            {...register("notes")}
            id="notes"
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="기기에 대한 메모를 입력하세요"
          />
          {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
        </div>
      </div>
    </SectionContainer>
  );
}

interface FormActionsProps {
  isSubmitting: boolean;
  mode: EquipmentFormProps["mode"];
  onCancel: () => void;
}

function FormActions({ isSubmitting, mode, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-4">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        취소
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? mode === "edit"
            ? "수정 중..."
            : "등록 중..."
          : mode === "edit"
            ? "수정"
            : "등록"}
      </button>
    </div>
  );
}
