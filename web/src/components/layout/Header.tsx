"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useUserRole } from "@/components/auth/ProtectedRoute";
import { Bell, HelpCircle } from "lucide-react";

/**
 * 상단 글로벌 네비게이션 바 (GNB)
 * 사용자 정보, 알림, 설정 등
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
  const pathname = usePathname();

  // 경로에 따른 페이지 타이틀 매핑
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      "/dashboard": "대시보드",
      "/clients": "대상자 관리",
      "/equipment": "기기 관리",
      "/schedules": "일정 관리",
      "/schedules/calendar": "일정 달력",
      "/search/activities": "통합 검색",
      "/consultations": "상담 기록",
      "/settings/notifications": "알림 설정",
    };

    // 정확한 경로 매칭 또는 하위 경로 매칭
    for (const [path, title] of Object.entries(titles)) {
      if (pathname === path || pathname.startsWith(path + "/")) {
        return title;
      }
    }

    // 동적 경로 처리
    if (pathname.includes("/clients/") && pathname.includes("/edit")) return "대상자 수정";
    if (pathname.includes("/clients/") && pathname.includes("/new")) return "대상자 등록";
    if (pathname.includes("/clients/") && pathname.includes("/assessments")) return "평가 관리";
    if (pathname.includes("/clients/") && pathname.includes("/consultations")) return "상담 관리";
    if (pathname.includes("/equipment/") && pathname.includes("/edit")) return "기기 수정";
    if (pathname.includes("/equipment/") && pathname.includes("/new")) return "기기 등록";
    if (pathname.includes("/equipment/") && pathname.includes("/quantity")) return "수량 조정";
    if (pathname.includes("/rentals/") && pathname.includes("/return")) return "대여 반납";
    if (pathname.includes("/schedules/") && pathname.includes("/edit")) return "일정 수정";
    if (pathname.includes("/schedules/") && pathname.includes("/new")) return "일정 등록";

    return "";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-neutral-900">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* 빠른 액션 버튼 */}
        <button
          className="rounded-lg border border-neutral-200 bg-neutral-50 p-2 transition-all hover:border-neutral-300 hover:bg-neutral-100 hover:shadow-sm"
          aria-label="도움말"
        >
          <HelpCircle className="h-5 w-5 text-neutral-600" />
        </button>

        <a
          href="/settings/notifications"
          className="relative rounded-lg border border-neutral-200 bg-neutral-50 p-2 transition-all hover:border-neutral-300 hover:bg-neutral-100 hover:shadow-sm"
          aria-label="알림 설정"
        >
          <Bell className="h-5 w-5 text-neutral-600" />
          {/* 알림 뱃지는 필요시 추가 */}
        </a>

        {/* 사용자 정보 */}
        <div className="flex items-center gap-3 border-l border-neutral-200 pl-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-neutral-900">
              {user?.firstName || user?.username || "사용자"}
            </p>
            <p className="text-xs font-medium text-neutral-500">
              {roleNames[userRole] || userRole}
            </p>
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
