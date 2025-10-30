"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useUserRole } from "@/components/auth/ProtectedRoute";

/**
 * 상단 헤더 (사용자 정보 및 로그아웃)
 */

const roleNames: Record<string, string> = {
  admin: "관리자",
  leader: "팀장",
  specialist: "전문가",
  socialWorker: "사회복지사",
  technician: "기술자",
};

export function Header() {
  const { user } = useUser();
  const { userRole } = useUserRole();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">
          {/* 현재 페이지 타이틀은 각 페이지에서 설정 */}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* 사용자 정보 */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName || user?.username || "사용자"}
            </p>
            <p className="text-xs text-gray-500">{roleNames[userRole] || userRole}</p>
          </div>
          {/* Clerk 사용자 버튼 (프로필, 로그아웃) */}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}

