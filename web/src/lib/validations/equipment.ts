import { z } from "zod";

/**
 * 기기 재고 검증 스키마
 * Sprint 1: ERM-US-01
 */

/**
 * 기기 상태 Enum
 */
export const EQUIPMENT_STATUS = {
  NORMAL: "normal", // 정상
  MAINTENANCE: "maintenance", // 유지보수
  RETIRED: "retired", // 폐기
} as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUS)[keyof typeof EQUIPMENT_STATUS];

/**
 * 기기 상태 라벨
 */
export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  [EQUIPMENT_STATUS.NORMAL]: "정상",
  [EQUIPMENT_STATUS.MAINTENANCE]: "유지보수",
  [EQUIPMENT_STATUS.RETIRED]: "폐기",
};

/**
 * 기기 카테고리 Enum
 */
export const EQUIPMENT_CATEGORIES = {
  WHEELCHAIR: "wheelchair", // 휠체어
  HEARING_AID: "hearing_aid", // 보청기
  COMMUNICATION_AID: "communication_aid", // 의사소통 보조기기
  MOBILITY_AID: "mobility_aid", // 이동 보조기기
  DAILY_LIVING_AID: "daily_living_aid", // 일상생활 보조기기
  OTHER: "other", // 기타
} as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[keyof typeof EQUIPMENT_CATEGORIES];

/**
 * 기기 카테고리 라벨
 */
export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  [EQUIPMENT_CATEGORIES.WHEELCHAIR]: "휠체어",
  [EQUIPMENT_CATEGORIES.HEARING_AID]: "보청기",
  [EQUIPMENT_CATEGORIES.COMMUNICATION_AID]: "의사소통 보조기기",
  [EQUIPMENT_CATEGORIES.MOBILITY_AID]: "이동 보조기기",
  [EQUIPMENT_CATEGORIES.DAILY_LIVING_AID]: "일상생활 보조기기",
  [EQUIPMENT_CATEGORIES.OTHER]: "기타",
};

/**
 * 기기 검증 스키마
 */
export const equipmentSchema = z.object({
  name: z
    .string()
    .min(1, "기기명은 필수 항목입니다.")
    .max(200, "기기명은 최대 200자까지 입력 가능합니다."),
  category: z
    .enum(
      [
        EQUIPMENT_CATEGORIES.WHEELCHAIR,
        EQUIPMENT_CATEGORIES.HEARING_AID,
        EQUIPMENT_CATEGORIES.COMMUNICATION_AID,
        EQUIPMENT_CATEGORIES.MOBILITY_AID,
        EQUIPMENT_CATEGORIES.DAILY_LIVING_AID,
        EQUIPMENT_CATEGORIES.OTHER,
      ],
      {
        errorMap: () => ({ message: "유효한 카테고리를 선택하세요." }),
      },
    )
    .optional(),
  brand: z.string().max(100, "브랜드는 최대 100자까지 입력 가능합니다.").optional(),
  model: z.string().max(100, "모델명은 최대 100자까지 입력 가능합니다.").optional(),
  serial_number: z.string().max(100, "시리얼 번호는 최대 100자까지 입력 가능합니다.").optional(),
  description: z.string().max(1000, "설명은 최대 1000자까지 입력 가능합니다.").optional(),
  status: z
    .enum([EQUIPMENT_STATUS.NORMAL, EQUIPMENT_STATUS.MAINTENANCE, EQUIPMENT_STATUS.RETIRED], {
      errorMap: () => ({ message: "유효한 상태를 선택하세요." }),
    })
    .default(EQUIPMENT_STATUS.NORMAL),
  total_quantity: z
    .number()
    .int("수량은 정수여야 합니다.")
    .min(0, "수량은 0 이상이어야 합니다.")
    .default(1),
  available_quantity: z
    .number()
    .int("수량은 정수여야 합니다.")
    .min(0, "수량은 0 이상이어야 합니다.")
    .default(0),
  location: z.string().max(200, "보관 위치는 최대 200자까지 입력 가능합니다.").optional(),
  purchase_date: z
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
  purchase_price: z
    .number()
    .min(0, "가격은 0 이상이어야 합니다.")
    .max(9999999999.99, "가격은 최대 9,999,999,999.99까지 입력 가능합니다.")
    .optional(),
  warranty_expires: z
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

export type EquipmentFormData = z.infer<typeof equipmentSchema>;

/**
 * 기기 API 응답 타입
 */
export interface Equipment extends EquipmentFormData {
  id: string;
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
  updated_by_user_id?: string;
}

/**
 * 기기 수정용 스키마 (부분 업데이트 허용)
 */
export const equipmentUpdateSchema = equipmentSchema.partial();

export type EquipmentUpdateData = z.infer<typeof equipmentUpdateSchema>;

/**
 * 기기 상태 변경 스키마
 */
export const equipmentStatusUpdateSchema = z.object({
  status: z.enum(
    [EQUIPMENT_STATUS.NORMAL, EQUIPMENT_STATUS.MAINTENANCE, EQUIPMENT_STATUS.RETIRED],
    {
      errorMap: () => ({ message: "유효한 상태를 선택하세요." }),
    },
  ),
});

export type EquipmentStatusUpdateData = z.infer<typeof equipmentStatusUpdateSchema>;

/**
 * 기기 수량 조정 스키마
 */
export const equipmentQuantityUpdateSchema = z
  .object({
    total_quantity: z.number().int().min(0),
    available_quantity: z.number().int().min(0),
  })
  .refine((data) => data.available_quantity <= data.total_quantity, {
    message: "가용 수량은 전체 수량을 초과할 수 없습니다.",
    path: ["available_quantity"],
  });

export type EquipmentQuantityUpdateData = z.infer<typeof equipmentQuantityUpdateSchema>;
