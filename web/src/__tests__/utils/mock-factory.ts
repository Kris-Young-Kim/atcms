/**
 * Mock 데이터 팩토리 함수
 *
 * 테스트용 Mock 데이터를 생성하는 팩토리 함수들입니다.
 */

export {
  createMockUser,
  mockAdminUser,
  mockLeaderUser,
  mockSpecialistUser,
  mockSocialWorkerUser,
  mockTechnicianUser,
  mockUnauthenticatedUser,
} from "../mocks/users";
export type { MockUser, UserRole } from "../mocks/users";

export {
  createMockClient,
  mockClients,
  validClientData,
  invalidClientData,
} from "../mocks/clients";
export type { MockClient } from "../mocks/clients";

export {
  createMockEquipment,
  mockEquipments,
  validEquipmentData,
  invalidEquipmentData,
} from "../mocks/equipment";
export type { MockEquipment } from "../mocks/equipment";

export {
  createMockRental,
  mockRentals,
  validRentalData,
  invalidRentalData,
} from "../mocks/rentals";
export type { MockRental } from "../mocks/rentals";

export {
  createMockSupabaseClient,
  createMockQueryBuilder,
  createMockSuccessResponse,
  createMockErrorResponse,
} from "../mocks/supabase";
export type { MockSupabaseQueryBuilder } from "../mocks/supabase";

/**
 * 모든 Mock 데이터 초기화 팩토리
 *
 * 테스트 시작 시 모든 Mock 데이터를 초기화합니다.
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetAllMocks();
 * });
 * ```
 */
export function resetAllMocks(): void {
  jest.clearAllMocks();
}
