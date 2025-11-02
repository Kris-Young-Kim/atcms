/**
 * 테스트용 Mock 대여 데이터
 *
 * 대여 관련 Mock 데이터를 생성하는 팩토리 함수들입니다.
 */

import type { z } from "zod";
import type { rentalSchema } from "@/lib/validations/rental";
import { RENTAL_STATUS } from "@/lib/validations/rental";

export type RentalFormData = z.infer<typeof rentalSchema>;

export interface MockRental extends RentalFormData {
  id: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  updated_by_user_id: string;
  status: "active" | "returned" | "cancelled";
  return_date?: string;
  return_condition?: string;
  return_notes?: string;
}

/**
 * Mock 대여 기록 생성 함수
 *
 * @param overrides - 기본값을 덮어쓸 필드들
 * @returns Mock 대여 기록 객체
 *
 * @example
 * ```typescript
 * const rental = createMockRental({ equipment_id: "equipment_001" });
 * const returnedRental = createMockRental({ status: "returned", return_date: "2024-01-15" });
 * ```
 */
export function createMockRental(overrides: Partial<MockRental> = {}): MockRental {
  const id = overrides.id || `rental_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  const userId = overrides.created_by_user_id || "user_admin_001";
  const rentalDate = new Date();
  const expectedReturnDate = new Date();
  expectedReturnDate.setDate(rentalDate.getDate() + 30); // 30일 후

  return {
    id,
    equipment_id: "equipment_001",
    client_id: "client_001",
    rental_date: rentalDate.toISOString().split("T")[0],
    expected_return_date: expectedReturnDate.toISOString().split("T")[0],
    status: RENTAL_STATUS.ACTIVE,
    notes: "테스트 대여 기록",
    created_at: now,
    updated_at: now,
    created_by_user_id: userId,
    updated_by_user_id: userId,
    ...overrides,
  };
}

/**
 * 기본 Mock 대여 기록 목록
 */
export const mockRentals: MockRental[] = [
  createMockRental({
    id: "rental_001",
    equipment_id: "equipment_001",
    client_id: "client_001",
    rental_date: "2024-01-01",
    expected_return_date: "2024-01-31",
    status: RENTAL_STATUS.ACTIVE,
  }),
  createMockRental({
    id: "rental_002",
    equipment_id: "equipment_002",
    client_id: "client_002",
    rental_date: "2024-01-05",
    expected_return_date: "2024-02-04",
    status: RENTAL_STATUS.ACTIVE,
  }),
  createMockRental({
    id: "rental_003",
    equipment_id: "equipment_001",
    client_id: "client_003",
    rental_date: "2023-12-01",
    expected_return_date: "2023-12-31",
    status: RENTAL_STATUS.RETURNED,
    return_date: "2023-12-28",
    return_condition: "good",
    return_notes: "정상 반납",
  }),
];

/**
 * 유효한 대여 등록 데이터
 */
export const validRentalData: RentalFormData = {
  equipment_id: "equipment_001",
  client_id: "client_001",
  rental_date: new Date().toISOString().split("T")[0],
  expected_return_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  notes: "새 대여 기록",
};

/**
 * 잘못된 대여 등록 데이터 (검증 실패용)
 */
export const invalidRentalData = {
  equipment_id: "invalid-uuid", // 잘못된 UUID 형식
  client_id: "invalid-uuid", // 잘못된 UUID 형식
  rental_date: "invalid-date", // 잘못된 날짜 형식
};
