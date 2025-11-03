import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";

/**
 * 메인 애플리케이션 레이아웃
 * 사이드바(LNB) + 헤더(GNB) + 메인 콘텐츠 영역 + 푸터(FNB)
 */

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* 좌측 사이드바 (LNB) */}
      <Sidebar />

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 상단 글로벌 네비게이션 바 (GNB) */}
        <Header />

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          <div className="min-h-[calc(100vh-4rem)]">{children}</div>
          {/* 하단 푸터 네비게이션 (FNB) */}
          <Footer />
        </main>
      </div>
    </div>
  );
}
