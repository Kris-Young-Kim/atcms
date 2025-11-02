"use client";

import { NotificationSettingsPanel } from "@/components/settings/NotificationSettingsPanel";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

/**
 * 알림 설정 페이지
 * Phase 10: SCH-US-03
 */
export default function NotificationSettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <NotificationSettingsPanel />
    </div>
  );
}
