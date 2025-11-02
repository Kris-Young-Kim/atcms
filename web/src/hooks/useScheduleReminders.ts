"use client";

import { useEffect, useState, useCallback, useRef } from "react";

import {
  extractRemindersFromSchedules,
  scheduleReminders,
  clearReminderTimers,
  type ReminderNotification,
} from "@/lib/notifications/schedule-reminder";
import {
  checkNotificationPermission,
  requestNotificationPermission,
  showNotification,
  loadNotificationSettings,
  type NotificationSettings,
  type NotificationPermission,
} from "@/lib/notifications/browser-notifications";
import type { Schedule } from "@/lib/validations/schedule";

/**
 * 일정 리마인더 알림 훅
 * Phase 10: SCH-US-03
 */
export function useScheduleReminders(schedules: Schedule[]) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [settings, setSettings] = useState<NotificationSettings>(loadNotificationSettings());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 권한 확인
  useEffect(() => {
    const currentPermission = checkNotificationPermission();
    setPermission(currentPermission);

    // 권한이 없고 설정에서 브라우저 알림이 활성화되어 있으면 권한 요청
    if (currentPermission === "default" && settings.browserNotifications && settings.enabled) {
      requestNotificationPermission().then((newPermission) => {
        setPermission(newPermission);
      });
    }
  }, [settings.browserNotifications, settings.enabled]);

  // 알림 핸들러
  const handleNotification = useCallback(
    (notification: ReminderNotification) => {
      if (!settings.enabled) {
        return;
      }

      if (settings.browserNotifications && permission === "granted") {
        showNotification(notification);
      }
    },
    [settings, permission],
  );

  // 일정 리마인더 스케줄링
  useEffect(() => {
    if (!settings.enabled) {
      return;
    }

    // 기존 타이머 정리
    clearReminderTimers(timersRef.current);

    // 리마인더 추출
    const reminders = extractRemindersFromSchedules(schedules);

    // 리마인더 스케줄링
    const timers = scheduleReminders(reminders, handleNotification);
    timersRef.current = timers;

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      clearReminderTimers(timersRef.current);
    };
  }, [schedules, handleNotification, settings.enabled]);

  // 설정 업데이트
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    const updated = loadNotificationSettings();
    const newSettings = { ...updated, ...updates };
    setSettings(newSettings);
    localStorage.setItem("schedule_notification_settings", JSON.stringify(newSettings));
  }, []);

  // 권한 요청
  const requestPermission = useCallback(async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    return newPermission;
  }, []);

  return {
    permission,
    settings,
    updateSettings,
    requestPermission,
  };
}

