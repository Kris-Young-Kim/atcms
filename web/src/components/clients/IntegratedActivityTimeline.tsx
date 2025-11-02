"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * 통합 활동 타임라인 컴포넌트
 * Phase 10: 통합 대상자 관리
 */

interface Activity {
  id: string;
  type: string;
  title: string;
  date: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface IntegratedActivityTimelineProps {
  clientId: string;
}

export function IntegratedActivityTimeline({ clientId }: IntegratedActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchActivities();
  }, [clientId, filterType]);

  async function fetchActivities() {
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") {
        params.set("activity_type", filterType);
      }

      const response = await fetch(`/api/clients/${clientId}/activities?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.data || []);
      }
    } catch (error) {
      console.error("활동 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }

  const getActivityIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      consultation: "💬",
      assessment: "📋",
      rental: "📦",
      customization: "🔧",
      schedule_consultation: "📅",
      schedule_assessment: "📅",
      schedule_rental: "📅",
      schedule_customization: "📅",
      schedule_other: "📅",
    };
    return iconMap[type] || "📝";
  };

  const getActivityColor = (type: string) => {
    const colorMap: Record<string, string> = {
      consultation: "bg-blue-100 text-blue-700 border-blue-300",
      assessment: "bg-purple-100 text-purple-700 border-purple-300",
      rental: "bg-green-100 text-green-700 border-green-300",
      customization: "bg-orange-100 text-orange-700 border-orange-300",
      schedule_consultation: "bg-yellow-100 text-yellow-700 border-yellow-300",
      schedule_assessment: "bg-yellow-100 text-yellow-700 border-yellow-300",
      schedule_rental: "bg-yellow-100 text-yellow-700 border-yellow-300",
      schedule_customization: "bg-yellow-100 text-yellow-700 border-yellow-300",
      schedule_other: "bg-yellow-100 text-yellow-700 border-yellow-300",
    };
    return colorMap[type] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getActivityTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      consultation: "상담",
      assessment: "평가",
      rental: "대여",
      customization: "맞춤제작",
      schedule_consultation: "상담 일정",
      schedule_assessment: "평가 일정",
      schedule_rental: "대여 일정",
      schedule_customization: "맞춤제작 일정",
      schedule_other: "일정",
    };
    return labelMap[type] || type;
  };

  const getActivityLink = (activity: Activity) => {
    if (activity.type === "consultation") {
      return `/clients/${clientId}/consultations/${activity.id}`;
    } else if (activity.type === "assessment") {
      return `/clients/${clientId}/assessments/${activity.id}`;
    } else if (activity.type === "rental") {
      return `/rentals/${activity.id}`;
    } else if (activity.type === "customization") {
      return `/customization-requests/${activity.id}`;
    } else if (activity.type.startsWith("schedule_")) {
      return `/schedules/${activity.id}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            filterType === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilterType("consultation")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            filterType === "consultation"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          💬 상담
        </button>
        <button
          onClick={() => setFilterType("assessment")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            filterType === "assessment"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          📋 평가
        </button>
        <button
          onClick={() => setFilterType("rental")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            filterType === "rental"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          📦 대여
        </button>
        <button
          onClick={() => setFilterType("customization")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            filterType === "customization"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🔧 맞춤제작
        </button>
        <button
          onClick={() => setFilterType("schedule")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            filterType === "schedule"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          📅 일정
        </button>
      </div>

      {/* 타임라인 */}
      {activities.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">활동 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const link = getActivityLink(activity);
            const content = (
              <div
                className={`rounded-lg border-2 p-4 transition-all hover:shadow-md ${getActivityColor(activity.type)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{activity.title}</h3>
                        <p className="mt-1 text-xs opacity-75">
                          {getActivityTypeLabel(activity.type)} ·{" "}
                          {new Date(activity.date).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                    </div>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 text-sm opacity-90">
                        {activity.metadata.status && (
                          <span className="inline-block rounded px-2 py-1 text-xs">
                            상태: {String(activity.metadata.status)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );

            return link ? (
              <Link key={activity.id} href={link}>
                {content}
              </Link>
            ) : (
              <div key={activity.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

