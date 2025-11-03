"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { ToastContainer, useToast } from "@/components/ui/Toast";
import { auditLogger } from "@/lib/logger/auditLogger";
import type { Client } from "@/lib/validations/client";
import type { CustomizationRequest } from "@/lib/validations/customization";
import type { Rental } from "@/lib/validations/rental";
import { scheduleSchema, type ScheduleFormData } from "@/lib/validations/schedule";

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

  const defaultScheduleType = useMemo<ScheduleFormData["schedule_type"]>(() => {
    if (initialData?.schedule_type) {
      return initialData.schedule_type;
    }
    if (rentalId) {
      return "rental";
    }
    if (customizationRequestId) {
      return "customization";
    }
    return "consultation";
  }, [initialData?.schedule_type, rentalId, customizationRequestId]);

  const defaultClientSelection = useMemo(
    () => clientId || initialData?.client_id || "",
    [clientId, initialData?.client_id],
  );

  const [selectedScheduleType, setSelectedScheduleType] =
    useState<ScheduleFormData["schedule_type"]>(defaultScheduleType);
  const [selectedClientId, setSelectedClientId] = useState<string>(defaultClientSelection);

  const defaultStartTime = useMemo(
    () => deriveDefaultStartTime(initialData?.start_time),
    [initialData?.start_time],
  );
  const defaultEndTime = useMemo(
    () => deriveDefaultEndTime(initialData?.end_time, defaultStartTime),
    [initialData?.end_time, defaultStartTime],
  );

  const defaultValues = useMemo(
    () => ({
      ...initialData,
      schedule_type: defaultScheduleType,
      client_id: clientId || initialData?.client_id || "",
      rental_id: rentalId || initialData?.rental_id || null,
      customization_request_id:
        customizationRequestId || initialData?.customization_request_id || null,
      start_time: initialData?.start_time || defaultStartTime,
      end_time: initialData?.end_time || defaultEndTime,
      participant_ids: initialData?.participant_ids || [],
      reminder_minutes: initialData?.reminder_minutes ?? 30,
      status: initialData?.status ?? "scheduled",
    }),
    [
      initialData,
      clientId,
      rentalId,
      customizationRequestId,
      defaultScheduleType,
      defaultStartTime,
      defaultEndTime,
    ],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues,
  });

  const { clients, rentals, customizations } = useScheduleDependencies({
    mode,
    clientId,
    rentalId,
    customizationRequestId,
    selectedScheduleType,
    selectedClientId,
  });

  const handleScheduleTypeChange = useCallback(
    (value: ScheduleFormData["schedule_type"]) => {
      setSelectedScheduleType(value);
      setValue("schedule_type", value);

      if (value !== "rental") {
        setValue("rental_id", null);
      }
      if (value !== "customization") {
        setValue("customization_request_id", null);
      }
    },
    [setValue],
  );

  const handleClientChange = useCallback(
    (value: string) => {
      setSelectedClientId(value);
      setValue("client_id", value || null);

      if (selectedScheduleType === "rental") {
        setValue("rental_id", null);
      }
      if (selectedScheduleType === "customization") {
        setValue("customization_request_id", null);
      }
    },
    [selectedScheduleType, setValue],
  );

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

      const finalData: ScheduleFormData = {
        ...data,
        client_id: selectedClientId || data.client_id || null,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
      };

      const url = mode === "edit" ? `/api/schedules/${scheduleId}` : "/api/schedules";
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `${mode === "edit" ? "수정" : "등록"}에 실패했습니다.`);
      }

      const result = await response.json();

      success(
        mode === "edit" ? "일정이 성공적으로 수정되었습니다." : "일정이 성공적으로 등록되었습니다.",
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
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `${mode === "edit" ? "수정" : "등록"} 중 오류가 발생했습니다.`;
      showError(errorMessage);
      auditLogger.error(`schedule_form_failed_${mode}`, {
        error,
        metadata: { errorMessage, scheduleId },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ScheduleTargetSection
          register={register}
          errors={errors}
          selectedScheduleType={selectedScheduleType}
          onScheduleTypeChange={handleScheduleTypeChange}
          scheduleTypeDisabled={!!rentalId || !!customizationRequestId}
          clients={clients}
          selectedClientId={selectedClientId}
          onClientChange={handleClientChange}
          clientDisabled={!!clientId}
          rentals={rentals}
          rentalDisabled={!!rentalId}
          customizations={customizations}
          customizationDisabled={!!customizationRequestId}
        />

        <ScheduleDetailsSection register={register} errors={errors} />

        <ScheduleOptionsSection register={register} errors={errors} mode={mode} />

        <FormActions isSubmitting={isSubmitting} mode={mode} onCancel={() => router.back()} />
      </form>
    </>
  );
}

interface SectionProps {
  register: UseFormRegister<ScheduleFormData>;
}

interface SectionWithErrorsProps extends SectionProps {
  errors: FieldErrors<ScheduleFormData>;
}

interface ScheduleTargetSectionProps extends SectionWithErrorsProps {
  selectedScheduleType: ScheduleFormData["schedule_type"];
  onScheduleTypeChange: (value: ScheduleFormData["schedule_type"]) => void;
  scheduleTypeDisabled: boolean;
  clients: Client[];
  selectedClientId: string;
  onClientChange: (value: string) => void;
  clientDisabled: boolean;
  rentals: Rental[];
  rentalDisabled: boolean;
  customizations: CustomizationRequest[];
  customizationDisabled: boolean;
}

function ScheduleTargetSection({
  register,
  errors,
  selectedScheduleType,
  onScheduleTypeChange,
  scheduleTypeDisabled,
  clients,
  selectedClientId,
  onClientChange,
  clientDisabled,
  rentals,
  rentalDisabled,
  customizations,
  customizationDisabled,
}: ScheduleTargetSectionProps) {
  const scheduleTypeField = register("schedule_type");
  const clientField = register("client_id");
  const rentalField = register("rental_id");
  const customizationField = register("customization_request_id");

  const shouldShowClientSelect =
    !selectedScheduleType ||
    selectedScheduleType === "consultation" ||
    selectedScheduleType === "assessment" ||
    selectedScheduleType === "other";

  return (
    <SectionCard title="일정 대상">
      <div className="space-y-4">
        <div>
          <label htmlFor="schedule_type" className="block text-sm font-medium text-gray-700">
            일정 유형 <span className="text-red-500">*</span>
          </label>
          <select
            id="schedule_type"
            {...scheduleTypeField}
            value={selectedScheduleType}
            onChange={(event) => {
              scheduleTypeField.onChange(event);
              onScheduleTypeChange(event.target.value as ScheduleFormData["schedule_type"]);
            }}
            disabled={scheduleTypeDisabled}
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

        {shouldShowClientSelect && (
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
              대상자
            </label>
            <select
              id="client_id"
              {...clientField}
              value={selectedClientId}
              onChange={(event) => {
                clientField.onChange(event);
                onClientChange(event.target.value);
              }}
              disabled={clientDisabled}
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

        {selectedScheduleType === "rental" && (
          <div>
            <label htmlFor="rental_id" className="block text-sm font-medium text-gray-700">
              대여 기록 <span className="text-red-500">*</span>
            </label>
            <select
              id="rental_id"
              {...rentalField}
              disabled={rentalDisabled}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">대여 기록을 선택하세요</option>
              {rentals.map((rental) => (
                <option key={rental.id} value={rental.id}>
                  대여 #{rental.id.slice(0, 8)}... (
                  {rental.rental_date
                    ? new Date(rental.rental_date).toLocaleDateString("ko-KR")
                    : ""}
                  )
                </option>
              ))}
            </select>
            {errors.rental_id && (
              <p className="mt-1 text-sm text-red-600">{errors.rental_id.message}</p>
            )}
          </div>
        )}

        {selectedScheduleType === "customization" && (
          <div>
            <label
              htmlFor="customization_request_id"
              className="block text-sm font-medium text-gray-700"
            >
              맞춤제작 요청 <span className="text-red-500">*</span>
            </label>
            <select
              id="customization_request_id"
              {...customizationField}
              disabled={customizationDisabled}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">맞춤제작 요청을 선택하세요</option>
              {customizations.map((customization) => (
                <option key={customization.id} value={customization.id}>
                  {customization.title} (
                  {customization.requested_date
                    ? new Date(customization.requested_date).toLocaleDateString("ko-KR")
                    : ""}
                  )
                </option>
              ))}
            </select>
            {errors.customization_request_id && (
              <p className="mt-1 text-sm text-red-600">{errors.customization_request_id.message}</p>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function ScheduleDetailsSection({ register, errors }: SectionWithErrorsProps) {
  return (
    <SectionCard title="일정 상세">
      <div className="space-y-4">
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
          )}
        </div>

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
      </div>
    </SectionCard>
  );
}

interface ScheduleOptionsSectionProps extends SectionWithErrorsProps {
  mode: ScheduleFormProps["mode"];
}

function ScheduleOptionsSection({ register, errors, mode }: ScheduleOptionsSectionProps) {
  const reminderField = register("reminder_minutes", { valueAsNumber: true });

  return (
    <SectionCard title="알림 및 메모">
      <div className="space-y-4">
        <div>
          <label htmlFor="reminder_minutes" className="block text-sm font-medium text-gray-700">
            알림 설정 (일정 시작 전 몇 분 전)
          </label>
          <select
            id="reminder_minutes"
            {...reminderField}
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
      </div>
    </SectionCard>
  );
}

interface FormActionsProps {
  isSubmitting: boolean;
  mode: ScheduleFormProps["mode"];
  onCancel: () => void;
}

function FormActions({ isSubmitting, mode, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 border-t pt-6">
      <button
        type="button"
        onClick={onCancel}
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
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

interface ScheduleDependenciesOptions {
  mode: ScheduleFormProps["mode"];
  clientId?: string;
  rentalId?: string;
  customizationRequestId?: string;
  selectedScheduleType: ScheduleFormData["schedule_type"];
  selectedClientId: string;
}

function useScheduleDependencies({
  mode,
  clientId,
  rentalId,
  customizationRequestId,
  selectedScheduleType,
  selectedClientId,
}: ScheduleDependenciesOptions) {
  const [clients, setClients] = useState<Client[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customizations, setCustomizations] = useState<CustomizationRequest[]>([]);

  const loadClients = useCallback(async () => {
    try {
      const response = await fetch("/api/clients?limit=100");
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setClients(data.data || []);
    } catch (error) {
      console.error("대상자 목록 조회 실패:", error);
    }
  }, []);

  const loadRentals = useCallback(async () => {
    if (!selectedClientId) {
      setRentals([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/rentals?client_id=${selectedClientId}&status=active&limit=100`,
      );
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setRentals(data.data || []);
    } catch (error) {
      console.error("대여 목록 조회 실패:", error);
    }
  }, [selectedClientId]);

  const loadCustomizations = useCallback(async () => {
    if (!selectedClientId) {
      setCustomizations([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/customization-requests?client_id=${selectedClientId}&status!=completed&status!=cancelled&limit=100`,
      );
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setCustomizations(data.data || []);
    } catch (error) {
      console.error("맞춤제작 요청 목록 조회 실패:", error);
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (mode === "create" && !clientId) {
      void loadClients();
    }
  }, [mode, clientId, loadClients]);

  useEffect(() => {
    if (selectedScheduleType === "rental" && selectedClientId && !rentalId) {
      void loadRentals();
    } else if (selectedScheduleType !== "rental") {
      setRentals([]);
    }
  }, [selectedScheduleType, selectedClientId, rentalId, loadRentals]);

  useEffect(() => {
    if (selectedScheduleType === "customization" && selectedClientId && !customizationRequestId) {
      void loadCustomizations();
    } else if (selectedScheduleType !== "customization") {
      setCustomizations([]);
    }
  }, [selectedScheduleType, selectedClientId, customizationRequestId, loadCustomizations]);

  return { clients, rentals, customizations };
}

function deriveDefaultStartTime(initialStart?: string) {
  if (initialStart) {
    return formatDateTimeLocal(new Date(initialStart));
  }

  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
  return formatDateTimeLocal(now);
}

function deriveDefaultEndTime(initialEnd?: string, startTime?: string) {
  if (initialEnd) {
    return formatDateTimeLocal(new Date(initialEnd));
  }

  const base = startTime ? new Date(startTime) : new Date();
  base.setHours(base.getHours() + 1);
  return formatDateTimeLocal(base);
}

function formatDateTimeLocal(date: Date) {
  return date.toISOString().slice(0, 16);
}
