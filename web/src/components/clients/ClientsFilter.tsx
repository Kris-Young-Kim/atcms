"use client";

import { useState, FormEvent, useEffect, useRef } from "react";

export interface ClientListFilters {
  search: string;
  status: string;
  activityTypes: string[];
  minActivityCount: string;
  maxActivityCount: string;
  activitySince: string;
}

/**
 * 대상자 검색 및 필터 컴포넌트
 * Sprint 1: CMS-US-03
 *
 * 기능:
 * - 검색 입력 (300ms 디바운스)
 * - 상태 필터
 * - URL 쿼리 파라미터 동기화
 * - 접근성 준수 (ARIA 라벨, 키보드 네비게이션)
 */

interface ClientsFilterProps {
  initialFilters: ClientListFilters;
  onFilterChange: (
    filters: ClientListFilters,
    options: { type: "search" | "apply" | "reset" },
  ) => void;
}

export function ClientsFilter({ initialFilters, onFilterChange }: ClientsFilterProps) {
  const [search, setSearch] = useState(initialFilters.search);
  const [status, setStatus] = useState(initialFilters.status);
  const [activityTypes, setActivityTypes] = useState<string[]>(initialFilters.activityTypes);
  const [minActivityCount, setMinActivityCount] = useState(initialFilters.minActivityCount);
  const [maxActivityCount, setMaxActivityCount] = useState(initialFilters.maxActivityCount);
  const [activitySince, setActivitySince] = useState(initialFilters.activitySince);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 초기값이 변경되면 상태 업데이트 (URL에서 읽어온 경우)
  useEffect(() => {
    setSearch(initialFilters.search);
    setStatus(initialFilters.status);
    setActivityTypes(initialFilters.activityTypes);
    setMinActivityCount(initialFilters.minActivityCount);
    setMaxActivityCount(initialFilters.maxActivityCount);
    setActivitySince(initialFilters.activitySince);
  }, [initialFilters]);

  const buildFilters = (overrides?: Partial<ClientListFilters>): ClientListFilters => ({
    search,
    status,
    activityTypes,
    minActivityCount,
    maxActivityCount,
    activitySince,
    ...overrides,
  });

  // 상태 필터 변경 시 즉시 적용
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    onFilterChange(buildFilters({ status: newStatus }), { type: "apply" });
  };

  // 검색 입력 변경 시 즉시 상태 업데이트 (디바운스는 부모에서 처리)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    // 디바운스는 부모 컴포넌트에서 처리
    onFilterChange(buildFilters({ search: newSearch }), { type: "search" });
  };

  const toggleActivityType = (type: string) => {
    setActivityTypes((prev) => {
      const exists = prev.includes(type);
      const next = exists ? prev.filter((t) => t !== type) : [...prev, type];
      onFilterChange(buildFilters({ activityTypes: next }), { type: "apply" });
      return next;
    });
  };

  const handleMinActivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setMinActivityCount(value);
    onFilterChange(buildFilters({ minActivityCount: value }), { type: "apply" });
  };

  const handleMaxActivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setMaxActivityCount(value);
    onFilterChange(buildFilters({ maxActivityCount: value }), { type: "apply" });
  };

  const handleActivitySinceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setActivitySince(value);
    onFilterChange(buildFilters({ activitySince: value }), { type: "apply" });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // 검색 즉시 실행 (디바운스 무시)
    onFilterChange(buildFilters(), { type: "apply" });
  };

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setActivityTypes([]);
    setMinActivityCount("");
    setMaxActivityCount("");
    setActivitySince("");
    onFilterChange(
      {
        search: "",
        status: "all",
        activityTypes: [],
        minActivityCount: "",
        maxActivityCount: "",
        activitySince: "",
      },
      { type: "reset" },
    );
    // 포커스를 검색 입력으로 이동
    searchInputRef.current?.focus();
  };

  // Escape 키로 검색 초기화
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearch("");
      onFilterChange(buildFilters({ search: "" }), { type: "search" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-4"
      role="search"
      aria-label="대상자 검색 및 필터"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* 검색 입력 */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            검색
          </label>
          <input
            ref={searchInputRef}
            type="text"
            id="search"
            name="search"
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder="이름 또는 연락처로 검색"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="대상자 검색 입력"
            aria-describedby="search-description"
          />
          <p id="search-description" className="sr-only">
            이름 또는 연락처를 입력하여 대상자를 검색할 수 있습니다. Escape 키를 누르면 검색어가
            초기화됩니다.
          </p>
        </div>

        {/* 상태 필터 */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            상태
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={handleStatusChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="대상자 상태 필터"
          >
            <option value="all">전체</option>
            <option value="active">활동중</option>
            <option value="inactive">비활동</option>
            <option value="discharged">종결</option>
          </select>
        </div>

        {/* 활동 유형 필터 */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700">활동 유형</legend>
          <div className="flex flex-wrap gap-2">
            {[
              { type: "consultation", label: "💬 상담" },
              { type: "assessment", label: "📋 평가" },
              { type: "rental", label: "📦 대여" },
              { type: "customization", label: "🔧 맞춤제작" },
            ].map(({ type, label }) => (
              <label
                key={type}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={activityTypes.includes(type)}
                  onChange={() => toggleActivityType(type)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* 활동 횟수 범위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">활동 횟수 범위</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={minActivityCount}
              onChange={handleMinActivityChange}
              placeholder="최소"
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="최소 활동 횟수"
            />
            <span className="text-gray-500">~</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={maxActivityCount}
              onChange={handleMaxActivityChange}
              placeholder="최대"
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="최대 활동 횟수"
            />
          </div>
        </div>

        {/* 최근 활동 날짜 */}
        <div>
          <label htmlFor="activity-since" className="block text-sm font-medium text-gray-700">
            최근 활동 (이 날짜 이후)
          </label>
          <input
            type="date"
            id="activity-since"
            name="activity-since"
            value={activitySince}
            onChange={handleActivitySinceChange}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 버튼 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="검색 실행"
        >
          검색
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="검색 및 필터 초기화"
        >
          초기화
        </button>
      </div>
    </form>
  );
}
