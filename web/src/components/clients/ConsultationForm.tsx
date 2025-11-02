"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { consultationSchema, type ConsultationFormData } from "@/lib/validations/consultation";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { FileUpload, useFileUpload } from "@/components/ui/FileUpload";
import { auditLogger } from "@/lib/logger/auditLogger";
import { createSOAPTemplate, formatSOAPToText, parseTextToSOAP } from "@/lib/utils/soap-template";

/**
 * 상담 기록 등록/수정 폼 컴포넌트
 * Sprint 1: CMS-US-04
 */

interface ConsultationFormProps {
  clientId: string;
  initialData?: ConsultationFormData & { id?: string };
  consultationId?: string;
  mode?: "create" | "edit";
}

export function ConsultationForm({
  clientId,
  initialData,
  consultationId,
  mode = "create",
}: ConsultationFormProps) {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useSOAP, setUseSOAP] = useState(false);
  const { uploadedUrls, handleUploadComplete, clearUrls } = useFileUpload();

  // 초기 데이터에서 SOAP 형식 확인
  const initialSOAP = initialData?.content
    ? parseTextToSOAP(initialData.content)
    : createSOAPTemplate();
  const [soapData, setSOAPData] = useState(initialSOAP);

  // SOAP 사용 여부 확인 (초기 데이터에 SOAP 형식이 있는 경우)
  useEffect(() => {
    if (initialData?.content) {
      const parsed = parseTextToSOAP(initialData.content);
      if (parsed.subjective || parsed.objective || parsed.assessment || parsed.plan) {
        setUseSOAP(true);
        setSOAPData(parsed);
      }
    }
  }, [initialData]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      ...initialData,
      client_id: clientId,
      record_date: initialData?.record_date || new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true);

    try {
      auditLogger.info(`consultation_form_submitted_${mode}`, {
        metadata: { clientId, consultationId, title: data.title },
      });

      // SOAP 형식 사용 시 SOAP 데이터를 content에 통합
      const finalData = { ...data };
      if (useSOAP) {
        const soapText = formatSOAPToText(soapData);
        finalData.content = finalData.content ? `${finalData.content}\n\n${soapText}` : soapText;
        finalData.subjective = soapData.subjective;
        finalData.objective = soapData.objective;
        finalData.assessment = soapData.assessment;
        finalData.plan = soapData.plan;
      }

      // 업로드된 파일 URL 추가
      finalData.attachments = [...(finalData.attachments || []), ...uploadedUrls];

      // API 호출
      const url =
        mode === "edit"
          ? `/api/clients/${clientId}/consultations/${consultationId}`
          : `/api/clients/${clientId}/consultations`;
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
          ? "상담 기록이 성공적으로 수정되었습니다."
          : "상담 기록이 성공적으로 등록되었습니다.",
      );

      auditLogger.info(`consultation_form_success_${mode}`, {
        metadata: { consultationId: result.id },
      });

      // 업로드된 파일 목록 초기화
      clearUrls();

      // 2초 후 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/clients/${clientId}`);
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `${mode === "edit" ? "수정" : "등록"} 중 오류가 발생했습니다.`;
      showError(errorMessage);
      auditLogger.error(`consultation_form_failed_${mode}`, {
        error: err,
        metadata: { errorMessage, clientId, consultationId },
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

            {/* 상담일 */}
            <div>
              <label htmlFor="record_date" className="block text-sm font-medium text-gray-700">
                상담일
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

        {/* SOAP 형식 선택 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">기록 형식</h2>
              <p className="mt-1 text-sm text-gray-600">
                SOAP 형식(Subjective, Objective, Assessment, Plan)을 사용할 수 있습니다.
              </p>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useSOAP}
                onChange={(e) => setUseSOAP(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">SOAP 형식 사용</span>
            </label>
          </div>
        </section>

        {/* SOAP 형식 입력 */}
        {useSOAP ? (
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">SOAP 기록</h2>
            <div className="space-y-6">
              {/* S (Subjective) */}
              <div>
                <label htmlFor="subjective" className="block text-sm font-medium text-gray-700">
                  S (Subjective - 주관적)
                </label>
                <textarea
                  id="subjective"
                  value={soapData.subjective}
                  onChange={(e) => setSOAPData({ ...soapData, subjective: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="대상자가 말한 내용, 주관적 느낌 등을 기록하세요"
                />
              </div>

              {/* O (Objective) */}
              <div>
                <label htmlFor="objective" className="block text-sm font-medium text-gray-700">
                  O (Objective - 객관적)
                </label>
                <textarea
                  id="objective"
                  value={soapData.objective}
                  onChange={(e) => setSOAPData({ ...soapData, objective: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="관찰한 내용, 객관적 측정 결과 등을 기록하세요"
                />
              </div>

              {/* A (Assessment) */}
              <div>
                <label htmlFor="assessment" className="block text-sm font-medium text-gray-700">
                  A (Assessment - 평가)
                </label>
                <textarea
                  id="assessment"
                  value={soapData.assessment}
                  onChange={(e) => setSOAPData({ ...soapData, assessment: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="평가 및 분석 내용을 기록하세요"
                />
              </div>

              {/* P (Plan) */}
              <div>
                <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
                  P (Plan - 계획)
                </label>
                <textarea
                  id="plan"
                  value={soapData.plan}
                  onChange={(e) => setSOAPData({ ...soapData, plan: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="다음 단계 계획을 기록하세요"
                />
              </div>
            </div>
          </section>
        ) : (
          /* 일반 내용 입력 */
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">상담 내용</h2>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                내용
              </label>
              <textarea
                {...register("content")}
                id="content"
                rows={10}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="상담 내용을 자유롭게 기록하세요"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
          </section>
        )}

        {/* 첨부파일 섹션 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">첨부파일</h2>
          <FileUpload
            onUploadComplete={handleUploadComplete}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt"
            maxSize={10 * 1024 * 1024}
            multiple={true}
            label="파일 선택"
            disabled={isSubmitting}
          />
          {uploadedUrls.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">
                업로드된 파일 ({uploadedUrls.length}개):
              </p>
              <ul className="mt-2 space-y-1">
                {uploadedUrls.map((url, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      파일 {index + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
