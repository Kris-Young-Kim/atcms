"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { clientSchema, type ClientFormData } from "@/lib/validations/client";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { auditLogger } from "@/lib/logger/auditLogger";

/**
 * 대상자 등록/수정 폼 컴포넌트
 * Sprint 1: CMS-US-01
 */

interface ClientFormProps {
  initialData?: ClientFormData;
  clientId?: string;
  mode?: "create" | "edit";
}

export function ClientForm({ initialData, clientId, mode = "create" }: ClientFormProps) {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);

    try {
      // zodResolver가 이미 검증했으므로 추가 검증 불필요
      auditLogger.info(`client_form_submitted_${mode}`, {
        metadata: { clientName: data.name, clientId },
      });

      // API 호출
      const url = mode === "edit" ? `/api/clients/${clientId}` : "/api/clients";
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

      // 성공
      success(
        mode === "edit"
          ? "대상자 정보가 성공적으로 수정되었습니다."
          : "대상자가 성공적으로 등록되었습니다.",
      );
      auditLogger.info(`client_form_success_${mode}`, {
        metadata: { clientId: result.id },
      });

      // 2초 후 이동
      setTimeout(() => {
        if (mode === "edit" && clientId) {
          router.push(`/clients/${clientId}`);
        } else {
          router.push("/clients");
        }
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : `${mode === "edit" ? "수정" : "등록"} 중 오류가 발생했습니다.`;
      showError(errorMessage);
      auditLogger.error(`client_form_failed_${mode}`, {
        error: err,
        metadata: { errorMessage, clientId },
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
            {/* 이름 (필수) */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name", { required: "이름은 필수 항목입니다." })}
                type="text"
                id="name"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-required="true"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* 생년월일 */}
            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                생년월일
              </label>
              <input
                {...register("birth_date")}
                type="date"
                id="birth_date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.birth_date && (
                <p className="mt-1 text-sm text-red-600">{errors.birth_date.message}</p>
              )}
            </div>

            {/* 성별 */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                성별
              </label>
              <select
                {...register("gender")}
                id="gender"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">선택 안 함</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </div>

            {/* 접수일 */}
            <div>
              <label htmlFor="intake_date" className="block text-sm font-medium text-gray-700">
                접수일
              </label>
              <input
                {...register("intake_date")}
                type="date"
                id="intake_date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* 장애 정보 섹션 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">장애 정보</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 장애 유형 */}
            <div>
              <label htmlFor="disability_type" className="block text-sm font-medium text-gray-700">
                장애 유형
              </label>
              <input
                {...register("disability_type")}
                type="text"
                id="disability_type"
                placeholder="예: 지체장애, 시각장애 등"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 장애 등급 */}
            <div>
              <label htmlFor="disability_grade" className="block text-sm font-medium text-gray-700">
                장애 등급
              </label>
              <input
                {...register("disability_grade")}
                type="text"
                id="disability_grade"
                placeholder="예: 1급, 2급 등"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* 연락처 정보 섹션 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">연락처 정보</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 전화번호 */}
            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
                전화번호
              </label>
              <input
                {...register("contact_phone")}
                type="tel"
                id="contact_phone"
                placeholder="010-1234-5678"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.contact_phone && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_phone.message}</p>
              )}
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                {...register("contact_email")}
                type="email"
                id="contact_email"
                placeholder="example@email.com"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.contact_email && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>
              )}
            </div>

            {/* 주소 */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                주소
              </label>
              <input
                {...register("address")}
                type="text"
                id="address"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* 보호자 정보 섹션 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">보호자 정보</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 보호자 이름 */}
            <div>
              <label htmlFor="guardian_name" className="block text-sm font-medium text-gray-700">
                보호자 이름
              </label>
              <input
                {...register("guardian_name")}
                type="text"
                id="guardian_name"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 보호자 연락처 */}
            <div>
              <label htmlFor="guardian_phone" className="block text-sm font-medium text-gray-700">
                보호자 연락처
              </label>
              <input
                {...register("guardian_phone")}
                type="tel"
                id="guardian_phone"
                placeholder="010-1234-5678"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.guardian_phone && (
                <p className="mt-1 text-sm text-red-600">{errors.guardian_phone.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* 기타 정보 섹션 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">기타 정보</h2>
          <div className="space-y-6">
            {/* 의뢰 경로 */}
            <div>
              <label htmlFor="referral_source" className="block text-sm font-medium text-gray-700">
                의뢰 경로
              </label>
              <input
                {...register("referral_source")}
                type="text"
                id="referral_source"
                placeholder="예: 병원, 복지관, 자가 등"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 상태 */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                상태
              </label>
              <select
                {...register("status")}
                id="status"
                defaultValue="active"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="active">활동중</option>
                <option value="inactive">비활동</option>
                <option value="discharged">종결</option>
              </select>
            </div>

            {/* 메모 */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                메모
              </label>
              <textarea
                {...register("notes")}
                id="notes"
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="추가 메모나 특이사항을 입력하세요"
              />
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

