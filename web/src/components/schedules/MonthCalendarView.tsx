"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import type { Schedule } from "@/lib/validations/schedule";

/**
 * 일정 유형별 색상 정의
 */
const SCHEDULE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  consultation: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  assessment: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  rental: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  customization: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  other: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-300" },
};

/**
 * 일정 유형 라벨
 */
const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  consultation: "상담",
  assessment: "평가",
  rental: "대여",
  customization: "맞춤제작",
  other: "기타",
};

/**
 * 상태별 색상
 */
const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
  no_show: "bg-gray-500",
};

interface MonthCalendarViewProps {
  schedules: Schedule[];
  onDateClick?: (date: Date) => void;
  onScheduleClick?: (schedule: Schedule) => void;
  onMonthChange?: (date: Date) => void;
}

/**
 * 월별 캘린더 뷰 컴포넌트
 * Phase 10: SCH-US-03
 */
export function MonthCalendarView({
  schedules,
  onDateClick,
  onScheduleClick,
  onMonthChange,
}: MonthCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // 현재 월의 첫 날과 마지막 날 계산
  const { firstDayOfMonth, lastDayOfMonth, daysInMonth, firstDayOfWeek } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeek = firstDay.getDay(); // 0(일요일) ~ 6(토요일)

    return {
      firstDayOfMonth: firstDay,
      lastDayOfMonth: lastDay,
      daysInMonth: lastDay.getDate(),
      firstDayOfWeek: firstDayWeek,
    };
  }, [currentDate]);

  // 날짜별 일정 그룹화
  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, Schedule[]> = {};

    schedules.forEach((schedule) => {
      const scheduleDate = new Date(schedule.start_time);
      const dateKey = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, "0")}-${String(scheduleDate.getDate()).padStart(2, "0")}`;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(schedule);
    });

    return grouped;
  }, [schedules]);

  // 이전 달로 이동
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      if (onMonthChange) {
        onMonthChange(newDate);
      }
      return newDate;
    });
  }, [onMonthChange]);

  // 다음 달로 이동
  const goToNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      if (onMonthChange) {
        onMonthChange(newDate);
      }
      return newDate;
    });
  }, [onMonthChange]);

  // 오늘로 이동
  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    if (onMonthChange) {
      onMonthChange(today);
    }
  }, [onMonthChange]);

  // 날짜 클릭 핸들러
  const handleDateClick = useCallback(
    (date: Date) => {
      if (onDateClick) {
        onDateClick(date);
      }
    },
    [onDateClick],
  );

  // 일정 클릭 핸들러
  const handleScheduleClick = useCallback(
    (schedule: Schedule, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedSchedule(schedule);
      if (onScheduleClick) {
        onScheduleClick(schedule);
      }
    },
    [onScheduleClick],
  );

  // 모달 닫기
  const handleCloseModal = useCallback(() => {
    setSelectedSchedule(null);
  }, []);

  // 키보드 네비게이션 (ESC로 모달 닫기)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedSchedule) {
        handleCloseModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSchedule, handleCloseModal]);

  // 달력 날짜 배열 생성
  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date; isCurrentMonth: boolean; schedules: Schedule[] }> = [];

    // 이전 달의 마지막 날들 (첫 주를 채우기 위해)
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
    const prevMonthDays = prevMonth.getDate();

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        prevMonthDays - i,
      );
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      days.push({
        date,
        isCurrentMonth: false,
        schedules: schedulesByDate[dateKey] || [],
      });
    }

    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({
        date,
        isCurrentMonth: true,
        schedules: schedulesByDate[dateKey] || [],
      });
    }

    // 다음 달의 첫 날들 (마지막 주를 채우기 위해)
    const remainingDays = 42 - days.length; // 6주 * 7일 = 42일
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      days.push({
        date,
        isCurrentMonth: false,
        schedules: schedulesByDate[dateKey] || [],
      });
    }

    return days;
  }, [currentDate, firstDayOfWeek, daysInMonth, schedulesByDate]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <>
      <div className="space-y-4" role="region" aria-label="월별 캘린더">
        {/* 헤더: 월 선택 및 네비게이션 */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-md">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="이전 달"
            >
              ←
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h2>
            <button
              onClick={goToNextMonth}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="다음 달"
            >
              →
            </button>
          </div>
          <button
            onClick={goToToday}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="오늘로 이동"
          >
            오늘
          </button>
        </div>

        {/* 캘린더 그리드 */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-md">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
              <div
                key={day}
                className={`p-3 text-center text-sm font-semibold ${
                  index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-700"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7">
            {calendarDays.map((dayData, index) => {
              const { date, isCurrentMonth, schedules: daySchedules } = dayData;
              const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
              const isDayToday = isToday(date);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border-r border-b border-gray-200 p-2 transition-colors ${
                    !isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"
                  } ${isWeekend && isCurrentMonth ? "bg-blue-50/30" : ""} hover:bg-gray-50 cursor-pointer`}
                  onClick={() => handleDateClick(date)}
                  role="gridcell"
                  aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleDateClick(date);
                    }
                  }}
                >
                  {/* 날짜 번호 */}
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        isDayToday && isCurrentMonth
                          ? "rounded-full bg-blue-600 px-2 py-0.5 text-white"
                          : isCurrentMonth
                            ? "text-gray-900"
                            : "text-gray-400"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {daySchedules.length > 0 && (
                      <span
                        className="text-xs text-gray-500"
                        aria-label={`${daySchedules.length}개의 일정`}
                      >
                        {daySchedules.length}
                      </span>
                    )}
                  </div>

                  {/* 일정 목록 */}
                  <div className="space-y-1">
                    {daySchedules.slice(0, 3).map((schedule) => {
                      const typeColors =
                        SCHEDULE_TYPE_COLORS[schedule.schedule_type] || SCHEDULE_TYPE_COLORS.other;
                      const startTime = new Date(schedule.start_time);
                      const timeStr = `${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`;

                      return (
                        <button
                          key={schedule.id}
                          onClick={(e) => handleScheduleClick(schedule, e)}
                          className={`w-full rounded px-1.5 py-0.5 text-left text-xs ${typeColors.bg} ${typeColors.text} ${typeColors.border} border transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          aria-label={`${SCHEDULE_TYPE_LABELS[schedule.schedule_type] || schedule.schedule_type} 일정: ${schedule.title}, ${timeStr}`}
                        >
                          <div className="flex items-center gap-1">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[schedule.status] || "bg-gray-500"}`}
                            />
                            <span className="truncate font-medium">{schedule.title}</span>
                          </div>
                          <div className="text-xs opacity-75">{timeStr}</div>
                        </button>
                      );
                    })}
                    {daySchedules.length > 3 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // 추가 일정 표시를 위한 처리 (모달 또는 페이지로 이동)
                          const dateStr = date.toISOString().split("T")[0];
                          window.location.href = `/schedules?start_date=${dateStr}&end_date=${dateStr}`;
                        }}
                        className="w-full rounded px-1.5 py-0.5 text-left text-xs text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`추가 ${daySchedules.length - 3}개의 일정 더 보기`}
                      >
                        +{daySchedules.length - 3}개 더
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 범례 */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">일정 유형</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(SCHEDULE_TYPE_LABELS).map(([type, label]) => {
              const colors = SCHEDULE_TYPE_COLORS[type] || SCHEDULE_TYPE_COLORS.other;
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded ${colors.bg} ${colors.border} border`} />
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 일정 상세 모달 */}
      {selectedSchedule && (
        <ScheduleDetailModal schedule={selectedSchedule} onClose={handleCloseModal} />
      )}
    </>
  );
}

/**
 * 일정 상세 정보 모달 컴포넌트
 */
interface ScheduleDetailModalProps {
  schedule: Schedule;
  onClose: () => void;
}

function ScheduleDetailModal({ schedule, onClose }: ScheduleDetailModalProps) {
  const typeColors = SCHEDULE_TYPE_COLORS[schedule.schedule_type] || SCHEDULE_TYPE_COLORS.other;
  const statusMap: Record<string, { label: string; class: string }> = {
    scheduled: { label: "예정", class: "bg-blue-100 text-blue-700" },
    completed: { label: "완료", class: "bg-green-100 text-green-700" },
    cancelled: { label: "취소", class: "bg-red-100 text-red-700" },
    no_show: { label: "불참", class: "bg-gray-100 text-gray-700" },
  };

  const statusInfo = statusMap[schedule.status] || {
    label: schedule.status,
    class: "bg-gray-100 text-gray-700",
  };

  // 키보드 네비게이션 (ESC, Tab 트랩)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const startTime = new Date(schedule.start_time);
  const endTime = new Date(schedule.end_time);

  // description에서 JSON 파싱 시도 (평가 유형 등)
  interface ParsedDescription {
    assessment_type?: "functional" | "environmental" | "needs";
    original_description?: string;
    [key: string]: unknown;
  }

  let parsedDescription: ParsedDescription | null = null;
  try {
    if (schedule.description) {
      parsedDescription = JSON.parse(schedule.description) as ParsedDescription;
    }
  } catch {
    parsedDescription = null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 id="schedule-modal-title" className="text-2xl font-bold text-gray-900">
            일정 상세 정보
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="모달 닫기"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="p-6 space-y-4">
          {/* 제목 및 상태 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{schedule.title}</h3>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.class}`}
                >
                  {statusInfo.label}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${typeColors.bg} ${typeColors.text}`}
                >
                  {SCHEDULE_TYPE_LABELS[schedule.schedule_type] || schedule.schedule_type}
                </span>
              </div>
            </div>
          </div>

          {/* 날짜 및 시간 */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">시작 시간</p>
              <p className="mt-1 text-sm text-gray-900">
                {startTime.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {startTime.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">종료 시간</p>
              <p className="mt-1 text-sm text-gray-900">
                {endTime.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {endTime.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {/* 장소 */}
          {schedule.location && (
            <div>
              <p className="text-sm font-medium text-gray-600">장소</p>
              <p className="mt-1 text-sm text-gray-900">{schedule.location}</p>
            </div>
          )}

          {/* 설명 */}
          {(schedule.description || parsedDescription) && (
            <div>
              <p className="text-sm font-medium text-gray-600">설명</p>
              <p className="mt-1 text-sm text-gray-900">
                {parsedDescription && typeof parsedDescription === "object"
                  ? parsedDescription.original_description || schedule.description
                  : schedule.description}
              </p>
              {parsedDescription && parsedDescription.assessment_type && (
                <p className="mt-2 text-sm text-gray-600">
                  평가 유형:{" "}
                  {parsedDescription.assessment_type === "functional"
                    ? "기능 평가"
                    : parsedDescription.assessment_type === "environmental"
                      ? "환경 평가"
                      : "욕구 평가"}
                </p>
              )}
            </div>
          )}

          {/* 메모 */}
          {schedule.notes && (
            <div>
              <p className="text-sm font-medium text-gray-600">메모</p>
              <p className="mt-1 text-sm text-gray-900">{schedule.notes}</p>
            </div>
          )}

          {/* 알림 설정 */}
          {schedule.reminder_minutes && schedule.reminder_minutes > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600">알림 설정</p>
              <p className="mt-1 text-sm text-gray-900">
                일정 시작 {schedule.reminder_minutes}분 전 알림
              </p>
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6">
          <Link
            href={`/schedules/${schedule.id}`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            상세 페이지로 이동
          </Link>
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
