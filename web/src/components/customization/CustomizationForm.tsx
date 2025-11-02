"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import {
  customizationRequestSchema,
  type CustomizationRequestFormData,
} from "@/lib/validations/customization";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { FileUpload, useFileUpload } from "@/components/ui/FileUpload";
import { auditLogger } from "@/lib/logger/auditLogger";
import type { Client } from "@/lib/validations/client";

/**
 * 맞춤제작 요청 등록/수정 폼 컴포넌트
 * Phase 10: CDM-US-01
 */

interface CustomizationFormProps {
  clientId?: string;
  initialData?: CustomizationRequestFormData & { id?: string };
  customizationId?: string;
  mode?: "create" | "edit";
}

export function CustomizationForm({
  clientId,
  initialData,
  customizationId,
  mode = "create",
}: CustomizationFormProps) {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId || "");
  const { uploadedUrls, handleUploadComplete, clearUrls } = useFileUpload();

  // 대상자 목록 로드 (등록 모드이고 clientId가 없는 경우)
  useEffect(() => {
    if (mode === "create" && !clientId) {
      fetchClients();
    }
  }, [mode, clientId]);

  async function fetchClients() {
    try {
      const response = await fetch("/api/clients?limit=100");
      if (response.ok) {
        const data = await response.json();
        setClients(data.data || []);
      }
    } catch (err) {
      console.error("대상자 목록 조회 실패:", err);
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CustomizationRequestFormData>({
    resolver: zodResolver(customizationRequestSchema),
    defaultValues: {
      ...initialData,
      client_id: clientId || initialData?.client_id || "",
      requested_date: initialData?.requested_date || new Date().toISOString().split("T")[0],
      materials: initialData?.materials || [],
      design_files: initialData?.design_files || [],
    },
  });

  // 파일 업로드 완료 핸들러
  const onFileUploadComplete = (url: string) => {
    handleUploadComplete(url);
    const currentFiles = watch("design_files") || [];
    setValue("design_files", [...currentFiles, url]);
  };

  // 파일 업로드 완료 시 design_files 업데이트
  useEffect(() => {
    if (uploadedUrls.length > 0) {
      const currentFiles = watch("design_files") || [];
      const newFiles = uploadedUrls.filter((url) => !currentFiles.includes(url));
      if (newFiles.length > 0) {
        setValue("design_files", [...currentFiles, ...newFiles]);
      }
      clearUrls();
    }
  }, [uploadedUrls, setValue, watch, clearUrls]);

  const onSubmit = async (data: CustomizationRequestFormData) => {
    setIsSubmitting(true);

    try {
      auditLogger.info(`customization_form_submitted_${mode}`, {
        metadata: {
          clientId: selectedClientId || data.client_id,
          customizationId,
          title: data.title,
        },
      });

      // client_id 설정 (등록 모드이고 선택된 경우)
      const finalData = {
        ...data,
        client_id: selectedClientId || data.client_id,
      };

      const url =
        mode === "edit"
          ? `/api/customization-requests/${customizationId}`
          : "/api/customization-requests";
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
          ? "맞춤제작 요청이 성공적으로 수정되었습니다."
          : "맞춤제작 요청이 성공적으로 등록되었습니다.",
      );
      auditLogger.info(`customization_form_success_${mode}`, {
        metadata: { customizationId: result.id },
      });

      setTimeout(() => {
        if (mode === "edit" && customizationId) {
          router.push(`/customization-requests/${customizationId}`);
        } else {
          router.push("/customization-requests");
        }
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `${mode === "edit" ? "수정" : "등록"} 중 오류가 발생했습니다.`;
      showError(errorMessage);
      auditLogger.error(`customization_form_failed_${mode}`, {
        error: err,
        metadata: { errorMessage, customizationId },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMaterials = watch("materials") || [];
  const [newMaterial, setNewMaterial] = useState("");

  const addMaterial = () => {
    if (newMaterial.trim() && !currentMaterials.includes(newMaterial.trim())) {
      setValue("materials", [...currentMaterials, newMaterial.trim()]);
      setNewMaterial("");
    }
  };

  const removeMaterial = (index: number) => {
    const updated = currentMaterials.filter((_, i) => i !== index);
    setValue("materials", updated);
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 대상자 선택 (등록 모드이고 clientId가 없는 경우) */}
        {mode === "create" && !clientId && (
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
              대상자 <span className="text-red-500">*</span>
            </label>
            <select
              id="client_id"
              {...register("client_id")}
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setValue("client_id", e.target.value);
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">대상자를 선택하세요</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.contact_phone || "연락처 없음"})
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
            )}
          </div>
        )}

        {/* 제목 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            {...register("title")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        {/* 제작 목적 */}
        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
            제작 목적
          </label>
          <input
            type="text"
            id="purpose"
            {...register("purpose")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          {errors.purpose && <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>}
        </div>

        {/* 설명 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            설명
          </label>
          <textarea
            id="description"
            rows={4}
            {...register("description")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* 치수 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="height_cm" className="block text-sm font-medium text-gray-700">
              높이 (cm)
            </label>
            <input
              type="number"
              id="height_cm"
              step="0.1"
              {...register("height_cm", { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            {errors.height_cm && (
              <p className="mt-1 text-sm text-red-600">{errors.height_cm.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="width_cm" className="block text-sm font-medium text-gray-700">
              너비 (cm)
            </label>
            <input
              type="number"
              id="width_cm"
              step="0.1"
              {...register("width_cm", { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            {errors.width_cm && (
              <p className="mt-1 text-sm text-red-600">{errors.width_cm.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="depth_cm" className="block text-sm font-medium text-gray-700">
              깊이 (cm)
            </label>
            <input
              type="number"
              id="depth_cm"
              step="0.1"
              {...register("depth_cm", { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            {errors.depth_cm && (
              <p className="mt-1 text-sm text-red-600">{errors.depth_cm.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="weight_kg" className="block text-sm font-medium text-gray-700">
              무게 (kg)
            </label>
            <input
              type="number"
              id="weight_kg"
              step="0.1"
              {...register("weight_kg", { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            {errors.weight_kg && (
              <p className="mt-1 text-sm text-red-600">{errors.weight_kg.message}</p>
            )}
          </div>
        </div>

        {/* 재료 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">재료</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {currentMaterials.map((material, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
              >
                {material}
                <button
                  type="button"
                  onClick={() => removeMaterial(index)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMaterial();
                }
              }}
              placeholder="재료 입력 후 Enter"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addMaterial}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              추가
            </button>
          </div>
        </div>

        {/* 특수 요구사항 */}
        <div>
          <label htmlFor="special_requirements" className="block text-sm font-medium text-gray-700">
            특수 요구사항
          </label>
          <textarea
            id="special_requirements"
            rows={4}
            {...register("special_requirements")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          {errors.special_requirements && (
            <p className="mt-1 text-sm text-red-600">{errors.special_requirements.message}</p>
          )}
        </div>

        {/* 설계 파일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">설계 파일</label>
          <FileUpload
            onUploadComplete={onFileUploadComplete}
            accept="image/*,.pdf"
            maxSize={10 * 1024 * 1024}
            multiple={true}
          />
          {watch("design_files")?.length > 0 && (
            <div className="mt-2 space-y-1">
              {watch("design_files")?.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded bg-gray-50 p-2"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    파일 {index + 1}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = watch("design_files")?.filter((_, i) => i !== index) || [];
                      setValue("design_files", updated);
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 날짜 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="requested_date" className="block text-sm font-medium text-gray-700">
              요청일
            </label>
            <input
              type="date"
              id="requested_date"
              {...register("requested_date")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            {errors.requested_date && (
              <p className="mt-1 text-sm text-red-600">{errors.requested_date.message}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="expected_completion_date"
              className="block text-sm font-medium text-gray-700"
            >
              예상 완료일
            </label>
            <input
              type="date"
              id="expected_completion_date"
              {...register("expected_completion_date")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            {errors.expected_completion_date && (
              <p className="mt-1 text-sm text-red-600">{errors.expected_completion_date.message}</p>
            )}
          </div>
        </div>

        {/* 메모 */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            메모
          </label>
          <textarea
            id="notes"
            rows={3}
            {...register("notes")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-3 border-t pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:opacity-50"
          >
            {isSubmitting ? "저장 중..." : mode === "edit" ? "수정" : "등록"}
          </button>
        </div>
      </form>
    </>
  );
}
