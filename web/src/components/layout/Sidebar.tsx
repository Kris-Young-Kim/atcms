"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserRole } from "@/components/auth/ProtectedRoute";
import {
  LayoutDashboard,
  Users,
  Search,
  FileText,
  Wrench,
  Calendar,
  Bell,
  Building2,
  LucideIcon,
} from "lucide-react";

/**
 * 좌측 사이드바 네비게이션 (LNB)
 */

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  allowedRoles?: string[];
}

const navItems: NavItem[] = [
  {
    name: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["admin", "leader", "specialist", "socialWorker"],
  },
  {
    name: "대상자 관리",
    href: "/clients",
    icon: Users,
    allowedRoles: ["admin", "leader", "specialist", "socialWorker"],
  },
  {
    name: "통합 검색",
    href: "/search/activities",
    icon: Search,
    allowedRoles: ["admin", "leader", "specialist", "technician", "socialWorker"],
  },
  {
    name: "상담 기록",
    href: "/consultations",
    icon: FileText,
    allowedRoles: ["admin", "leader", "specialist", "socialWorker"],
  },
  {
    name: "기기 관리",
    href: "/equipment",
    icon: Wrench,
    allowedRoles: ["admin", "leader", "technician"],
  },
  {
    name: "일정 관리",
    href: "/schedules",
    icon: Calendar,
    allowedRoles: ["admin", "leader", "specialist", "technician", "socialWorker"],
  },
  {
    name: "알림 설정",
    href: "/settings/notifications",
    icon: Bell,
    allowedRoles: ["admin", "leader", "specialist", "technician", "socialWorker"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasRole } = useUserRole();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return hasRole(item.allowedRoles);
  });

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-neutral-200 bg-white shadow-sm">
      {/* 로고 영역 */}
      <div className="flex h-16 items-center border-b border-neutral-200 bg-gradient-to-r from-primary-600 to-indigo-600 px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <div className="rounded-lg bg-white/20 p-1.5 backdrop-blur-sm">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">AT-CMP</span>
        </Link>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md hover:shadow-lg"
                  : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 hover:shadow-sm active:bg-neutral-100"
              }`}
            >
              <IconComponent
                className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                  isActive ? "drop-shadow-sm" : ""
                }`}
              />
              <span>{item.name}</span>
              {isActive && (
                <span className="ml-auto h-2 w-2 rounded-full bg-white shadow-sm"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 하단 정보 */}
      <div className="border-t border-neutral-200 bg-neutral-50 p-4">
        <p className="text-xs font-medium text-neutral-600">AT-CMP v1.0.0</p>
        <p className="mt-1 text-xs text-neutral-500">보조공학 사례관리 플랫폼</p>
      </div>
    </aside>
  );
}
