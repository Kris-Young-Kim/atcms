/**
 * ProtectedRoute 컴포넌트 테스트
 * Sprint 1: CMS-US-01
 *
 * 참고: Clerk와 Next.js Router를 모킹하여 테스트합니다.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { ProtectedRoute } from "../ProtectedRoute";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { auditLogger } from "@/lib/logger/auditLogger";

// Clerk 모킹
jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(),
}));

// Next.js Router 모킹
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// auditLogger 모킹
jest.mock("@/lib/logger/auditLogger", () => ({
  auditLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockPush = jest.fn();

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);
  });

  describe("로딩 상태", () => {
    it("로딩 중일 때 fallback을 표시해야 함", () => {
      mockUseUser.mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        user: null,
      } as any);

      const fallback = <div>Loading...</div>;
      render(
        <ProtectedRoute fallback={fallback}>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("fallback이 없으면 기본 로딩 UI를 표시해야 함", () => {
      mockUseUser.mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        user: null,
      } as any);

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("인증 검증", () => {
    it("로그인하지 않은 경우 로그인 페이지로 리디렉션해야 함", async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null,
      } as any);

      // window.location.pathname 모킹
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/dashboard",
        },
        writable: true,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/sign-in");
        expect(auditLogger.info).toHaveBeenCalledWith("unauthorized_access_attempt", expect.any(Object));
      });

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("로그인한 경우 자식 컴포넌트를 렌더링해야 함", async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: {
          id: "user_123",
          publicMetadata: {},
        },
      } as any);

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("역할 기반 접근 제어", () => {
    it("필요한 역할이 없는 경우 리디렉션해야 함", async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: {
          id: "user_123",
          publicMetadata: {
            role: "socialWorker",
          },
        },
      } as any);

      Object.defineProperty(window, "location", {
        value: {
          pathname: "/admin",
        },
        writable: true,
      });

      render(
        <ProtectedRoute requiredRole={["admin", "leader"]}>
          <div>Admin Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
        expect(auditLogger.error).toHaveBeenCalledWith("forbidden_access_attempt", expect.any(Object));
      });

      expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
    });

    it("필요한 역할이 있는 경우 자식 컴포넌트를 렌더링해야 함", async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: {
          id: "user_123",
          publicMetadata: {
            role: "admin",
          },
        },
      } as any);

      render(
        <ProtectedRoute requiredRole={["admin", "leader"]}>
          <div>Admin Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(screen.getByText("Admin Content")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("여러 역할 중 하나만 일치해도 접근 허용해야 함", async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: {
          id: "user_123",
          publicMetadata: {
            role: "leader",
          },
        },
      } as any);

      render(
        <ProtectedRoute requiredRole={["admin", "leader"]}>
          <div>Leader Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(screen.getByText("Leader Content")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("커스텀 리디렉션 경로", () => {
    it("권한 없을 때 커스텀 redirectTo 경로로 리디렉션해야 함", async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: {
          id: "user_123",
          publicMetadata: {
            role: "technician",
          },
        },
      } as any);

      render(
        <ProtectedRoute requiredRole={["admin"]} redirectTo="/unauthorized">
          <div>Admin Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/unauthorized");
      });
    });
  });
});

