/**
 * 테스트 헬퍼 함수
 * 
 * 테스트 작성 시 공통으로 사용하는 유틸리티 함수들입니다.
 */

import type { Request } from "next/server";
import { mockAdminUser, mockUnauthenticatedUser, type MockUser } from "../mocks/users";

/**
 * Mock Request 객체 생성 함수
 * 
 * @param options - Request 옵션
 * @returns Mock Request 객체
 * 
 * @example
 * ```typescript
 * const request = createMockRequest({
 *   method: "POST",
 *   url: "/api/clients",
 *   body: { name: "홍길동" },
 * });
 * ```
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Request {
  const { method = "GET", url = "http://localhost/api", body, headers = {} } = options;

  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(url, requestInit);
}

/**
 * Clerk 인증 Mock 설정 헬퍼
 * 
 * @param user - Mock 사용자 객체
 * @param mockAuth - Clerk auth Mock 함수
 * 
 * @example
 * ```typescript
 * setupAuthMock(mockAdminUser, mockAuth);
 * ```
 */
export function setupAuthMock(user: MockUser, mockAuth: jest.Mock) {
  if (user.userId === null) {
    mockAuth.mockResolvedValue({
      userId: null,
      sessionClaims: null,
    });
  } else {
    mockAuth.mockResolvedValue({
      userId: user.userId,
      sessionClaims: user.sessionClaims,
    });
  }
}

/**
 * 테스트 정리 함수
 * 
 * 모든 Mock을 초기화합니다.
 * 
 * @example
 * ```typescript
 * afterEach(() => {
 *   cleanupMocks();
 * });
 * ```
 */
export function cleanupMocks() {
  jest.clearAllMocks();
}

/**
 * 비동기 함수 실행 헬퍼
 * 
 * @param fn - 실행할 비동기 함수
 * @returns Promise 결과
 * 
 * @example
 * ```typescript
 * const result = await waitFor(() => someAsyncFunction());
 * ```
 */
export async function waitFor<T>(fn: () => Promise<T>, timeout = 5000): Promise<T> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      return await fn();
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error(`Timeout waiting for function after ${timeout}ms`);
}

/**
 * 에러 객체 생성 헬퍼
 * 
 * @param message - 에러 메시지
 * @returns Error 객체
 * 
 * @example
 * ```typescript
 * const error = createError("Database connection failed");
 * ```
 */
export function createError(message: string): Error {
  return new Error(message);
}

/**
 * 날짜 문자열 생성 헬퍼
 * 
 * @param daysOffset - 오늘 기준 날짜 오프셋 (음수 가능)
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 * 
 * @example
 * ```typescript
 * const today = createDateString(0);
 * const yesterday = createDateString(-1);
 * const tomorrow = createDateString(1);
 * ```
 */
export function createDateString(daysOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split("T")[0];
}

/**
 * UUID 생성 헬퍼 (간단한 버전)
 * 
 * @returns UUID 형식의 문자열
 * 
 * @example
 * ```typescript
 * const id = createUUID();
 * ```
 */
export function createUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

