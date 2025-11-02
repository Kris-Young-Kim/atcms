/**
 * 테스트용 Mock 대상자 데이터
 *
 * 대상자 관련 Mock 데이터를 생성하는 팩토리 함수들입니다.
 */

import type { z } from "zod";
import type { clientSchema } from "@/lib/validations/client";

export type ClientFormData = z.infer<typeof clientSchema>;

export interface MockClient extends ClientFormData {
  id: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  updated_by_user_id: string;
  status: "active" | "inactive" | "archived";
}

/**
 * Mock 대상자 생성 함수
 *
 * @param overrides - 기본값을 덮어쓸 필드들
 * @returns Mock 대상자 객체
 *
 * @example
 * ```typescript
 * const client = createMockClient({ name: "홍길동" });
 * const inactiveClient = createMockClient({ name: "김철수", status: "inactive" });
 * ```
 */
export function createMockClient(overrides: Partial<MockClient> = {}): MockClient {
  const id = overrides.id || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  const userId = overrides.created_by_user_id || "user_admin_001";

  return {
    id,
    name: "테스트 대상자",
    birth_date: "1990-01-01",
    gender: "male",
    disability_type: "시각장애",
    disability_grade: "1급",
    contact_phone: "010-1234-5678",
    contact_email: "test@example.com",
    address: "서울특별시 강남구 테헤란로 123",
    status: "active",
    created_at: now,
    updated_at: now,
    created_by_user_id: userId,
    updated_by_user_id: userId,
    ...overrides,
  };
}

/**
 * 기본 Mock 대상자 목록
 */
export const mockClients: MockClient[] = [
  createMockClient({
    id: "client_001",
    name: "홍길동",
    birth_date: "1985-05-15",
    gender: "male",
    disability_type: "시각장애",
    disability_grade: "1급",
    contact_phone: "010-1234-5678",
    status: "active",
  }),
  createMockClient({
    id: "client_002",
    name: "김영희",
    birth_date: "1990-08-20",
    gender: "female",
    disability_type: "청각장애",
    disability_grade: "2급",
    contact_phone: "010-9876-5432",
    status: "active",
  }),
  createMockClient({
    id: "client_003",
    name: "이철수",
    birth_date: "1975-12-10",
    gender: "male",
    disability_type: "지체장애",
    disability_grade: "3급",
    contact_phone: "010-5555-1234",
    status: "inactive",
  }),
];

/**
 * 유효한 대상자 등록 데이터
 */
export const validClientData: ClientFormData = {
  name: "새 대상자",
  birth_date: "1995-03-15",
  gender: "male",
  disability_type: "시각장애",
  disability_grade: "2급",
  contact_phone: "010-9999-8888",
  contact_email: "newclient@example.com",
  address: "서울특별시 서초구 서초대로 456",
};

/**
 * 잘못된 대상자 등록 데이터 (검증 실패용)
 */
export const invalidClientData = {
  name: "", // 빈 이름 (검증 실패)
  contact_phone: "123-456", // 잘못된 전화번호 형식
  birth_date: "2099-01-01", // 미래 날짜 (검증 실패)
};
