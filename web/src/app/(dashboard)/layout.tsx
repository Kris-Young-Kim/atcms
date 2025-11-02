import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

/**
 * 대시보드 레이아웃
 * /dashboard, /clients 등 모든 보호된 페이지에 적용
 */

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute requiredRole={["admin", "leader", "specialist", "socialWorker", "technician"]}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}
