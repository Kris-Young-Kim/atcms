import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import "./globals.css";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AT-CMP | 보조공학 사례관리 플랫폼",
  description:
    "보조공학 전문가 팀을 위한 AT-CMP MVP 환경. Clerk 인증과 Supabase 연동을 갖춘 Next.js 기반 웹앱입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
