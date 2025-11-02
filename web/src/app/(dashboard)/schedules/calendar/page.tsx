"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { MonthCalendarView } from "@/components/schedules/MonthCalendarView";
import { useScheduleReminders } from "@/hooks/useScheduleReminders";
import { auditLogger } from "@/lib/logger/auditLogger";
import type { Schedule } from "@/lib/validations/schedule";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

/**
 * 캘린더 페이지
 * Phase 10: SCH-US-03
 */
export default function CalendarPage() {
  const searchParams = useSearchParams();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 특정 월의 시작일과 종료일 계산
  const getMonthRange = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    return {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    };
  }, []);

  // 일정 조회
  const fetchSchedules = useCallback(
    async (month: Date) => {
      try {
        setLoading(true);
        const { start_date, end_date } = getMonthRange(month);

        const params = new URLSearchParams();
        params.set("start_date", start_date);
        params.set("end_date", end_date);
        params.set("limit", "1000"); // 한 달치 일정 모두 가져오기

        // URL 파라미터에서 필터 적용
        const scheduleType = searchParams.get("schedule_type");
        if (scheduleType && scheduleType !== "all") {
          params.set("schedule_type", scheduleType);
        }

        const response = await fetch(`/api/schedules?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setSchedules(data.data || []);
        } else {
          console.error("일정 조회 실패");
          auditLogger.error("calendar_schedules_fetch_failed", {
            metadata: { start_date, end_date },
          });
        }
      } catch (error) {
        console.error("일정 조회 중 오류:", error);
        auditLogger.error("calendar_schedules_fetch_exception", {
          error,
        });
      } finally {
        setLoading(false);
      }
    },
    [getMonthRange, searchParams],
  );

  useEffect(() => {
    fetchSchedules(currentMonth);
  }, [currentMonth, fetchSchedules]);

  const handleScheduleClick = useCallback((schedule: Schedule) => {
    auditLogger.info("calendar_schedule_clicked", {
      metadata: {
        scheduleId: schedule.id,
        scheduleType: schedule.schedule_type,
        title: schedule.title,
      },
    });
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    auditLogger.info("calendar_date_clicked", {
      metadata: {
        date: dateStr,
      },
    });
  }, []);

  const handleMonthChange = useCallback((newMonth: Date) => {
    setCurrentMonth(newMonth);
  }, []);

  // 일정 리마인더 알림 활성화
  useScheduleReminders(schedules);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">일정 캘린더</h1>
          <p className="mt-2 text-sm text-gray-600">
            월별 캘린더 뷰에서 일정을 확인하고 관리할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/schedules"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            목록 보기
          </Link>
          <Link
            href="/schedules/new"
            className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + 새 일정 등록
          </Link>
        </div>
      </div>

      {/* 필터 (선택사항) */}
      {searchParams.get("schedule_type") && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">필터:</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              {searchParams.get("schedule_type") === "consultation"
                ? "상담"
                : searchParams.get("schedule_type") === "assessment"
                  ? "평가"
                  : searchParams.get("schedule_type") === "rental"
                    ? "대여"
                    : searchParams.get("schedule_type") === "customization"
                      ? "맞춤제작"
                      : "기타"}
            </span>
            <Link
              href="/schedules/calendar"
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              필터 제거
            </Link>
          </div>
        </div>
      )}

      {/* 캘린더 뷰 */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-md">
          <p className="text-gray-600">일정을 불러오는 중...</p>
        </div>
      ) : (
        <MonthCalendarView
          schedules={schedules}
          onScheduleClick={handleScheduleClick}
          onDateClick={handleDateClick}
          onMonthChange={handleMonthChange}
        />
      )}
    </div>
  );
}
