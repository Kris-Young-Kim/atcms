/**
 * 브라우저 알림 (Web Notification API) 관리
 * Phase 10: SCH-US-03
 */

import type { ReminderNotification } from "./schedule-reminder";

/**
 * 브라우저 알림 권한 상태
 */
export type NotificationPermission = "default" | "granted" | "denied";

/**
 * 브라우저 알림 권한 확인
 */
export function checkNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  return Notification.permission as NotificationPermission;
}

/**
 * 브라우저 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  const permission = await Notification.requestPermission();
  return permission as NotificationPermission;
}

/**
 * 브라우저 알림 표시
 */
export function showNotification(notification: ReminderNotification): Notification | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("브라우저 알림이 지원되지 않습니다.");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("브라우저 알림 권한이 없습니다.");
    return null;
  }

  const options: NotificationOptions = {
    body: notification.body,
    icon: notification.icon || "/favicon.ico",
    tag: notification.tag,
    timestamp: notification.timestamp,
    badge: "/favicon.ico",
    requireInteraction: false, // 자동으로 사라지도록
    silent: false,
  };

  const browserNotification = new Notification(notification.title, options);

  // 알림 클릭 시 일정 페이지로 이동
  browserNotification.onclick = () => {
    window.focus();
    window.location.href = notification.url;
    browserNotification.close();
  };

  // 알림 자동 닫기 (5초 후)
  setTimeout(() => {
    browserNotification.close();
  }, 5000);

  return browserNotification;
}

/**
 * 알림 설정을 로컬 스토리지에 저장
 */
const NOTIFICATION_SETTINGS_KEY = "schedule_notification_settings";

export interface NotificationSettings {
  enabled: boolean;
  reminderMinutes: number; // 기본 리마인더 시간 (분)
  soundEnabled: boolean;
  browserNotifications: boolean;
}

/**
 * 기본 알림 설정
 */
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  reminderMinutes: 30,
  soundEnabled: false,
  browserNotifications: true,
};

/**
 * 알림 설정 로드
 */
export function loadNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("알림 설정 로드 실패:", error);
  }

  return DEFAULT_SETTINGS;
}

/**
 * 알림 설정 저장
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("알림 설정 저장 실패:", error);
  }
}

/**
 * 알림 설정 업데이트
 */
export function updateNotificationSettings(updates: Partial<NotificationSettings>): NotificationSettings {
  const current = loadNotificationSettings();
  const updated = { ...current, ...updates };
  saveNotificationSettings(updated);
  return updated;
}

