"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserRole } from "@/components/auth/ProtectedRoute";

/**
 * 좌측 사이드바 네비게이션
 */

interface NavItem {
  name: string;
  href: string;
  icon: string;
  allowedRoles?: string[];
}

const navItems: NavItem[] = [
  {
    name: "대시보드",
    href: "/dashboard",
    icon: "📊",
    allowedRoles: ["admin", "leader", "specialist", "socialWorker"],
  },
  {
    name: "대상자 관리",
    href: "/clients",
    icon: "👥",
    allowedRoles: ["admin", "leader", "specialist", "socialWorker"],
  },
  {
    name: "상담 기록",
    href: "/consultations",
    icon: "📝",
    allowedRoles: ["admin", "leader", "specialist", "socialWorker"],
  },
  {
    name: "기기 관리",
    href: "/equipment",
    icon: "🔧",
    allowedRoles: ["admin", "leader", "technician"],
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
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* 로고 영역 */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <span className="text-xl font-bold text-gray-900">AT-Care</span>
        </Link>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* 하단 정보 */}
      <div className="border-t border-gray-200 p-4">
        <p className="text-xs text-gray-500">AT-Care v1.0.0</p>
        <p className="text-xs text-gray-400">보조공학 사례관리 시스템</p>
      </div>
    </aside>
  );
}

