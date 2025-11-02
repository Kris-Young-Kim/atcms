/**
 * API 테스트 헬퍼 함수
 * 
 * API Route 테스트 작성 시 사용하는 헬퍼 함수들입니다.
 */

import type { NextResponse } from "next/server";
import { createMockRequest, setupAuthMock } from "./test-helpers";
import { mockAdminUser, mockUnauthenticatedUser, type MockUser } from "../mocks/users";
import { createMockSuccessResponse, createMockErrorResponse } from "../mocks/supabase";

/**
 * API 응답 검증 헬퍼
 * 
 * @param response - NextResponse 객체
 * @param expectedStatus - 예상 HTTP 상태 코드
 * @returns 응답 JSON 데이터
 * 
 * @example
 * ```typescript
 * const response = await POST(request);
 * const data = await expectResponseStatus(response, 201);
 * expect(data.name).toBe("홍길동");
 * ```
 */
export async function expectResponseStatus(
  response: NextResponse,
  expectedStatus: number,
): Promise<unknown> {
  expect(response.status).toBe(expectedStatus);
  return await response.json();
}

/**
 * 401 Unauthorized 응답 검증 헬퍼
 * 
 * @param response - NextResponse 객체
 * 
 * @example
 * ```typescript
 * await expectUnauthorized(response);
 * ```
 */
export async function expectUnauthorized(response: NextResponse): Promise<void> {
  const data = await expectResponseStatus(response, 401);
  expect(data).toHaveProperty("error");
  expect((data as { error: string }).error).toBe("Unauthorized");
}

/**
 * 403 Forbidden 응답 검증 헬퍼
 * 
 * @param response - NextResponse 객체
 * 
 * @example
 * ```typescript
 * await expectForbidden(response);
 * ```
 */
export async function expectForbidden(response: NextResponse): Promise<void> {
  const data = await expectResponseStatus(response, 403);
  expect(data).toHaveProperty("error");
  expect((data as { error: string }).error).toContain("Forbidden");
}

/**
 * 400 Bad Request 응답 검증 헬퍼
 * 
 * @param response - NextResponse 객체
 * @returns 검증 에러 상세 정보
 * 
 * @example
 * ```typescript
 * const details = await expectBadRequest(response);
 * expect(details).toHaveProperty("name");
 * ```
 */
export async function expectBadRequest(response: NextResponse): Promise<unknown> {
  const data = await expectResponseStatus(response, 400);
  expect(data).toHaveProperty("error");
  expect((data as { error: string }).error).toBe("Validation failed");
  return (data as { details?: unknown }).details;
}

/**
 * 201 Created 응답 검증 헬퍼
 * 
 * @param response - NextResponse 객체
 * @returns 생성된 리소스 데이터
 * 
 * @example
 * ```typescript
 * const created = await expectCreated(response);
 * expect(created.id).toBeDefined();
 * ```
 */
export async function expectCreated<T>(response: NextResponse): Promise<T> {
  return (await expectResponseStatus(response, 201)) as T;
}

/**
 * 200 OK 응답 검증 헬퍼
 * 
 * @param response - NextResponse 객체
 * @returns 응답 데이터
 * 
 * @example
 * ```typescript
 * const data = await expectOk(response);
 * expect(data).toBeDefined();
 * ```
 */
export async function expectOk<T>(response: NextResponse): Promise<T> {
  return (await expectResponseStatus(response, 200)) as T;
}

/**
 * 500 Internal Server Error 응답 검증 헬퍼
 * 
 * @param response - NextResponse 객체
 * 
 * @example
 * ```typescript
 * await expectInternalServerError(response);
 * ```
 */
export async function expectInternalServerError(response: NextResponse): Promise<void> {
  const data = await expectResponseStatus(response, 500);
  expect(data).toHaveProperty("error");
}

/**
 * Clerk 인증 Mock 설정 헬퍼 (API 테스트용)
 * 
 * @param user - Mock 사용자 객체
 * @param mockAuth - Clerk auth Mock 함수
 * 
 * @example
 * ```typescript
 * setupApiAuthMock(mockAdminUser, mockAuth);
 * ```
 */
export function setupApiAuthMock(user: MockUser, mockAuth: jest.Mock): void {
  setupAuthMock(user, mockAuth);
}

/**
 * Supabase Query Builder Mock 설정 헬퍼
 * 
 * @param mockSupabase - Mock Supabase 클라이언트
 * @param tableName - 테이블 이름
 * @param response - Mock 응답
 * 
 * @example
 * ```typescript
 * setupSupabaseMock(mockSupabase, "clients", {
 *   data: [{ id: "client_001", name: "홍길동" }],
 *   error: null,
 * });
 * ```
 */
export function setupSupabaseMock(
  mockSupabase: { from: jest.Mock },
  tableName: string,
  response: { data: unknown; error: unknown },
): void {
  const mockQueryBuilder = mockSupabase.from(tableName);
  mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
  mockQueryBuilder.insert.mockReturnValue(mockQueryBuilder);
  mockQueryBuilder.update.mockReturnValue(mockQueryBuilder);
  mockQueryBuilder.delete.mockReturnValue(mockQueryBuilder);
  mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder);
  mockQueryBuilder.single.mockResolvedValue(response);
}

/**
 * Supabase 성공 응답 Mock 설정
 * 
 * @param mockSupabase - Mock Supabase 클라이언트
 * @param tableName - 테이블 이름
 * @param data - 반환할 데이터
 * 
 * @example
 * ```typescript
 * setupSupabaseSuccess(mockSupabase, "clients", { id: "client_001", name: "홍길동" });
 * ```
 */
export function setupSupabaseSuccess(
  mockSupabase: { from: jest.Mock },
  tableName: string,
  data: unknown,
): void {
  setupSupabaseMock(mockSupabase, tableName, createMockSuccessResponse(data));
}

/**
 * Supabase 에러 응답 Mock 설정
 * 
 * @param mockSupabase - Mock Supabase 클라이언트
 * @param tableName - 테이블 이름
 * @param errorMessage - 에러 메시지
 * 
 * @example
 * ```typescript
 * setupSupabaseError(mockSupabase, "clients", "Database connection failed");
 * ```
 */
export function setupSupabaseError(
  mockSupabase: { from: jest.Mock },
  tableName: string,
  errorMessage: string,
): void {
  setupSupabaseMock(mockSupabase, tableName, createMockErrorResponse(errorMessage));
}

