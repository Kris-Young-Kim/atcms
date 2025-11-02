"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { debounce } from "@/lib/utils/debounce";

/**
 * 통합 활동 검색 결과 타입
 * Phase 10: 통합 대상자 관리
 */
interface ActivitySearchResult {
  id: string;
  type: string;
  title: string;
  date: string;
  client_id: string;
  client_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ActivitySearchResponse {
  data: ActivitySearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  grouped: Record<string, number>;
}

/**
 * 통합 검색 바 컴포넌트
 * Phase 10: 통합 대상자 관리
 */
interface IntegratedSearchBarProps {
  onSearch: (
    query: string,
    filters: {
      activity_type: string;
      start_date?: string;
      end_date?: string;
    },
  ) => void;
  initialQuery?: string;
  initialActivityType?: string;
}

export function IntegratedSearchBar({
  onSearch,
  initialQuery = "",
  initialActivityType = "all",
}: IntegratedSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activityType, setActivityType] = useState(initialActivityType);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 디바운스된 검색 함수
  const debouncedSearch = useMemo(
    () =>
      debounce(
        (
          searchQuery: string,
          filters: {
            activity_type: string;
            start_date?: string;
            end_date?: string;
          },
        ) => {
          onSearch(searchQuery, filters);
        },
        300,
      ),
    [onSearch],
  );

  // 검색어 변경 시 디바운스 적용
  useEffect(() => {
    debouncedSearch(query, {
      activity_type: activityType,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
  }, [query, activityType, startDate, endDate, debouncedSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, {
      activity_type: activityType,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
  };

  const handleReset = () => {
    setQuery("");
    setActivityType("all");
    setStartDate("");
    setEndDate("");
    onSearch("", {
      activity_type: "all",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-md"
      role="search"
      aria-label="통합 활동 검색"
    >
      <div className="space-y-4">
        {/* 검색어 입력 */}
        <div>
          <label htmlFor="search-query" className="block text-sm font-medium text-gray-700">
            검색어
          </label>
          <input
            type="text"
            id="search-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="대상자 이름 또는 활동 제목으로 검색..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="통합 검색 입력"
          />
        </div>

        {/* 필터 그룹 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* 활동 유형 필터 */}
          <div>
            <label htmlFor="activity-type" className="block text-sm font-medium text-gray-700">
              활동 유형
            </label>
            <select
              id="activity-type"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="consultation">상담</option>
              <option value="assessment">평가</option>
              <option value="rental">대여</option>
              <option value="customization">맞춤제작</option>
              <option value="schedule">일정</option>
            </select>
          </div>

          {/* 시작 날짜 */}
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
              시작 날짜
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* 종료 날짜 */}
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
              종료 날짜
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg"
          >
            검색
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            초기화
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * 통합 검색 결과 페이지 컴포넌트
 * Phase 10: 통합 대상자 관리
 */
export default function IntegratedSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<ActivitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [grouped, setGrouped] = useState<Record<string, number>>({});

  const query = searchParams.get("query") || "";
  const activityType = searchParams.get("activity_type") || "all";
  const startDate = searchParams.get("start_date") || undefined;
  const endDate = searchParams.get("end_date") || undefined;

  const performSearch = useCallback(
    async (
      searchQuery: string,
      filters: {
        activity_type: string;
        start_date?: string;
        end_date?: string;
      },
      page: number = 1,
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("query", searchQuery);
        if (filters.activity_type !== "all") params.set("activity_type", filters.activity_type);
        if (filters.start_date) params.set("start_date", filters.start_date);
        if (filters.end_date) params.set("end_date", filters.end_date);
        params.set("page", page.toString());
        params.set("limit", "25");

        const response = await fetch(`/api/search/activities?${params.toString()}`);
        if (response.ok) {
          const data: ActivitySearchResponse = await response.json();
          setResults(data.data || []);
          setPagination(data.pagination);
          setGrouped(data.grouped || {});
        }
      } catch (error) {
        console.error("검색 실패:", error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (query || activityType !== "all" || startDate || endDate) {
      performSearch(
        query,
        {
          activity_type: activityType,
          start_date: startDate,
          end_date: endDate,
        },
        parseInt(searchParams.get("page") || "1", 10),
      );
    }
  }, [query, activityType, startDate, endDate, searchParams, performSearch]);

  const handleSearch = useCallback(
    (
      searchQuery: string,
      filters: {
        activity_type: string;
        start_date?: string;
        end_date?: string;
      },
    ) => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (filters.activity_type !== "all") params.set("activity_type", filters.activity_type);
      if (filters.start_date) params.set("start_date", filters.start_date);
      if (filters.end_date) params.set("end_date", filters.end_date);
      params.set("page", "1");

      router.push(`/search/activities?${params.toString()}`);
    },
    [router],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      router.push(`/search/activities?${params.toString()}`);
    },
    [router, searchParams],
  );

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

  const getActivityColor = (type: string) => {
    if (type === "consultation") return "bg-blue-100 text-blue-700";
    if (type === "assessment") return "bg-purple-100 text-purple-700";
    if (type === "rental") return "bg-green-100 text-green-700";
    if (type === "customization") return "bg-orange-100 text-orange-700";
    if (type.startsWith("schedule_")) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  const getActivityLink = (activity: ActivitySearchResult) => {
    if (activity.type === "consultation") {
      return `/clients/${activity.client_id}?tab=consultations`;
    }
    if (activity.type === "assessment") {
      return `/clients/${activity.client_id}?tab=assessments`;
    }
    if (activity.type === "rental") {
      return `/rentals/${activity.id}`;
    }
    if (activity.type === "customization") {
      return `/customization-requests/${activity.id}`;
    }
    if (activity.type.startsWith("schedule_")) {
      return `/schedules/${activity.id}`;
    }
    return `/clients/${activity.client_id}`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">통합 활동 검색</h1>
        <p className="mt-2 text-sm text-gray-600">
          대상자 이름, 활동 제목, 날짜 범위 등으로 모든 활동을 검색할 수 있습니다.
        </p>
      </div>

      {/* 검색 바 */}
      <IntegratedSearchBar
        onSearch={handleSearch}
        initialQuery={query}
        initialActivityType={activityType}
      />

      {/* 검색 결과 통계 */}
      {pagination.total > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              총 <span className="font-bold text-gray-900">{pagination.total}</span>개의 결과
            </p>
            <div className="flex gap-4">
              {Object.entries(grouped).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-lg">
                    {getActivityIcon(type === "schedule" ? "schedule_" : type)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {getActivityLabel(type === "schedule" ? "schedule_" : type)}: {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 검색 결과 */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">검색 중...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">
            {query || activityType !== "all" || startDate || endDate
              ? "검색 결과가 없습니다."
              : "검색어를 입력하거나 필터를 선택하여 검색하세요."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((activity) => (
            <Link
              key={`${activity.type}-${activity.id}`}
              href={getActivityLink(activity)}
              className="block rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-all hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-full p-3 ${getActivityColor(activity.type)}`}>
                  <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getActivityColor(activity.type)}`}
                    >
                      {getActivityLabel(activity.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      대상자:{" "}
                      <Link
                        href={`/clients/${activity.client_id}`}
                        className="font-medium text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {activity.client_name}
                      </Link>
                    </span>
                    <span>•</span>
                    <span>{new Date(activity.date).toLocaleDateString("ko-KR")}</span>
                  </div>
                  {typeof activity.metadata?.description === "string" &&
                    activity.metadata.description && (
                      <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                        {activity.metadata.description}
                      </p>
                    )}
                </div>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
          ))}
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
