"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";

import { auditLogger } from "@/lib/logger/auditLogger";
import { debounce } from "@/lib/utils/debounce";
import type { Schedule } from "@/lib/validations/schedule";

/**
 * 일정 목록 페이지
 * Phase 10: SCH-US-02
 */

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SchedulesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  const filters = useMemo(() => {
    return {
      schedule_type: searchParams.get("schedule_type") || "all",
      status: searchParams.get("status") || "all",
    };
  }, [searchParams]);

  const updateURL = useCallback(
    (newFilters: typeof filters, newPage: number) => {
      const params = new URLSearchParams();
      if (newFilters.schedule_type !== "all") params.set("schedule_type", newFilters.schedule_type);
      if (newFilters.status !== "all") params.set("status", newFilters.status);
      if (newPage > 1) params.set("page", newPage.toString());

      router.push(`/schedules?${params.toString()}`);
    },
    [router],
  );

  const debouncedFetch = useMemo(
    () =>
      debounce(async (scheduleType: string, status: string, page: number) => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (scheduleType !== "all") params.set("schedule_type", scheduleType);
          if (status !== "all") params.set("status", status);
          params.set("page", page.toString());
          params.set("limit", "25");

          const response = await fetch(`/api/schedules?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setSchedules(data.data || []);
            setPagination(data.pagination || pagination);
          }
        } catch (error) {
          console.error("일정 조회 실패:", error);
          auditLogger.error("schedules_list_fetch_failed", {
            error,
            metadata: { scheduleType, status, page },
          });
        } finally {
          setLoading(false);
        }
      }, 300),
    [pagination],
  );

  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    debouncedFetch(filters.schedule_type, filters.status, page);
  }, [filters.schedule_type, filters.status, searchParams, debouncedFetch]);

  const handleFilterChange = useCallback(
    (newFilters: typeof filters) => {
      updateURL(newFilters, 1);
    },
    [updateURL],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateURL(filters, newPage);
    },
    [updateURL, filters],
  );

  const scheduleTypeMap: Record<string, string> = {
    consultation: "상담",
    assessment: "평가",
    rental: "대여",
    customization: "맞춤제작",
    other: "기타",
  };

  const statusMap: Record<string, { label: string; class: string }> = {
    scheduled: { label: "예정", class: "bg-blue-100 text-blue-700" },
    completed: { label: "완료", class: "bg-green-100 text-green-700" },
    cancelled: { label: "취소", class: "bg-red-100 text-red-700" },
    no_show: { label: "불참", class: "bg-gray-100 text-gray-700" },
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">일정 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            전체 {pagination.total}개의 일정을 조회하고 관리할 수 있습니다.
          </p>
        </div>
        <Link
          href="/schedules/new"
          className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + 새 일정 등록
        </Link>
      </div>

      {/* 필터 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="schedule_type" className="block text-sm font-medium text-gray-700">
              일정 유형
            </label>
            <select
              id="schedule_type"
              value={filters.schedule_type}
              onChange={(e) => handleFilterChange({ ...filters, schedule_type: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="consultation">상담</option>
              <option value="assessment">평가</option>
              <option value="rental">대여</option>
              <option value="customization">맞춤제작</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              상태
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="scheduled">예정</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
              <option value="no_show">불참</option>
            </select>
          </div>
        </div>
      </div>

      {/* 일정 목록 */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">일정이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const statusInfo = statusMap[schedule.status] || {
              label: schedule.status,
              class: "bg-gray-100 text-gray-700",
            };
            const client = (schedule as any).clients;

            return (
              <Link
                key={schedule.id}
                href={`/schedules/${schedule.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{schedule.title}</h3>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.class}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {scheduleTypeMap[schedule.schedule_type] || schedule.schedule_type}
                      {client && ` · ${client.name}`}
                      {schedule.location && ` · ${schedule.location}`}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(schedule.start_time).toLocaleString("ko-KR")} -{" "}
                      {new Date(schedule.end_time).toLocaleString("ko-KR")}
                    </p>
                    {schedule.description && (
                      <p className="mt-2 text-sm text-gray-700 line-clamp-2">{schedule.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

