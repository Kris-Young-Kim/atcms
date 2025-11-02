import { z } from "zod";

/**
 * 평가 기록 검증 스키마
 * Sprint 1: CMS-US-05
 */

/**
 * 평가 유형 프리셋
 */
export const ASSESSMENT_TYPES = {
  FUNCTIONAL: "functional", // 기능 평가
  ENVIRONMENTAL: "environmental", // 환경 평가
  NEEDS: "needs", // 욕구 평가
} as const;

export type AssessmentType = (typeof ASSESSMENT_TYPES)[keyof typeof ASSESSMENT_TYPES];

/**
 * 평가 유형 라벨
 */
export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  [ASSESSMENT_TYPES.FUNCTIONAL]: "기능 평가",
  [ASSESSMENT_TYPES.ENVIRONMENTAL]: "환경 평가",
  [ASSESSMENT_TYPES.NEEDS]: "욕구 평가",
};

/**
 * 평가 점수 검증 (0-5 범위)
 */
export const assessmentScoreSchema = z
  .number()
  .min(0, "점수는 0 이상이어야 합니다.")
  .max(5, "점수는 5 이하여야 합니다.")
  .int("점수는 정수여야 합니다.");

/**
 * 평가 항목 스키마 (체크리스트 아이템)
 */
export const assessmentItemSchema = z.object({
  id: z.string().optional(), // 항목 ID (선택적)
  question: z.string().min(1, "평가 항목 질문은 필수입니다."),
  score: assessmentScoreSchema,
  notes: z.string().max(1000, "메모는 최대 1000자까지 입력 가능합니다.").optional(),
});

export type AssessmentItem = z.infer<typeof assessmentItemSchema>;

/**
 * 평가 기록 검증 스키마
 */
export const assessmentSchema = z.object({
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
  assessment_type: z.enum(
    [ASSESSMENT_TYPES.FUNCTIONAL, ASSESSMENT_TYPES.ENVIRONMENTAL, ASSESSMENT_TYPES.NEEDS],
    {
      errorMap: () => ({ message: "유효한 평가 유형을 선택하세요." }),
    },
  ),
  // 평가 항목 배열 (체크리스트)
  items: z.array(assessmentItemSchema).min(1, "최소 1개 이상의 평가 항목이 필요합니다."),
  // 전체 점수 (자동 계산 가능)
  total_score: z.number().min(0).max(5).optional(),
  // 평가 요약
  summary: z.string().max(5000, "요약은 최대 5000자까지 입력 가능합니다.").optional(),
  // PDF 첨부 (Supabase Storage URL)
  pdf_attachment: z.string().url("유효한 URL이 아닙니다.").optional(),
  // 기타 첨부파일
  attachments: z.array(z.string().url("유효한 URL이 아닙니다.")).default([]),
});

export type AssessmentFormData = z.infer<typeof assessmentSchema>;

/**
 * 평가 기록 API 응답 타입
 */
export interface Assessment extends AssessmentFormData {
  id: string;
  record_type: "assessment";
  content?: string; // JSON 형태로 저장된 items 데이터
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
  updated_by_user_id?: string;
}

/**
 * 평가 기록 수정용 스키마 (부분 업데이트 허용)
 */
export const assessmentUpdateSchema = assessmentSchema.partial().extend({
  client_id: z.string().uuid().optional(),
});

export type AssessmentUpdateData = z.infer<typeof assessmentUpdateSchema>;

/**
 * 평가 점수 계산 유틸리티
 */
export function calculateTotalScore(items: AssessmentItem[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + item.score, 0);
  return Math.round((sum / items.length) * 10) / 10; // 소수점 첫째 자리까지 반올림
}

/**
 * 평가 점수 레벨 계산 (0-5 범위를 레벨로 변환)
 */
export function getScoreLevel(score: number): { level: string; color: string } {
  if (score >= 4.5) return { level: "우수", color: "text-green-600" };
  if (score >= 3.5) return { level: "양호", color: "text-blue-600" };
  if (score >= 2.5) return { level: "보통", color: "text-yellow-600" };
  if (score >= 1.5) return { level: "미흡", color: "text-orange-600" };
  return { level: "불량", color: "text-red-600" };
}

