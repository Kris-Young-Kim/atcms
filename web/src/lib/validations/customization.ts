import { z } from "zod";

/**
 * 맞춤제작 요청 등록/수정을 위한 Zod 검증 스키마
 * Phase 10: CDM-US-01
 */

export const customizationRequestSchema = z.object({
  // 필수 필드
  client_id: z.string().uuid("유효한 대상자 ID를 입력하세요."),
  title: z.string().min(1, "제목은 필수입니다.").max(200, "제목은 최대 200자까지 입력 가능합니다."),

  // 선택 필드들
  description: z.string().max(5000).optional(),
  purpose: z.string().max(500).optional(),

  // 치수 정보
  height_cm: z
    .number()
    .positive("높이는 양수여야 합니다.")
    .max(1000, "높이는 1000cm 이하여야 합니다.")
    .optional()
    .nullable(),
  width_cm: z
    .number()
    .positive("너비는 양수여야 합니다.")
    .max(1000, "너비는 1000cm 이하여야 합니다.")
    .optional()
    .nullable(),
  depth_cm: z
    .number()
    .positive("깊이는 양수여야 합니다.")
    .max(1000, "깊이는 1000cm 이하여야 합니다.")
    .optional()
    .nullable(),
  weight_kg: z
    .number()
    .positive("무게는 양수여야 합니다.")
    .max(1000, "무게는 1000kg 이하여야 합니다.")
    .optional()
    .nullable(),

  // 재료 정보
  materials: z.array(z.string().max(100)).default([]),

  // 특수 요구사항
  special_requirements: z.string().max(5000).optional(),

  // 설계 파일
  design_files: z.array(z.string().url("유효한 URL을 입력하세요.")).default([]),

  // 상태 (등록 시 기본값)
  status: z
    .enum(["requested", "designing", "prototyping", "fitting", "completed", "cancelled"])
    .default("requested"),

  // 날짜 정보
  requested_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "유효한 요청일을 입력하세요." },
    ),
  expected_completion_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "유효한 예상 완료일을 입력하세요." },
    ),

  // 메모
  notes: z.string().max(5000).optional(),
});

/**
 * 맞춤제작 요청 폼 데이터 타입
 */
export type CustomizationRequestFormData = z.infer<typeof customizationRequestSchema>;

/**
 * API 응답용 타입 (DB에서 반환되는 전체 필드)
 */
export interface CustomizationRequest extends CustomizationRequestFormData {
  id: string;
  completed_date?: string | null;
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
  updated_by_user_id?: string;
}

/**
 * 맞춤제작 요청 목록 조회 필터 스키마
 */
export const customizationRequestFilterSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum(["requested", "designing", "prototyping", "fitting", "completed", "cancelled", "all"])
    .default("all"),
  client_id: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export type CustomizationRequestFilter = z.infer<typeof customizationRequestFilterSchema>;

/**
 * 맞춤제작 요청 수정용 스키마 (부분 업데이트 허용)
 */
export const customizationRequestUpdateSchema = customizationRequestSchema.partial().extend({
  client_id: z.string().uuid().optional(), // 수정 시에는 client_id 변경 불가
});

export type CustomizationRequestUpdateData = z.infer<typeof customizationRequestUpdateSchema>;

/**
 * 맞춤제작 단계 변경 스키마
 */
export const customizationStageSchema = z.object({
  stage: z.enum(["requested", "designing", "prototyping", "fitting", "completed", "cancelled"]),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
  attachments: z.array(z.string().url()).default([]),
  stage_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "유효한 날짜를 입력하세요." },
    ),
});

export type CustomizationStageData = z.infer<typeof customizationStageSchema>;

/**
 * 맞춤제작 단계 히스토리 응답 타입
 */
export interface CustomizationStage {
  id: string;
  customization_request_id: string;
  stage: "requested" | "designing" | "prototyping" | "fitting" | "completed" | "cancelled";
  notes?: string | null;
  metadata: Record<string, unknown>;
  attachments: string[];
  stage_date: string;
  created_at: string;
  created_by_user_id?: string | null;
}
