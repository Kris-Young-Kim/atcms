import { z } from "zod";

/**
 * 유지보수 노트 검증 스키마
 * Sprint 1: ERM-US-03
 */

/**
 * 유지보수 유형 Enum
 */
export const MAINTENANCE_TYPES = {
  REPAIR: "repair", // 수리
  INSPECTION: "inspection", // 점검
  CLEANING: "cleaning", // 청소
  CALIBRATION: "calibration", // 교정
  REPLACEMENT: "replacement", // 교체
  OTHER: "other", // 기타
} as const;

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[keyof typeof MAINTENANCE_TYPES];

/**
 * 유지보수 유형 라벨
 */
export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  [MAINTENANCE_TYPES.REPAIR]: "수리",
  [MAINTENANCE_TYPES.INSPECTION]: "점검",
  [MAINTENANCE_TYPES.CLEANING]: "청소",
  [MAINTENANCE_TYPES.CALIBRATION]: "교정",
  [MAINTENANCE_TYPES.REPLACEMENT]: "교체",
  [MAINTENANCE_TYPES.OTHER]: "기타",
};

/**
 * 유지보수 노트 검증 스키마
 */
export const maintenanceNoteSchema = z.object({
  equipment_id: z.string().uuid("유효한 기기 ID가 아닙니다."),
  note_date: z
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
  title: z
    .string()
    .min(1, "제목은 필수 항목입니다.")
    .max(200, "제목은 최대 200자까지 입력 가능합니다."),
  content: z.string().max(5000, "내용은 최대 5000자까지 입력 가능합니다.").optional(),
  maintenance_type: z
    .enum(
      [
        MAINTENANCE_TYPES.REPAIR,
        MAINTENANCE_TYPES.INSPECTION,
        MAINTENANCE_TYPES.CLEANING,
        MAINTENANCE_TYPES.CALIBRATION,
        MAINTENANCE_TYPES.REPLACEMENT,
        MAINTENANCE_TYPES.OTHER,
      ],
      {
        errorMap: () => ({ message: "유효한 유지보수 유형을 선택하세요." }),
      },
    )
    .optional(),
  cost: z
    .number()
    .min(0, "비용은 0 이상이어야 합니다.")
    .max(9999999999.99, "비용은 최대 9,999,999,999.99까지 입력 가능합니다.")
    .optional(),
});

export type MaintenanceNoteFormData = z.infer<typeof maintenanceNoteSchema>;

/**
 * 유지보수 노트 API 응답 타입
 */
export interface MaintenanceNote extends MaintenanceNoteFormData {
  id: string;
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
  updated_by_user_id?: string;
}

/**
 * 유지보수 노트 수정용 스키마 (부분 업데이트 허용)
 */
export const maintenanceNoteUpdateSchema = maintenanceNoteSchema.partial().extend({
  equipment_id: z.string().uuid().optional(),
});

export type MaintenanceNoteUpdateData = z.infer<typeof maintenanceNoteUpdateSchema>;
