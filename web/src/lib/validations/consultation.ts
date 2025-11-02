import { z } from "zod";

/**
 * 상담 기록 검증 스키마
 * Sprint 1: CMS-US-04
 */

export const consultationSchema = z.object({
  client_id: z.string().uuid("유효한 대상자 ID가 아닙니다."),
  record_date: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "유효한 날짜를 입력하세요." },
    ),
  title: z.string().min(1, "제목은 필수 항목입니다.").max(200, "제목은 최대 200자까지 입력 가능합니다."),
  content: z.string().max(10000, "내용은 최대 10000자까지 입력 가능합니다.").optional(),
  // SOAP 필드 (선택적)
  subjective: z.string().max(5000).optional(),
  objective: z.string().max(5000).optional(),
  assessment: z.string().max(5000).optional(),
  plan: z.string().max(5000).optional(),
  // 첨부파일 (Supabase Storage URL 배열)
  attachments: z.array(z.string().url("유효한 URL이 아닙니다.")).default([]),
});

export type ConsultationFormData = z.infer<typeof consultationSchema>;

/**
 * 상담 기록 API 응답 타입
 */
export interface Consultation {
  id: string;
  client_id: string;
  record_type: "consultation";
  record_date: string;
  title: string;
  content?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
  updated_by_user_id?: string;
}

/**
 * 상담 기록 수정용 스키마 (부분 업데이트 허용)
 */
export const consultationUpdateSchema = consultationSchema.partial().extend({
  client_id: z.string().uuid().optional(),
});

export type ConsultationUpdateData = z.infer<typeof consultationUpdateSchema>;

