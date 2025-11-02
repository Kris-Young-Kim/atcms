import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

/**
 * 메인 애플리케이션 레이아웃
 * 사이드바 + 헤더 + 메인 콘텐츠 영역
 */

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* 좌측 사이드바 */}
      <Sidebar />

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <Header />

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto bg-neutral-50">{children}</main>
      </div>
    </div>
  );
}
