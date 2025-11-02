/**
 * GET /api/equipment 및 POST /api/equipment 테스트
 * Sprint 1: ERM-US-01
 *
 * 참고: 실제 Clerk, Supabase를 모킹하여 테스트합니다.
 */

import { GET, POST } from "../route";
import { setupApiAuthMock, expectUnauthorized, expectForbidden, expectBadRequest, expectOk, expectCreated } from "@/__tests__/utils/api-helpers";
import { createMockRequest } from "@/__tests__/utils/test-helpers";
import { mockAdminUser, mockTechnicianUser, mockUnauthenticatedUser } from "@/__tests__/mocks/users";
import { createMockEquipment, mockEquipments, validEquipmentData } from "@/__tests__/mocks/equipment";
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

describe("GET /api/equipment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("인증 검증", () => {
    it("로그인하지 않은 경우 401 반환해야 함", async () => {
      setupApiAuthMock(mockUnauthenticatedUser, mockAuth);

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost/api/equipment",
      });

      const response = await GET(request);
      await expectUnauthorized(response);
    });
  });

  describe("기기 목록 조회", () => {
    beforeEach(() => {
      setupApiAuthMock(mockAdminUser, mockAuth);
    });

    it("기기 목록을 조회할 수 있어야 함", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue(createMockSuccessResponse(mockEquipments)),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost/api/equipment",
      });

      const response = await GET(request);
      const data = await expectOk(response);

      expect(data).toHaveProperty("data");
      expect(Array.isArray((data as { data: unknown[] }).data)).toBe(true);
      expect(auditLogger.info).toHaveBeenCalledWith("equipment_list_viewed", expect.any(Object));
    });

    it("상태 필터로 필터링할 수 있어야 함", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue(createMockSuccessResponse(mockEquipments)),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost/api/equipment?status=normal",
      });

      const response = await GET(request);
      await expectOk(response);

      expect(mockSupabase.from("equipment").select().eq).toHaveBeenCalledWith("status", "normal");
    });
  });
});

describe("POST /api/equipment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("인증 검증", () => {
    it("로그인하지 않은 경우 401 반환해야 함", async () => {
      setupApiAuthMock(mockUnauthenticatedUser, mockAuth);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost/api/equipment",
        body: validEquipmentData,
      });

      const response = await POST(request);
      await expectUnauthorized(response);
    });
  });

  describe("역할 권한 검증", () => {
    it("technician 역할은 허용되어야 함 (ERM 모듈 접근 가능)", async () => {
      setupApiAuthMock(mockTechnicianUser, mockAuth);

      const mockEquipment = createMockEquipment();
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(createMockSuccessResponse(mockEquipment)),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost/api/equipment",
        body: validEquipmentData,
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });

  describe("데이터 검증", () => {
    beforeEach(() => {
      setupApiAuthMock(mockAdminUser, mockAuth);
    });

    it("유효한 데이터로 기기를 등록할 수 있어야 함", async () => {
      const mockEquipment = createMockEquipment();
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(createMockSuccessResponse(mockEquipment)),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost/api/equipment",
        body: validEquipmentData,
      });

      const response = await POST(request);
      const data = await expectCreated(response);

      expect(data).toEqual(mockEquipment);
      expect(auditLogger.info).toHaveBeenCalledWith("equipment_created", expect.any(Object));
    });

    it("이름이 없으면 400 반환해야 함", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost/api/equipment",
        body: { name: "" },
      });

      const response = await POST(request);
      await expectBadRequest(response);
    });
  });

  describe("데이터베이스 오류 처리", () => {
    beforeEach(() => {
      setupApiAuthMock(mockAdminUser, mockAuth);
    });

    it("Supabase insert 실패 시 500 반환해야 함", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(createMockErrorResponse("Database error")),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost/api/equipment",
        body: validEquipmentData,
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});

