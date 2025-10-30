import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

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

