"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { scheduleSchema, type ScheduleFormData } from "@/lib/validations/schedule";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { auditLogger } from "@/lib/logger/auditLogger";
import type { Client } from "@/lib/validations/client";
import type { Rental } from "@/lib/validations/rental";
import type { CustomizationRequest } from "@/lib/validations/customization";

/**
 * 일정 등록/수정 폼 컴포넌트
 * Phase 10: SCH-US-01
 */

interface ScheduleFormProps {
  clientId?: string;
  rentalId?: string;
  customizationRequestId?: string;
  initialData?: ScheduleFormData & { id?: string };
  scheduleId?: string;
  mode?: "create" | "edit";
}

export function ScheduleForm({
  clientId,
  rentalId,
  customizationRequestId,
  initialData,
  scheduleId,
  mode = "create",
}: ScheduleFormProps) {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customizations, setCustomizations] = useState<CustomizationRequest[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId || "");
  const [selectedScheduleType, setSelectedScheduleType] = useState<string>(
    initialData?.schedule_type || rentalId ? "rental" : customizationRequestId ? "customization" : "consultation",
  );

  // 대상자 목록 로드 (필요한 경우)
  useEffect(() => {
    if (mode === "create" && !clientId) {
      fetchClients();
    }
  }, [mode, clientId]);

  // 대여 목록 로드 (대여 일정인 경우)
  useEffect(() => {
    if (selectedScheduleType === "rental" && selectedClientId && !rentalId) {
      fetchRentals();
    }
  }, [selectedScheduleType, selectedClientId, rentalId]);

  // 맞춤제작 요청 목록 로드 (맞춤제작 일정인 경우)
  useEffect(() => {
    if (selectedScheduleType === "customization" && selectedClientId && !customizationRequestId) {
      fetchCustomizations();
    }
  }, [selectedScheduleType, selectedClientId, customizationRequestId]);

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

  async function fetchRentals() {
    try {
      const response = await fetch(`/api/rentals?client_id=${selectedClientId}&status=active&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setRentals(data.data || []);
      }
    } catch (err) {
      console.error("대여 목록 조회 실패:", err);
    }
  }

  async function fetchCustomizations() {
    try {
      const response = await fetch(`/api/customization-requests?client_id=${selectedClientId}&status!=completed&status!=cancelled&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setCustomizations(data.data || []);
      }
    } catch (err) {
      console.error("맞춤제작 요청 목록 조회 실패:", err);
    }
  }

  // 기본 시작/종료 시간 설정
  const getDefaultStartTime = () => {
    if (initialData?.start_time) {
      return new Date(initialData.start_time).toISOString().slice(0, 16);
    }
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30); // 30분 단위로 올림
    return now.toISOString().slice(0, 16);
  };

  const getDefaultEndTime = () => {
    if (initialData?.end_time) {
      return new Date(initialData.end_time).toISOString().slice(0, 16);
    }
    const start = new Date(getDefaultStartTime());
    start.setHours(start.getHours() + 1); // 시작 시간 + 1시간
    return start.toISOString().slice(0, 16);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      ...initialData,
      schedule_type: initialData?.schedule_type || (rentalId ? "rental" : customizationRequestId ? "customization" : "consultation"),
      client_id: clientId || initialData?.client_id || "",
      rental_id: rentalId || initialData?.rental_id || null,
      customization_request_id: customizationRequestId || initialData?.customization_request_id || null,
      start_time: initialData?.start_time || getDefaultStartTime(),
      end_time: initialData?.end_time || getDefaultEndTime(),
      participant_ids: initialData?.participant_ids || [],
      reminder_minutes: initialData?.reminder_minutes || 30,
      status: initialData?.status || "scheduled",
    },
  });

  const onSubmit = async (data: ScheduleFormData) => {
    setIsSubmitting(true);

    try {
      auditLogger.info(`schedule_form_submitted_${mode}`, {
        metadata: {
          scheduleId,
          scheduleType: data.schedule_type,
          title: data.title,
        },
      });

      // client_id 설정 (등록 모드이고 선택된 경우)
      const finalData = {
        ...data,
        client_id: selectedClientId || data.client_id || null,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
      };

      const url = mode === "edit" ? `/api/schedules/${scheduleId}` : "/api/schedules";
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
          ? "일정이 성공적으로 수정되었습니다."
          : "일정이 성공적으로 등록되었습니다.",
      );
      auditLogger.info(`schedule_form_success_${mode}`, {
        metadata: { scheduleId: result.id },
      });

      setTimeout(() => {
        if (mode === "edit" && scheduleId) {
          router.push(`/schedules/${scheduleId}`);
        } else {
          router.push("/schedules");
        }
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `${mode === "edit" ? "수정" : "등록"} 중 오류가 발생했습니다.`;
      showError(errorMessage);
      auditLogger.error(`schedule_form_failed_${mode}`, {
        error: err,
        metadata: { errorMessage, scheduleId },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scheduleType = watch("schedule_type");

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 일정 유형 */}
        <div>
          <label htmlFor="schedule_type" className="block text-sm font-medium text-gray-700">
            일정 유형 <span className="text-red-500">*</span>
          </label>
          <select
            id="schedule_type"
            {...register("schedule_type")}
            value={selectedScheduleType}
            onChange={(e) => {
              setSelectedScheduleType(e.target.value);
              setValue("schedule_type", e.target.value as any);
              // 유형 변경 시 관련 필드 초기화
              if (e.target.value !== "rental") {
                setValue("rental_id", null);
              }
              if (e.target.value !== "customization") {
                setValue("customization_request_id", null);
              }
            }}
            disabled={!!rentalId || !!customizationRequestId}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="consultation">상담</option>
            <option value="assessment">평가</option>
            <option value="rental">대여</option>
            <option value="customization">맞춤제작</option>
            <option value="other">기타</option>
          </select>
          {errors.schedule_type && (
            <p className="mt-1 text-sm text-red-600">{errors.schedule_type.message}</p>
          )}
        </div>

        {/* 대상자 선택 (상담/평가/기타인 경우) */}
        {(!selectedScheduleType || selectedScheduleType === "consultation" || selectedScheduleType === "assessment" || selectedScheduleType === "other") && (
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
              대상자
            </label>
            <select
              id="client_id"
              {...register("client_id")}
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setValue("client_id", e.target.value || null);
              }}
              disabled={!!clientId}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
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

        {/* 대여 선택 (대여 일정인 경우) */}
        {selectedScheduleType === "rental" && (
          <div>
            <label htmlFor="rental_id" className="block text-sm font-medium text-gray-700">
              대여 기록 <span className="text-red-500">*</span>
            </label>
            <select
              id="rental_id"
              {...register("rental_id")}
              disabled={!!rentalId}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">대여 기록을 선택하세요</option>
              {rentals.map((rental) => (
                <option key={rental.id} value={rental.id}>
                  대여 #{rental.id.slice(0, 8)}... ({new Date(rental.rental_date).toLocaleDateString("ko-KR")})
                </option>
              ))}
            </select>
            {errors.rental_id && (
              <p className="mt-1 text-sm text-red-600">{errors.rental_id.message}</p>
            )}
          </div>
        )}

        {/* 맞춤제작 요청 선택 (맞춤제작 일정인 경우) */}
        {selectedScheduleType === "customization" && (
          <div>
            <label htmlFor="customization_request_id" className="block text-sm font-medium text-gray-700">
              맞춤제작 요청 <span className="text-red-500">*</span>
            </label>
            <select
              id="customization_request_id"
              {...register("customization_request_id")}
              disabled={!!customizationRequestId}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">맞춤제작 요청을 선택하세요</option>
              {customizations.map((customization) => (
                <option key={customization.id} value={customization.id}>
                  {customization.title} ({new Date(customization.requested_date).toLocaleDateString("ko-KR")})
                </option>
              ))}
            </select>
            {errors.customization_request_id && (
              <p className="mt-1 text-sm text-red-600">{errors.customization_request_id.message}</p>
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

        {/* 일정 시간 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
              시작 시간 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="start_time"
              {...register("start_time")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            {errors.start_time && (
              <p className="mt-1 text-sm text-red-600">{errors.start_time.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
              종료 시간 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="end_time"
              {...register("end_time")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            {errors.end_time && (
              <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>
            )}
          </div>
        </div>

        {/* 장소 */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            장소
          </label>
          <input
            type="text"
            id="location"
            {...register("location")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
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

        {/* 알림 설정 */}
        <div>
          <label htmlFor="reminder_minutes" className="block text-sm font-medium text-gray-700">
            알림 설정 (일정 시작 전 몇 분 전)
          </label>
          <select
            id="reminder_minutes"
            {...register("reminder_minutes", { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value={0}>알림 없음</option>
            <option value={15}>15분 전</option>
            <option value={30}>30분 전</option>
            <option value={60}>1시간 전</option>
            <option value={120}>2시간 전</option>
            <option value={1440}>1일 전</option>
          </select>
          {errors.reminder_minutes && (
            <p className="mt-1 text-sm text-red-600">{errors.reminder_minutes.message}</p>
          )}
        </div>

        {/* 상태 (수정 모드인 경우) */}
        {mode === "edit" && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              상태
            </label>
            <select
              id="status"
              {...register("status")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="scheduled">예정</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
              <option value="no_show">불참</option>
            </select>
            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
          </div>
        )}

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

