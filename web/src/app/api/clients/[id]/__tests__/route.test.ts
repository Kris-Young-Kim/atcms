/**
 * GET /api/clients/[id] 및 PUT /api/clients/[id] 테스트
 * Sprint 1: CMS-US-01
 *
 * 참고: 실제 Clerk, Supabase를 모킹하여 테스트합니다.
 */

import { GET, PUT } from "../route";
import { setupApiAuthMock, expectUnauthorized, expectForbidden, expectBadRequest, expectOk, expectCreated } from "@/__tests__/utils/api-helpers";
import { createMockRequest } from "@/__tests__/utils/test-helpers";
import { mockAdminUser, mockTechnicianUser, mockUnauthenticatedUser } from "@/__tests__/mocks/users";
import { createMockClient, mockClients, validClientData } from "@/__tests__/mocks/clients";
import { createMockSuccessResponse, createMockErrorResponse } from "@/__tests__/mocks/supabase";

// Clerk 모킹
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

// Supabase 모킹
jest.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: jest.fn(),
}));

// auditLogger 모킹
jest.mock("@/lib/logger/auditLogger", () => ({
  auditLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { auditLogger } from "@/lib/logger/auditLogger";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<
  typeof createSupabaseServerClient
>;

describe("GET /api/clients/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("인증 검증", () => {
    it("로그인하지 않은 경우 401 반환해야 함", async () => {
      setupApiAuthMock(mockUnauthenticatedUser, mockAuth);

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost/api/clients/client_001",
      });

      const response = await GET(request, { params: Promise.resolve({ id: "client_001" }) });
      await expectUnauthorized(response);
    });
  });

  describe("대상자 조회", () => {
    beforeEach(() => {
      setupApiAuthMock(mockAdminUser, mockAuth);
    });

    it("유효한 ID로 대상자를 조회할 수 있어야 함", async () => {
      const mockClient = createMockClient({ id: "client_001" });
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(createMockSuccessResponse(mockClient)),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost/api/clients/client_001",
      });

      const response = await GET(request, { params: Promise.resolve({ id: "client_001" }) });
      const data = await expectOk(response);

      expect(data).toEqual(mockClient);
      expect(mockSupabase.from).toHaveBeenCalledWith("clients");
      expect(auditLogger.info).toHaveBeenCalledWith("client_viewed", {
        actorId: mockAdminUser.userId,
        metadata: { clientId: "client_001" },
      });
    });

    it("존재하지 않는 ID로 조회 시 404 반환해야 함", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(createMockErrorResponse("Not found")),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost/api/clients/nonexistent_id",
      });

      const response = await GET(request, { params: Promise.resolve({ id: "nonexistent_id" }) });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });
  });
});

describe("PUT /api/clients/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("인증 검증", () => {
    it("로그인하지 않은 경우 401 반환해야 함", async () => {
      setupApiAuthMock(mockUnauthenticatedUser, mockAuth);

      const request = createMockRequest({
        method: "PUT",
        url: "http://localhost/api/clients/client_001",
        body: { name: "수정된 이름" },
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "client_001" }) });
      await expectUnauthorized(response);
    });
  });

  describe("역할 권한 검증", () => {
    it("technician 역할은 403 반환해야 함", async () => {
      setupApiAuthMock(mockTechnicianUser, mockAuth);

      const request = createMockRequest({
        method: "PUT",
        url: "http://localhost/api/clients/client_001",
        body: { name: "수정된 이름" },
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "client_001" }) });
      await expectForbidden(response);
    });
  });

  describe("데이터 검증", () => {
    beforeEach(() => {
      setupApiAuthMock(mockAdminUser, mockAuth);
    });

    it("유효한 데이터로 수정할 수 있어야 함", async () => {
      const updatedClient = createMockClient({
        id: "client_001",
        name: "수정된 이름",
      });

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(createMockSuccessResponse(updatedClient)),
              }),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "PUT",
        url: "http://localhost/api/clients/client_001",
        body: { name: "수정된 이름" },
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "client_001" }) });
      const data = await expectOk(response);

      expect(data).toEqual(updatedClient);
      expect(auditLogger.info).toHaveBeenCalledWith("client_updated", {
        actorId: mockAdminUser.userId,
        metadata: { clientId: "client_001" },
      });
    });

    it("잘못된 데이터로 수정 시 400 반환해야 함", async () => {
      const request = createMockRequest({
        method: "PUT",
        url: "http://localhost/api/clients/client_001",
        body: { name: "" }, // 빈 이름 (검증 실패)
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "client_001" }) });
      await expectBadRequest(response);
    });
  });

  describe("데이터베이스 오류 처리", () => {
    beforeEach(() => {
      setupApiAuthMock(mockAdminUser, mockAuth);
    });

    it("Supabase update 실패 시 500 반환해야 함", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(createMockErrorResponse("Database error")),
              }),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "PUT",
        url: "http://localhost/api/clients/client_001",
        body: { name: "수정된 이름" },
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "client_001" }) });
      expect(response.status).toBe(500);
    });
  });
});

