/**
 * 테스트용 Mock 기기 데이터
 * 
 * 기기 관련 Mock 데이터를 생성하는 팩토리 함수들입니다.
 */

import type { z } from "zod";
import type { equipmentSchema } from "@/lib/validations/equipment";
import { EQUIPMENT_STATUS } from "@/lib/validations/equipment";

export type EquipmentFormData = z.infer<typeof equipmentSchema>;

export interface MockEquipment extends EquipmentFormData {
  id: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  updated_by_user_id: string;
  status: "normal" | "maintenance" | "retired";
}

/**
 * Mock 기기 생성 함수
 * 
 * @param overrides - 기본값을 덮어쓸 필드들
 * @returns Mock 기기 객체
 * 
 * @example
 * ```typescript
 * const equipment = createMockEquipment({ name: "휠체어 A형" });
 * const maintenanceEquipment = createMockEquipment({ status: "maintenance" });
 * ```
 */
export function createMockEquipment(overrides: Partial<MockEquipment> = {}): MockEquipment {
  const id = overrides.id || `equipment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  const userId = overrides.created_by_user_id || "user_admin_001";

  return {
    id,
    name: "테스트 기기",
    category: "wheelchair",
    manufacturer: "테스트 제조사",
    model: "테스트 모델",
    serial_number: `SN${Date.now()}`,
    purchase_date: "2024-01-01",
    status: EQUIPMENT_STATUS.NORMAL,
    quantity: 1,
    current_stock: 1,
    notes: "테스트용 기기",
    created_at: now,
    updated_at: now,
    created_by_user_id: userId,
    updated_by_user_id: userId,
    ...overrides,
  };
}

/**
 * 기본 Mock 기기 목록
 */
export const mockEquipments: MockEquipment[] = [
  createMockEquipment({
    id: "equipment_001",
    name: "휠체어 A형",
    category: "wheelchair",
    manufacturer: "ABC 제조사",
    model: "Model-A",
    serial_number: "SN001",
    status: EQUIPMENT_STATUS.NORMAL,
    quantity: 5,
    current_stock: 3,
  }),
  createMockEquipment({
    id: "equipment_002",
    name: "보청기 B형",
    category: "hearing_aid",
    manufacturer: "XYZ 제조사",
    model: "Model-B",
    serial_number: "SN002",
    status: EQUIPMENT_STATUS.NORMAL,
    quantity: 10,
    current_stock: 8,
  }),
  createMockEquipment({
    id: "equipment_003",
    name: "의사소통 보조기기",
    category: "communication_aid",
    manufacturer: "DEF 제조사",
    model: "Model-C",
    serial_number: "SN003",
    status: EQUIPMENT_STATUS.MAINTENANCE,
    quantity: 3,
    current_stock: 2,
  }),
];

/**
 * 유효한 기기 등록 데이터
 */
export const validEquipmentData: EquipmentFormData = {
  name: "새 기기",
  category: "mobility_aid",
  manufacturer: "새 제조사",
  model: "새 모델",
  serial_number: `SN${Date.now()}`,
  purchase_date: "2024-06-01",
  status: EQUIPMENT_STATUS.NORMAL,
  quantity: 1,
  current_stock: 1,
  notes: "새로 등록하는 기기",
};

/**
 * 잘못된 기기 등록 데이터 (검증 실패용)
 */
export const invalidEquipmentData = {
  name: "", // 빈 이름 (검증 실패)
  category: "invalid_category", // 잘못된 카테고리
  quantity: -1, // 음수 수량 (검증 실패)
};

