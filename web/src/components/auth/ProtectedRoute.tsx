"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

import { auditLogger } from "@/lib/logger/auditLogger";

/**
 * Protected Route HOC
 * 인증 및 역할 기반 접근 제어를 제공합니다.
 * Sprint 1: INF-EP-01
 */

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string[];
  redirectTo?: string;
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
          intendedRoute: window.location.pathname,
        },
        tags: { security: "access_control" },
      });
      router.push("/sign-in");
      return;
    }

    // 역할 확인이 필요한 경우
    if (requiredRole && requiredRole.length > 0) {
      const userRole = (user?.publicMetadata?.role as string) || "";

      if (!requiredRole.includes(userRole)) {
        auditLogger.error("forbidden_access_attempt", {
          actorId: user?.id,
          metadata: {
            userRole,
            requiredRoles: requiredRole,
            intendedRoute: window.location.pathname,
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

    if (!requiredRole.includes(userRole)) {
      return null; // 리디렉션 처리 중
    }
  }

  // 모든 검증 통과 - 자식 컴포넌트 렌더링
  return <>{children}</>;
}

/**
 * 역할 확인 유틸리티 훅
 * 컴포넌트 내부에서 사용자 역할을 확인할 때 사용
 */
export function useUserRole() {
  const { user, isLoaded, isSignedIn } = useUser();

  const userRole = isLoaded && isSignedIn ? ((user?.publicMetadata?.role as string) || "") : "";

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

