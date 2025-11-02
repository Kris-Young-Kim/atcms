import { z } from "zod";

/**
 * 일정 등록/수정을 위한 Zod 검증 스키마
 * Phase 10: SCH-US-01
 */

export const scheduleSchema = z
  .object({
    // 필수 필드
    schedule_type: z.enum(["consultation", "assessment", "rental", "customization", "other"]),
    title: z
      .string()
      .min(1, "제목은 필수입니다.")
      .max(200, "제목은 최대 200자까지 입력 가능합니다."),

    // 선택 필드들
    client_id: z.string().uuid().optional().nullable(),
    rental_id: z.string().uuid().optional().nullable(),
    customization_request_id: z.string().uuid().optional().nullable(),
    description: z.string().max(5000).optional(),
    location: z.string().max(500).optional(),

    // 평가 일정 전용 필드 (schedule_type이 'assessment'인 경우 사용)
    assessment_type: z.enum(["functional", "environmental", "needs"]).optional(),

    // 일정 시간
    start_time: z.string().datetime({ message: "유효한 시작 시간을 입력하세요 (ISO 8601 형식)." }),
    end_time: z.string().datetime({ message: "유효한 종료 시간을 입력하세요 (ISO 8601 형식)." }),

    // 참석자
    participant_ids: z.array(z.string()).default([]),

    // 알림 설정
    reminder_minutes: z.number().int().min(0).max(1440).default(30), // 최대 24시간(1440분)

    // 반복 일정 설정
    is_recurring: z.boolean().default(false),
    recurrence_rule: z.string().max(1000).optional(),
    recurrence_end_time: z
      .string()
      .datetime({ message: "유효한 반복 종료 시간을 입력하세요 (ISO 8601 형식)." })
      .optional(),
    recurrence_count: z.number().int().positive().max(1000).optional(),
    recurrence_parent_id: z.string().uuid().optional().nullable(),
    recurrence_exception_dates: z
      .array(z.string().datetime({ message: "유효한 예외 날짜를 입력하세요 (ISO 8601 형식)." }))
      .default([]),

    // 상태
    status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).default("scheduled"),

    // 메모
    notes: z.string().max(5000).optional(),
  })
  .refine(
    (data) => {
      // end_time은 start_time 이후여야 함
      const start = new Date(data.start_time);
      const end = new Date(data.end_time);
      return end > start;
    },
    {
      message: "종료 시간은 시작 시간 이후여야 합니다.",
      path: ["end_time"],
    },
  )
  .refine(
    (data) => {
      // 일정 유형에 따라 필수 필드 확인
      if (data.schedule_type === "rental" && !data.rental_id) {
        return false;
      }
      if (data.schedule_type === "customization" && !data.customization_request_id) {
        return false;
      }
      // consultation, assessment, other는 client_id가 권장됨 (선택)
      return true;
    },
    {
      message: "일정 유형에 따라 필수 필드가 누락되었습니다.",
      path: ["schedule_type"],
    },
  )
  .refine(
    (data) => {
      if (data.is_recurring && !data.recurrence_rule) {
        return false;
      }
      if (!data.is_recurring && data.recurrence_rule) {
        // 반복 규칙이 있다면 is_recurring도 true로 전송해야 함
        return false;
      }
      if (data.is_recurring && data.recurrence_parent_id) {
        // 템플릿 일정은 부모를 가질 수 없음
        return false;
      }
      return true;
    },
    {
      message:
        "반복 일정을 생성하려면 is_recurring=true와 recurrence_rule을 함께 지정하고, 반복 템플릿은 recurrence_parent_id를 가질 수 없습니다.",
      path: ["recurrence_rule"],
    },
  );

/**
 * 일정 폼 데이터 타입
 */
export type ScheduleFormData = z.infer<typeof scheduleSchema>;

/**
 * API 응답용 타입 (DB에서 반환되는 전체 필드)
 */
export interface Schedule extends ScheduleFormData {
  id: string;
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
  updated_by_user_id?: string;
  recurrence_parent_id?: string | null;
}

/**
 * 일정 목록 조회 필터 스키마
 */
export const scheduleFilterSchema = z.object({
  schedule_type: z
    .enum(["consultation", "assessment", "rental", "customization", "other", "all"])
    .default("all"),
  client_id: z.string().uuid().optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "no_show", "all"]).default("all"),
  start_date: z.string().datetime().optional(), // 시작 날짜 필터 (이 날짜 이후)
  end_date: z.string().datetime().optional(), // 종료 날짜 필터 (이 날짜 이전)
  assessment_type: z.enum(["functional", "environmental", "needs"]).optional(), // 평가 유형 필터 (assessment 일정만)
  is_recurring: z.boolean().optional(),
  recurrence_parent_id: z.string().uuid().optional(),
  include_instances: z.boolean().default(true),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export type ScheduleFilter = z.infer<typeof scheduleFilterSchema>;

/**
 * 일정 수정용 스키마 (부분 업데이트 허용)
 */
export const scheduleUpdateSchema = z.object({
  schedule_type: z
    .enum(["consultation", "assessment", "rental", "customization", "other"])
    .optional(),
  title: z
    .string()
    .min(1, "제목은 필수입니다.")
    .max(200, "제목은 최대 200자까지 입력 가능합니다.")
    .optional(),
  client_id: z.string().uuid().optional().nullable(),
  rental_id: z.string().uuid().optional().nullable(),
  customization_request_id: z.string().uuid().optional().nullable(),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  assessment_type: z.enum(["functional", "environmental", "needs"]).optional(),
  start_time: z
    .string()
    .datetime({ message: "유효한 시작 시간을 입력하세요 (ISO 8601 형식)." })
    .optional(),
  end_time: z
    .string()
    .datetime({ message: "유효한 종료 시간을 입력하세요 (ISO 8601 형식)." })
    .optional(),
  participant_ids: z.array(z.string()).optional(),
  reminder_minutes: z.number().int().min(0).max(1440).optional(),
  is_recurring: z.boolean().optional(),
  recurrence_rule: z.string().max(1000).optional().nullable(),
  recurrence_end_time: z
    .string()
    .datetime({ message: "유효한 반복 종료 시간을 입력하세요 (ISO 8601 형식)." })
    .optional()
    .nullable(),
  recurrence_count: z.number().int().positive().max(1000).optional().nullable(),
  recurrence_parent_id: z.string().uuid().optional().nullable(),
  recurrence_exception_dates: z
    .array(z.string().datetime({ message: "유효한 예외 날짜를 입력하세요 (ISO 8601 형식)." }))
    .optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
  notes: z.string().max(5000).optional(),
});

export type ScheduleUpdateData = z.infer<typeof scheduleUpdateSchema>;
