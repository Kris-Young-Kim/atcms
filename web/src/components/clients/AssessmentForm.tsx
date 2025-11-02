"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import {
  assessmentSchema,
  type AssessmentFormData,
  type AssessmentItem,
  ASSESSMENT_TYPES,
  ASSESSMENT_TYPE_LABELS,
  calculateTotalScore,
} from "@/lib/validations/assessment";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { auditLogger } from "@/lib/logger/auditLogger";

/**
 * 평가 기록 등록/수정 폼 컴포넌트
 * Sprint 1: CMS-US-05
 */

interface AssessmentFormProps {
  clientId: string;
  initialData?: Partial<AssessmentFormData> & { id?: string };
  assessmentId?: string;
  mode?: "create" | "edit";
}

export function AssessmentForm({
  clientId,
  initialData,
  assessmentId,
  mode = "create",
}: AssessmentFormProps) {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      ...initialData,
      client_id: clientId,
      record_date: initialData?.record_date || new Date().toISOString().split("T")[0],
      items: initialData?.items || [{ question: "", score: 0 }],
      assessment_type: initialData?.assessment_type || ASSESSMENT_TYPES.FUNCTIONAL,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // 전체 점수 자동 계산
  const items = watch("items");
  const totalScore = items && items.length > 0 ? calculateTotalScore(items as AssessmentItem[]) : 0;

  const onSubmit = async (data: AssessmentFormData) => {
    setIsSubmitting(true);

    try {
      auditLogger.info(`assessment_form_submitted_${mode}`, {
        metadata: { clientId, assessmentId, title: data.title },
      });

      // 전체 점수 계산
      const finalData = {
        ...data,
        total_score: calculateTotalScore(data.items),
      };

      // API 호출
      const url = mode === "edit" ? `/api/clients/${clientId}/assessments/${assessmentId}` : `/api/clients/${clientId}/assessments`;
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `${mode === "edit" ? "수정" : "등록"}에 실패했습니다.`);
      }

      const result = await response.json();

      success(
        mode === "edit"
          ? "평가 기록이 성공적으로 수정되었습니다."
          : "평가 기록이 성공적으로 등록되었습니다.",
      );

      auditLogger.info(`assessment_form_success_${mode}`, {
        metadata: { assessmentId: result.id },
      });

      // 2초 후 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/clients/${clientId}`);
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : `${mode === "edit" ? "수정" : "등록"} 중 오류가 발생했습니다.`;
      showError(errorMessage);
      auditLogger.error(`assessment_form_failed_${mode}`, {
        error: err,
        metadata: { errorMessage, clientId, assessmentId },
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
                aria-required="true"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            {/* 평가 유형 */}
            <div>
              <label htmlFor="assessment_type" className="block text-sm font-medium text-gray-700">
                평가 유형 <span className="text-red-500">*</span>
              </label>
              <select
                {...register("assessment_type", { required: "평가 유형은 필수 항목입니다." })}
                id="assessment_type"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-required="true"
              >
                {Object.entries(ASSESSMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.assessment_type && (
                <p className="mt-1 text-sm text-red-600">{errors.assessment_type.message}</p>
              )}
            </div>

            {/* 평가일 */}
            <div>
              <label htmlFor="record_date" className="block text-sm font-medium text-gray-700">
                평가일
              </label>
              <input
                {...register("record_date")}
                type="date"
                id="record_date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.record_date && (
                <p className="mt-1 text-sm text-red-600">{errors.record_date.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* 평가 항목 섹션 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">평가 항목</h2>
            <button
              type="button"
              onClick={() => append({ question: "", score: 0 })}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + 항목 추가
            </button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-gray-600">평가 항목을 추가하세요.</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">항목 {index + 1}</span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      삭제
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* 질문 */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor={`items.${index}.question`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      질문 <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register(`items.${index}.question` as const, {
                        required: "질문은 필수 항목입니다.",
                      })}
                      type="text"
                      id={`items.${index}.question`}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="평가 항목 질문을 입력하세요"
                    />
                    {errors.items?.[index]?.question && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.items[index]?.question?.message}
                      </p>
                    )}
                  </div>

                  {/* 점수 */}
                  <div>
                    <label
                      htmlFor={`items.${index}.score`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      점수 (0-5) <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register(`items.${index}.score` as const, {
                        required: "점수는 필수 항목입니다.",
                        valueAsNumber: true,
                        min: { value: 0, message: "점수는 0 이상이어야 합니다." },
                        max: { value: 5, message: "점수는 5 이하여야 합니다." },
                      })}
                      type="number"
                      id={`items.${index}.score`}
                      min="0"
                      max="5"
                      step="0.5"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0-5"
                    />
                    {errors.items?.[index]?.score && (
                      <p className="mt-1 text-sm text-red-600">{errors.items[index]?.score?.message}</p>
                    )}
                  </div>

                  {/* 메모 */}
                  <div>
                    <label htmlFor={`items.${index}.notes`} className="block text-sm font-medium text-gray-700">
                      메모
                    </label>
                    <input
                      {...register(`items.${index}.notes` as const)}
                      type="text"
                      id={`items.${index}.notes`}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="메모 (선택)"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 전체 점수 표시 */}
          {fields.length > 0 && (
            <div className="mt-4 rounded-lg bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">전체 평균 점수:</span>
                <span className="text-lg font-bold text-blue-600">{totalScore.toFixed(1)} / 5.0</span>
              </div>
            </div>
          )}

          {errors.items && typeof errors.items === "object" && (
            <p className="mt-2 text-sm text-red-600">
              {errors.items.root?.message || "평가 항목을 확인해주세요."}
            </p>
          )}
        </section>

        {/* 요약 섹션 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">평가 요약</h2>
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
              요약
            </label>
            <textarea
              {...register("summary")}
              id="summary"
              rows={6}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="평가 결과 요약을 입력하세요"
            />
            {errors.summary && <p className="mt-1 text-sm text-red-600">{errors.summary.message}</p>}
          </div>
        </section>

        {/* PDF 첨부 섹션 (향후 구현) */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">PDF 첨부</h2>
          <p className="text-sm text-gray-600">PDF 첨부 기능은 다음 단계에서 구현 예정입니다.</p>
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
            {isSubmitting
              ? mode === "edit"
                ? "수정 중..."
                : "등록 중..."
              : mode === "edit"
                ? "수정"
                : "등록"}
          </button>
        </div>
      </form>
    </>
  );
}

