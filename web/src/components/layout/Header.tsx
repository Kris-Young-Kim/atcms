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
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-neutral-900">
          {/* 현재 페이지 타이틀은 각 페이지에서 설정 */}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* 사용자 정보 */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-neutral-900">
              {user?.firstName || user?.username || "사용자"}
            </p>
            <p className="text-xs font-medium text-neutral-500">{roleNames[userRole] || userRole}</p>
          </div>
          {/* Clerk 사용자 버튼 (프로필, 로그아웃) */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 transition-all hover:border-neutral-300 hover:bg-neutral-100 hover:shadow-sm">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}
