import { z } from "zod";

/**
 * 대여 기록 검증 스키마
 * Sprint 1: ERM-US-02
 */

/**
 * 대여 상태 Enum
 */
export const RENTAL_STATUS = {
  ACTIVE: "active", // 대여중
  RETURNED: "returned", // 반납됨
  CANCELLED: "cancelled", // 취소됨
} as const;

export type RentalStatus = (typeof RENTAL_STATUS)[keyof typeof RENTAL_STATUS];

/**
 * 대여 상태 라벨
 */
export const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  [RENTAL_STATUS.ACTIVE]: "대여중",
  [RENTAL_STATUS.RETURNED]: "반납됨",
  [RENTAL_STATUS.CANCELLED]: "취소됨",
};

/**
 * 대여 기록 검증 스키마
 */
export const rentalSchema = z.object({
  equipment_id: z.string().uuid("유효한 기기 ID가 아닙니다."),
  client_id: z.string().uuid("유효한 대상자 ID가 아닙니다."),
  rental_date: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "유효한 날짜를 입력하세요." },
    )
    .optional(),
  expected_return_date: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "유효한 날짜를 입력하세요." },
    )
    .optional(),
  quantity: z.number().int("수량은 정수여야 합니다.").min(1, "수량은 1 이상이어야 합니다.").default(1),
  notes: z.string().max(5000, "메모는 최대 5000자까지 입력 가능합니다.").optional(),
});

export type RentalFormData = z.infer<typeof rentalSchema>;

/**
 * 대여 기록 API 응답 타입
 */
export interface Rental extends RentalFormData {
  id: string;
  status: RentalStatus;
  actual_return_date?: string;
  contract_url?: string;
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
  updated_by_user_id?: string;
  // 관계 데이터 (JOIN 시)
  equipment?: {
    id: string;
    name: string;
    category?: string;
  };
  client?: {
    id: string;
    name: string;
  };
}

/**
 * 대여 기록 수정용 스키마 (부분 업데이트 허용)
 */
export const rentalUpdateSchema = rentalSchema.partial().extend({
  equipment_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
});

export type RentalUpdateData = z.infer<typeof rentalUpdateSchema>;

/**
 * 반납 처리 스키마
 */
export const rentalReturnSchema = z.object({
  actual_return_date: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "유효한 날짜를 입력하세요." },
    )
    .optional(),
  notes: z.string().max(5000, "메모는 최대 5000자까지 입력 가능합니다.").optional(),
});

export type RentalReturnData = z.infer<typeof rentalReturnSchema>;

