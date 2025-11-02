/**
 * 일정 리마인더 알림 로직
 * Phase 10: SCH-US-03
 */

import type { Schedule } from "@/lib/validations/schedule";

/**
 * 일정 리마인더 알림 인터페이스
 */
export interface ScheduleReminder {
  scheduleId: string;
  scheduleTitle: string;
  scheduleType: string;
  startTime: Date;
  reminderTime: Date;
  location?: string;
  participantIds: string[];
  reminderMinutes: number;
}

/**
 * 일정에서 리마인더 정보 추출
 */
export function extractReminders(schedule: Schedule): ScheduleReminder | null {
  // reminder_minutes가 0이거나 없으면 알림 없음
  if (!schedule.reminder_minutes || schedule.reminder_minutes === 0) {
    return null;
  }

  // 상태가 'scheduled'가 아니면 알림 불필요
  if (schedule.status !== "scheduled") {
    return null;
  }

  const startTime = new Date(schedule.start_time);
  const reminderTime = new Date(startTime.getTime() - schedule.reminder_minutes * 60 * 1000);

  // 이미 지난 일정은 알림 불필요
  if (reminderTime < new Date()) {
    return null;
  }

  return {
    scheduleId: schedule.id,
    scheduleTitle: schedule.title,
    scheduleType: schedule.schedule_type,
    startTime,
    reminderTime,
    location: schedule.location || undefined,
    participantIds: (schedule.participant_ids || []) as string[],
    reminderMinutes: schedule.reminder_minutes,
  };
}

/**
 * 여러 일정에서 리마인더 추출
 */
export function extractRemindersFromSchedules(schedules: Schedule[]): ScheduleReminder[] {
  return schedules
    .map((schedule) => extractReminders(schedule))
    .filter((reminder): reminder is ScheduleReminder => reminder !== null);
}

/**
 * 리마인더 알림 메시지 생성
 */
export function createReminderMessage(reminder: ScheduleReminder): string {
  const scheduleTypeLabels: Record<string, string> = {
    consultation: "상담",
    assessment: "평가",
    rental: "대여",
    customization: "맞춤제작",
    other: "기타",
  };

  const typeLabel = scheduleTypeLabels[reminder.scheduleType] || reminder.scheduleType;
  const timeStr = reminder.startTime.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const locationStr = reminder.location ? ` (${reminder.location})` : "";

  return `${reminder.scheduleTitle} - ${typeLabel} 일정이 ${timeStr}에 시작됩니다.${locationStr}`;
}

/**
 * 리마인더 알림 URL 생성 (일정 상세 페이지)
 */
export function createReminderUrl(reminder: ScheduleReminder): string {
  return `/schedules/${reminder.scheduleId}`;
}

/**
 * 리마인더 알림 데이터 타입
 */
export interface ReminderNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  url: string;
  tag: string; // 같은 일정의 중복 알림 방지
  timestamp: number;
}

/**
 * 리마인더를 알림 데이터로 변환
 */
export function createReminderNotification(reminder: ScheduleReminder): ReminderNotification {
  return {
    id: `reminder-${reminder.scheduleId}`,
    title: "일정 리마인더",
    body: createReminderMessage(reminder),
    icon: "/favicon.ico",
    url: createReminderUrl(reminder),
    tag: `schedule-${reminder.scheduleId}`,
    timestamp: reminder.reminderTime.getTime(),
  };
}

/**
 * 알림 시간 계산 (ms 단위)
 */
export function calculateReminderDelay(reminder: ScheduleReminder): number {
  const now = new Date();
  const delay = reminder.reminderTime.getTime() - now.getTime();
  return Math.max(0, delay); // 음수면 0 반환
}

/**
 * 일정 리마인더 체크 및 스케줄링
 */
export function scheduleReminders(reminders: ScheduleReminder[], onNotify: (notification: ReminderNotification) => void): Map<string, NodeJS.Timeout> {
  const timers = new Map<string, NodeJS.Timeout>();

  reminders.forEach((reminder) => {
    const delay = calculateReminderDelay(reminder);
    const notification = createReminderNotification(reminder);

    if (delay > 0) {
      const timerId = setTimeout(() => {
        onNotify(notification);
        timers.delete(reminder.scheduleId);
      }, delay);

      timers.set(reminder.scheduleId, timerId);
    } else {
      // 이미 지난 알림은 즉시 실행
      onNotify(notification);
    }
  });

  return timers;
}

/**
 * 모든 타이머 정리
 */
export function clearReminderTimers(timers: Map<string, NodeJS.Timeout>): void {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
}

