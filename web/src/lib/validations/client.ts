import { z } from "zod";

/**
 * 대상자 등록/수정을 위한 Zod 검증 스키마
 * Sprint 1: CMS-US-01
 */

// 한국 전화번호 정규식 (선택적, 다양한 형식 허용)
const phoneRegex = /^(\d{2,3}-\d{3,4}-\d{4}|\d{10,11})$/;

// 이메일 검증은 Zod 기본 제공

export const clientSchema = z.object({
  // 필수 필드
  name: z
    .string()
    .min(2, "이름은 최소 2자 이상이어야 합니다.")
    .max(100, "이름은 최대 100자까지 입력 가능합니다."),

  // 선택 필드들
  birth_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date < new Date();
      },
      { message: "유효한 생년월일을 입력하세요 (과거 날짜만 가능)." },
    ),

  gender: z.enum(["male", "female", "other"]).optional(),

  disability_type: z.string().max(100).optional(),

  disability_grade: z.string().max(50).optional(),

  contact_phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return phoneRegex.test(val);
      },
      { message: "유효한 전화번호 형식이 아닙니다 (예: 010-1234-5678 또는 01012345678)." },
    ),

  contact_email: z.string().email("유효한 이메일 주소를 입력하세요.").optional().or(z.literal("")),

  address: z.string().max(500).optional(),

  guardian_name: z.string().max(100).optional(),

  guardian_phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return phoneRegex.test(val);
      },
      { message: "유효한 전화번호 형식이 아닙니다 (예: 010-1234-5678 또는 01012345678)." },
    ),

  referral_source: z.string().max(200).optional(),

  intake_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "유효한 접수일을 입력하세요." },
    ),

  status: z.enum(["active", "inactive", "discharged"]).default("active"),

  notes: z.string().max(5000).optional(),
});

/**
 * 클라이언트 검증 스키마 타입
 * 폼에서 사용
 */
export type ClientFormData = z.infer<typeof clientSchema>;

/**
 * API 응답용 타입 (DB에서 반환되는 전체 필드)
 */
export interface Client extends ClientFormData {
  id: string;
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
  updated_by_user_id?: string;
}

/**
 * 대상자 목록 조회 필터 스키마
 */
export const clientFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "discharged", "all"]).default("all"),
  disability_type: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export type ClientFilter = z.infer<typeof clientFilterSchema>;

/**
 * 대상자 수정용 스키마 (부분 업데이트 허용)
 */
export const clientUpdateSchema = clientSchema.partial();

export type ClientUpdateData = z.infer<typeof clientUpdateSchema>;
