"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

import { auditLogger } from "@/lib/logger/auditLogger";

/**
 * Protected Route HOC
 *
 * 인증 및 역할 기반 접근 제어를 제공하는 컴포넌트입니다.
 * 로그인하지 않은 사용자는 로그인 페이지로 리디렉션하고,
 * 권한이 없는 사용자는 지정된 페이지로 리디렉션합니다.
 *
 * @component
 *
 * @example
 * ```tsx
 * // 기본 사용 (인증만 확인)
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * // 역할 기반 접근 제어
 * <ProtectedRoute requiredRole={["admin", "leader"]}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 *
 * @see {@link useUserRole} 역할 확인 훅
 */
interface ProtectedRouteProps {
  /** 자식 컴포넌트 */
  children: ReactNode;

  /**
   * 필수 역할 목록 (하나라도 일치하면 접근 허용)
   * @default undefined (인증만 확인)
   */
  requiredRole?: string[];

  /**
   * 권한 없을 때 리디렉션할 경로
   * @default "/dashboard"
   */
  redirectTo?: string;

  /** 로딩 중 표시할 컴포넌트 */
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/dashboard",
  fallback,
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // 로딩 중에는 아무 작업도 하지 않음
    if (!isLoaded) return;

    // 로그인하지 않은 경우 로그인 페이지로 리디렉션
    if (!isSignedIn) {
      auditLogger.info("unauthorized_access_attempt", {
        metadata: {
          reason: "Not signed in",
          intendedRoute: typeof window !== "undefined" ? window.location.pathname : "unknown",
        },
        tags: { security: "access_control" },
      });
      router.push("/sign-in");
      return;
    }

    // 역할 확인이 필요한 경우
    if (requiredRole && requiredRole.length > 0) {
      const userRole = (user?.publicMetadata?.role as string) || "";

      // 역할이 없으면 기본 역할(specialist)로 처리 (개발 환경)
      // 프로덕션에서는 Clerk에서 기본 역할을 할당해야 함
      const effectiveRole = userRole || (process.env.NODE_ENV === "development" ? "specialist" : "");

      if (!requiredRole.includes(effectiveRole)) {
        auditLogger.warn("forbidden_access_attempt", {
          actorId: user?.id,
          metadata: {
            userRole: userRole || "none",
            effectiveRole,
            requiredRoles: requiredRole,
            intendedRoute: typeof window !== "undefined" ? window.location.pathname : "unknown",
          },
          tags: { security: "access_control" },
        });
        router.push(redirectTo);
      }
    }
  }, [isLoaded, isSignedIn, user, requiredRole, redirectTo, router]);

  // 로딩 중이면 fallback 또는 기본 로딩 표시
  if (!isLoaded) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // 로그인하지 않은 경우
  if (!isSignedIn) {
    return null; // 리디렉션 처리 중
  }

  // 역할 권한이 없는 경우
  if (requiredRole && requiredRole.length > 0) {
    const userRole = (user?.publicMetadata?.role as string) || "";

    // 역할이 없으면 기본 역할(specialist)로 처리 (개발 환경)
    // 프로덕션에서는 Clerk에서 기본 역할을 할당해야 함
    const effectiveRole = userRole || (process.env.NODE_ENV === "development" ? "specialist" : "");

    if (!requiredRole.includes(effectiveRole)) {
      return null; // 리디렉션 처리 중
    }
  }

  // 모든 검증 통과 - 자식 컴포넌트 렌더링
  return <>{children}</>;
}

/**
 * 사용자 역할을 확인하는 커스텀 훅입니다.
 *
 * 현재 로그인한 사용자의 역할과 역할 확인 함수를 제공합니다.
 *
 * @returns {object} 역할 정보 및 확인 함수
 * @returns {string} userRole - 현재 사용자 역할
 * @returns {(roles: string | string[]) => boolean} hasRole - 역할 확인 함수
 * @returns {boolean} isAdmin - 관리자 여부
 * @returns {boolean} isLeader - 팀장 여부
 * @returns {boolean} isSpecialist - 작업치료사 여부
 * @returns {boolean} isSocialWorker - 사회복지사 여부
 * @returns {boolean} isTechnician - 보조공학사 여부
 * @returns {boolean} isLoaded - Clerk 로딩 완료 여부
 * @returns {boolean} isSignedIn - 로그인 여부
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { userRole, hasRole, isAdmin } = useUserRole();
 *
 *   if (isAdmin) {
 *     return <AdminPanel />;
 *   }
 *
 *   if (hasRole(["admin", "leader"])) {
 *     return <LeaderPanel />;
 *   }
 *
 *   return <UserPanel />;
 * }
 * ```
 */
export function useUserRole() {
  const { user, isLoaded, isSignedIn } = useUser();

  const userRole = isLoaded && isSignedIn ? (user?.publicMetadata?.role as string) || "" : "";

  const hasRole = (roles: string | string[]) => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(userRole);
  };

  const isAdmin = userRole === "admin";
  const isLeader = userRole === "leader";
  const isSpecialist = userRole === "specialist";
  const isSocialWorker = userRole === "socialWorker";
  const isTechnician = userRole === "technician";

  return {
    userRole,
    hasRole,
    isAdmin,
    isLeader,
    isSpecialist,
    isSocialWorker,
    isTechnician,
    isLoaded,
    isSignedIn,
  };
}
