/**
 * 테스트용 Mock 사용자 데이터
 *
 * 역할별 사용자 Mock 데이터를 생성하는 팩토리 함수들입니다.
 */

export type UserRole = "admin" | "leader" | "specialist" | "socialWorker" | "technician";

export interface MockUser {
  userId: string;
  sessionClaims: {
    metadata?: {
      role?: UserRole;
    };
  };
}

/**
 * Mock 사용자 생성 함수
 *
 * @param role - 사용자 역할
 * @param userId - 사용자 ID (선택사항, 기본값: `user_${role}_test`)
 * @returns Mock 사용자 객체
 *
 * @example
 * ```typescript
 * const adminUser = createMockUser("admin");
 * const leaderUser = createMockUser("leader", "custom_user_id");
 * ```
 */
export function createMockUser(role: UserRole, userId?: string): MockUser {
  return {
    userId: userId || `user_${role}_test`,
    sessionClaims: {
      metadata: {
        role,
      },
    },
  };
}

/**
 * 관리자 Mock 사용자
 */
export const mockAdminUser = createMockUser("admin", "user_admin_001");

/**
 * 팀장 Mock 사용자
 */
export const mockLeaderUser = createMockUser("leader", "user_leader_001");

/**
 * 작업치료사 Mock 사용자
 */
export const mockSpecialistUser = createMockUser("specialist", "user_specialist_001");

/**
 * 사회복지사 Mock 사용자
 */
export const mockSocialWorkerUser = createMockUser("socialWorker", "user_socialworker_001");

/**
 * 보조공학사 Mock 사용자
 */
export const mockTechnicianUser = createMockUser("technician", "user_technician_001");

/**
 * 인증되지 않은 사용자 (로그인하지 않은 상태)
 */
export const mockUnauthenticatedUser: MockUser = {
  userId: null as unknown as string,
  sessionClaims: {
    metadata: {},
  },
};
