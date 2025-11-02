/**
 * POST /api/rentals 테스트
 * Sprint 1: ERM-US-02
 *
 * 참고: 실제 Clerk, Supabase를 모킹하여 테스트합니다.
 */

import { POST } from "../route";
import { setupApiAuthMock, expectUnauthorized, expectForbidden, expectBadRequest, expectCreated } from "@/__tests__/utils/api-helpers";
import { createMockRequest } from "@/__tests__/utils/test-helpers";
import { mockAdminUser, mockSpecialistUser, mockUnauthenticatedUser, mockTechnicianUser } from "@/__tests__/mocks/users";
import { createMockRental, validRentalData } from "@/__tests__/mocks/rentals";
import { createMockEquipment } from "@/__tests__/mocks/equipment";
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

describe("POST /api/rentals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("인증 검증", () => {
    it("로그인하지 않은 경우 401 반환해야 함", async () => {
      setupApiAuthMock(mockUnauthenticatedUser, mockAuth);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost/api/rentals",
        body: validRentalData,
      });

      const response = await POST(request);
      await expectUnauthorized(response);
    });
  });

  describe("역할 권한 검증", () => {
    it("specialist 역할은 403 반환해야 함", async () => {
      setupApiAuthMock(mockSpecialistUser, mockAuth);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost/api/rentals",
        body: validRentalData,
      });

      const response = await POST(request);
      await expectForbidden(response);
    });

    it("technician 역할은 허용되어야 함", async () => {
      setupApiAuthMock(mockTechnicianUser, mockAuth);

      const mockEquipment = createMockEquipment({
        id: validRentalData.equipment_id,
        status: "normal",
        available_quantity: 5,
      });

      const mockRental = createMockRental();

      const mockSupabase = {
        from: jest.fn((table: string) => {
          if (table === "equipment") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue(createMockSuccessResponse(mockEquipment)),
                }),
              }),
            };
          }
          if (table === "rentals") {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue(createMockSuccessResponse(mockRental)),
                }),
              }),
            };
          }
          return {};
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost/api/rentals",
        body: validRentalData,
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });

  describe("데이터 검증", () => {
    beforeEach(() => {
      setupApiAuthMock(mockAdminUser, mockAuth);
    });

    it("유효한 데이터로 대여를 생성할 수 있어야 함", async () => {
      const mockEquipment = createMockEquipment({
        id: validRentalData.equipment_id,
        status: "normal",
        available_quantity: 5,
      });

      const mockRental = createMockRental();

      const mockSupabase = {
        from: jest.fn((table: string) => {
          if (table === "equipment") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue(createMockSuccessResponse(mockEquipment)),
                }),
              }),
            };
          }
          if (table === "rentals") {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue(createMockSuccessResponse(mockRental)),
                }),
              }),
            };
          }
          return {};
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost/api/rentals",
        body: validRentalData,
      });

      const response = await POST(request);
      const data = await expectCreated(response);

      expect(data).toEqual(mockRental);
      expect(auditLogger.info).toHaveBeenCalledWith("rental_created", expect.any(Object));
    });

    it("잘못된 UUID 형식이면 400 반환해야 함", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost/api/rentals",
        body: {
          equipment_id: "invalid-uuid",
          client_id: "invalid-uuid",
        },
      });

      const response = await POST(request);
      await expectBadRequest(response);
    });
  });

  describe("기기 상태 확인", () => {
    beforeEach(() => {
      setupApiAuthMock(mockAdminUser, mockAuth);
    });

    it("유지보수 상태의 기기는 대여할 수 없어야 함", async () => {
      const mockEquipment = createMockEquipment({
        id: validRentalData.equipment_id,
        status: "maintenance",
        available_quantity: 5,
      });

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(createMockSuccessResponse(mockEquipment)),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost/api/rentals",
        body: validRentalData,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("대여 불가능한 상태");
    });

    it("가용 수량이 부족하면 400 반환해야 함", async () => {
      const mockEquipment = createMockEquipment({
        id: validRentalData.equipment_id,
        status: "normal",
        available_quantity: 0,
      });

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(createMockSuccessResponse(mockEquipment)),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost/api/rentals",
        body: { ...validRentalData, quantity: 1 },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("가용 수량이 부족합니다");
    });
  });
});

