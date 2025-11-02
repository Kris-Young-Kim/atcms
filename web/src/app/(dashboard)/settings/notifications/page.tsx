"use client";

import { NotificationSettingsPanel } from "@/components/settings/NotificationSettingsPanel";

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
