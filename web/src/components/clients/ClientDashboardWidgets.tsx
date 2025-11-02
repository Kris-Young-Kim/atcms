"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * 대상자 통합 통계 데이터 타입
 * Phase 10: 통합 대상자 관리
 */
interface ClientStats {
  consultation_count: number;
  assessment_count: number;
  active_rentals_count: number;
  active_customizations_count: number;
  upcoming_schedules: Array<{
    id: string;
    title: string;
    start_time: string;
    schedule_type: string;
    status: string;
  }>;
  next_schedule: {
    id: string;
    title: string;
    start_time: string;
    schedule_type: string;
  } | null;
}

interface ClientStatsResponse {
  client_id: string;
  client_name: string;
  stats: ClientStats;
}

interface ClientStatsWidgetProps {
  clientId: string;
}

/**
 * 대상자 통합 통계 위젯 컴포넌트
 * Phase 10: 통합 대상자 관리
 */
export function ClientStatsWidget({ clientId }: ClientStatsWidgetProps) {
  const [stats, setStats] = useState<ClientStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [clientId]);

  async function fetchStats() {
    try {
      const response = await fetch(`/api/clients/${clientId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("통계 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="h-20 animate-pulse bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 상담 횟수 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">상담 횟수</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.stats.consultation_count}</p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <span className="text-2xl">💬</span>
          </div>
        </div>
        <Link
          href={`/clients/${clientId}?tab=consultations`}
          className="mt-4 block text-sm text-blue-600 hover:underline"
        >
          상담 기록 보기 →
        </Link>
      </div>

      {/* 평가 횟수 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">평가 횟수</p>
            <p className="mt-2 text-3xl font-bold text-purple-600">{stats.stats.assessment_count}</p>
          </div>
          <div className="rounded-full bg-purple-100 p-3">
            <span className="text-2xl">📋</span>
          </div>
        </div>
        <Link
          href={`/clients/${clientId}?tab=assessments`}
          className="mt-4 block text-sm text-purple-600 hover:underline"
        >
          평가 기록 보기 →
        </Link>
      </div>

      {/* 진행 중인 대여 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">진행 중인 대여</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.stats.active_rentals_count}</p>
          </div>
          <div className="rounded-full bg-green-100 p-3">
            <span className="text-2xl">📦</span>
          </div>
        </div>
        <Link
          href={`/rentals?client_id=${clientId}&status=active`}
          className="mt-4 block text-sm text-green-600 hover:underline"
        >
          대여 기록 보기 →
        </Link>
      </div>

      {/* 진행 중인 맞춤제작 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">진행 중인 맞춤제작</p>
            <p className="mt-2 text-3xl font-bold text-orange-600">{stats.stats.active_customizations_count}</p>
          </div>
          <div className="rounded-full bg-orange-100 p-3">
            <span className="text-2xl">🔧</span>
          </div>
        </div>
        <Link
          href={`/customization-requests?client_id=${clientId}&status!=completed&status!=cancelled`}
          className="mt-4 block text-sm text-orange-600 hover:underline"
        >
          맞춤제작 보기 →
        </Link>
      </div>
    </div>
  );
}

/**
 * 진행 중인 작업 목록 위젯
 */
interface ActiveTasksWidgetProps {
  clientId: string;
  stats: ClientStats;
}

export function ActiveTasksWidget({ clientId, stats }: ActiveTasksWidgetProps) {
  const activeTasks: Array<{ type: string; label: string; count: number; href: string; color: string }> = [];

  if (stats.active_rentals_count > 0) {
    activeTasks.push({
      type: "rental",
      label: "대여",
      count: stats.active_rentals_count,
      href: `/rentals?client_id=${clientId}&status=active`,
      color: "green",
    });
  }

  if (stats.active_customizations_count > 0) {
    activeTasks.push({
      type: "customization",
      label: "맞춤제작",
      count: stats.active_customizations_count,
      href: `/customization-requests?client_id=${clientId}&status!=completed&status!=cancelled`,
      color: "orange",
    });
  }

  if (activeTasks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">진행 중인 작업</h3>
        <p className="text-sm text-gray-500">진행 중인 작업이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">진행 중인 작업</h3>
      <div className="space-y-3">
        {activeTasks.map((task) => (
          <Link
            key={task.type}
            href={task.href}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {task.type === "rental" ? "📦" : "🔧"}
              </span>
              <span className="font-medium text-gray-900">{task.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                task.color === "green" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              }`}>
                {task.count}개
              </span>
              <span className="text-gray-400">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * 다음 예정 일정 위젯
 */
interface NextScheduleWidgetProps {
  clientId: string;
  nextSchedule: ClientStats["next_schedule"];
  upcomingSchedules: ClientStats["upcoming_schedules"];
}

export function NextScheduleWidget({ clientId, nextSchedule, upcomingSchedules }: NextScheduleWidgetProps) {
  const scheduleTypeMap: Record<string, string> = {
    consultation: "상담",
    assessment: "평가",
    rental: "대여",
    customization: "맞춤제작",
    other: "기타",
  };

  if (!nextSchedule && (!upcomingSchedules || upcomingSchedules.length === 0)) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">다음 예정 일정</h3>
        <p className="text-sm text-gray-500">예정된 일정이 없습니다.</p>
        <Link
          href={`/schedules/new?client_id=${clientId}`}
          className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          새 일정 등록
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">다음 예정 일정</h3>
        <Link
          href={`/schedules?client_id=${clientId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          전체 보기 →
        </Link>
      </div>

      {nextSchedule && (
        <div className="mb-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">📅</span>
                <span className="font-semibold text-gray-900">{nextSchedule.title}</span>
              </div>
              <p className="text-sm text-gray-600">
                {scheduleTypeMap[nextSchedule.schedule_type] || nextSchedule.schedule_type}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {new Date(nextSchedule.start_time).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <Link
              href={`/schedules/${nextSchedule.id}`}
              className="ml-4 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              상세 보기
            </Link>
          </div>
        </div>
      )}

      {upcomingSchedules && upcomingSchedules.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">다른 예정 일정:</p>
          {upcomingSchedules.slice(1, 4).map((schedule) => (
            <Link
              key={schedule.id}
              href={`/schedules/${schedule.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
            >
              <div>
                <p className="font-medium text-gray-900">{schedule.title}</p>
                <p className="text-sm text-gray-600">
                  {new Date(schedule.start_time).toLocaleString("ko-KR", {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          ))}
        </div>
      )}

      <Link
        href={`/schedules/new?client_id=${clientId}`}
        className="mt-4 block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        + 새 일정 등록
      </Link>
    </div>
  );
}

/**
 * 최근 활동 목록 위젯
 */
interface RecentActivitiesWidgetProps {
  clientId: string;
}

export function RecentActivitiesWidget({ clientId }: RecentActivitiesWidgetProps) {
  const [activities, setActivities] = useState<Array<{
    id: string;
    type: string;
    title: string;
    date: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();
  }, [clientId]);

  async function fetchRecentActivities() {
    try {
      const response = await fetch(`/api/clients/${clientId}/activities?limit=5`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.data || []);
      }
    } catch (error) {
      console.error("최근 활동 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }

  const getActivityIcon = (type: string) => {
    if (type === "consultation") return "💬";
    if (type === "assessment") return "📋";
    if (type === "rental") return "📦";
    if (type === "customization") return "🔧";
    if (type.startsWith("schedule_")) return "📅";
    return "📝";
  };

  const getActivityLabel = (type: string) => {
    if (type === "consultation") return "상담";
    if (type === "assessment") return "평가";
    if (type === "rental") return "대여";
    if (type === "customization") return "맞춤제작";
    if (type.startsWith("schedule_")) return "일정";
    return type;
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">최근 활동</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">최근 활동</h3>
        <p className="text-sm text-gray-500">최근 활동이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
        <Link
          href={`/clients/${clientId}?tab=activities`}
          className="text-sm text-blue-600 hover:underline"
        >
          전체 보기 →
        </Link>
      </div>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
          >
            <span className="text-xl">{getActivityIcon(activity.type)}</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{activity.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-gray-500">{getActivityLabel(activity.type)}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {new Date(activity.date).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 빠른 액션 버튼 그룹
 */
interface QuickActionsWidgetProps {
  clientId: string;
}

export function QuickActionsWidget({ clientId }: QuickActionsWidgetProps) {
  const quickActions = [
    {
      label: "상담 기록 작성",
      href: `/clients/${clientId}/consultations/new`,
      icon: "💬",
      color: "blue",
    },
    {
      label: "평가 기록 작성",
      href: `/clients/${clientId}/assessments/new`,
      icon: "📋",
      color: "purple",
    },
    {
      label: "대여 신청",
      href: `/rentals/new?client_id=${clientId}`,
      icon: "📦",
      color: "green",
    },
    {
      label: "맞춤제작 요청",
      href: `/customization-requests/new?client_id=${clientId}`,
      icon: "🔧",
      color: "orange",
    },
    {
      label: "일정 등록",
      href: `/schedules/new?client_id=${clientId}`,
      icon: "📅",
      color: "yellow",
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
    purple: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
    green: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
    orange: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">빠른 액션</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center gap-3 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${colorClasses[action.color]}`}
          >
            <span className="text-xl">{action.icon}</span>
            <span>{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

