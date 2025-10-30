/**
 * POST /api/clients 테스트
 * Sprint 1: CMS-US-01
 *
 * 참고: 실제 Clerk, Supabase를 모킹하여 테스트합니다.
 */

import { POST } from "../route";

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
  },
}));

import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { auditLogger } from "@/lib/logger/auditLogger";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<
  typeof createSupabaseServerClient
>;

describe("POST /api/clients", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("인증 검증", () => {
    it("로그인하지 않은 경우 401 반환해야 함", async () => {
      mockAuth.mockResolvedValue({ userId: null, sessionClaims: null });

      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({ name: "홍길동" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(auditLogger.error).toHaveBeenCalledWith(
        "client_create_unauthorized",
        expect.any(Object),
      );
    });
  });

  describe("역할 권한 검증", () => {
    it("technician 역할은 403 반환해야 함", async () => {
      mockAuth.mockResolvedValue({
        userId: "user_123",
        sessionClaims: { metadata: { role: "technician" } },
      });

      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({ name: "홍길동" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden: Insufficient permissions");
    });

    it("socialWorker 역할은 403 반환해야 함", async () => {
      mockAuth.mockResolvedValue({
        userId: "user_123",
        sessionClaims: { metadata: { role: "socialWorker" } },
      });

      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({ name: "홍길동" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
    });

    it("admin 역할은 허용되어야 함", async () => {
      mockAuth.mockResolvedValue({
        userId: "user_123",
        sessionClaims: { metadata: { role: "admin" } },
      });

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "client_123", name: "홍길동" },
                error: null,
              }),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({ name: "홍길동" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe("데이터 검증", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: "user_123",
        sessionClaims: { metadata: { role: "admin" } },
      });
    });

    it("이름이 없으면 400 반환해야 함", async () => {
      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("잘못된 이메일 형식이면 400 반환해야 함", async () => {
      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({
          name: "홍길동",
          contact_email: "invalid-email",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("유효한 데이터이면 성공해야 함", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: "client_123",
                  name: "홍길동",
                  status: "active",
                  created_by_user_id: "user_123",
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({
          name: "홍길동",
          birth_date: "1990-01-01",
          gender: "male",
          contact_phone: "010-1234-5678",
          contact_email: "hong@example.com",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("client_123");
      expect(data.name).toBe("홍길동");
      expect(auditLogger.info).toHaveBeenCalledWith("client_created", expect.any(Object));
    });
  });

  describe("데이터베이스 오류 처리", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: "user_123",
        sessionClaims: { metadata: { role: "admin" } },
      });
    });

    it("Supabase insert 실패 시 500 반환해야 함", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({ name: "홍길동" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create client");
      expect(auditLogger.error).toHaveBeenCalledWith("client_create_failed", expect.any(Object));
    });
  });

  describe("예외 처리", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: "user_123",
        sessionClaims: { metadata: { role: "admin" } },
      });
    });

    it("예상치 못한 예외 발생 시 500 반환해야 함", async () => {
      const mockSupabase = {
        from: jest.fn().mockImplementation(() => {
          throw new Error("Unexpected error");
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({ name: "홍길동" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
      expect(auditLogger.error).toHaveBeenCalledWith(
        "client_create_exception",
        expect.any(Object),
      );
    });
  });
});

