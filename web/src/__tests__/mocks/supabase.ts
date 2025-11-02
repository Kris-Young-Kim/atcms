/**
 * 테스트용 Supabase Mock
 * 
 * Supabase 클라이언트를 Mock하는 유틸리티 함수들입니다.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Query Builder Mock 타입
 */
export interface MockSupabaseQueryBuilder {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  gt: jest.Mock;
  gte: jest.Mock;
  lt: jest.Mock;
  lte: jest.Mock;
  like: jest.Mock;
  ilike: jest.Mock;
  is: jest.Mock;
  in: jest.Mock;
  contains: jest.Mock;
  range: jest.Mock;
  limit: jest.Mock;
  order: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  csv: jest.Mock;
  geojson: jest.Mock;
  explain: jest.Mock;
  rollback: jest.Mock;
  returns: jest.Mock;
  abortSignal: jest.Mock;
  then: jest.Mock;
  catch: jest.Mock;
  finally: jest.Mock;
}

/**
 * Mock Supabase 클라이언트 생성 함수
 * 
 * @returns Mock Supabase 클라이언트
 * 
 * @example
 * ```typescript
 * const mockSupabase = createMockSupabaseClient();
 * mockSupabase.from("clients").select().mockResolvedValue({
 *   data: [{ id: "client_001", name: "홍길동" }],
 *   error: null,
 * });
 * ```
 */
export function createMockSupabaseClient(): jest.Mocked<SupabaseClient> {
  const mockFrom = jest.fn();
  const mockQueryBuilder = createMockQueryBuilder();

  mockFrom.mockReturnValue(mockQueryBuilder);

  return {
    from: mockFrom,
    // 다른 Supabase 메서드들은 필요시 추가
  } as unknown as jest.Mocked<SupabaseClient>;
}

/**
 * Mock Query Builder 생성 함수
 * 
 * @returns Mock Query Builder
 */
export function createMockQueryBuilder(): MockSupabaseQueryBuilder {
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockEq = jest.fn();
  const mockSingle = jest.fn();

  // 체이닝을 위한 Mock 설정
  const chainableMock = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    neq: jest.fn(),
    gt: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    is: jest.fn(),
    in: jest.fn(),
    contains: jest.fn(),
    range: jest.fn(),
    limit: jest.fn(),
    order: jest.fn(),
    single: mockSingle,
    maybeSingle: jest.fn(),
    csv: jest.fn(),
    geojson: jest.fn(),
    explain: jest.fn(),
    rollback: jest.fn(),
    returns: jest.fn(),
    abortSignal: jest.fn(),
    then: jest.fn(),
    catch: jest.fn(),
    finally: jest.fn(),
  };

  // 체이닝 지원
  mockSelect.mockReturnValue(chainableMock);
  mockInsert.mockReturnValue(chainableMock);
  mockUpdate.mockReturnValue(chainableMock);
  mockDelete.mockReturnValue(chainableMock);
  mockEq.mockReturnValue(chainableMock);
  mockSingle.mockReturnValue(Promise.resolve({ data: null, error: null }));

  return chainableMock;
}

/**
 * 성공 응답을 반환하는 Mock 설정 헬퍼
 * 
 * @param data - 반환할 데이터
 * @returns Mock 응답 객체
 */
export function createMockSuccessResponse<T>(data: T) {
  return {
    data,
    error: null,
  };
}

/**
 * 실패 응답을 반환하는 Mock 설정 헬퍼
 * 
 * @param message - 에러 메시지
 * @returns Mock 응답 객체
 */
export function createMockErrorResponse(message: string) {
  return {
    data: null,
    error: {
      message,
      code: "PGRST_ERROR",
      details: null,
      hint: null,
    },
  };
}

