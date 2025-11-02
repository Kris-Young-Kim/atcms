"use client";

import { useState, FormEvent, useEffect, useRef } from "react";

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
  initialSearch?: string;
  initialStatus?: string;
  onFilterChange: (filters: { search: string; status: string }) => void;
}

export function ClientsFilter({
  initialSearch = "",
  initialStatus = "all",
  onFilterChange,
}: ClientsFilterProps) {
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 초기값이 변경되면 상태 업데이트 (URL에서 읽어온 경우)
  useEffect(() => {
    setSearch(initialSearch);
    setStatus(initialStatus);
  }, [initialSearch, initialStatus]);

  // 상태 필터 변경 시 즉시 적용
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    onFilterChange({ search, status: newStatus });
  };

  // 검색 입력 변경 시 즉시 상태 업데이트 (디바운스는 부모에서 처리)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    // 디바운스는 부모 컴포넌트에서 처리
    onFilterChange({ search: newSearch, status });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // 검색 즉시 실행 (디바운스 무시)
    onFilterChange({ search, status });
  };

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    onFilterChange({ search: "", status: "all" });
    // 포커스를 검색 입력으로 이동
    searchInputRef.current?.focus();
  };

  // Escape 키로 검색 초기화
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearch("");
      onFilterChange({ search: "", status });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-4"
      role="search"
      aria-label="대상자 검색 및 필터"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* 검색 입력 */}
        <div className="flex-1">
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
        <div className="w-full md:w-48">
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

        {/* 버튼 */}
        <div className="flex gap-2">
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
      </div>
    </form>
  );
}
