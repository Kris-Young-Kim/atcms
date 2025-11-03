"use client";

import { useState } from "react";

/**
 * 맞춤제작 요청 필터 컴포넌트
 * Phase 10: CDM-US-02
 */

interface CustomizationsFilterProps {
  initialSearch?: string;
  initialStatus?: string;
  onFilterChange: (filters: { search: string; status: string }) => void;
}

export function CustomizationsFilter({
  initialSearch = "",
  initialStatus = "all",
  onFilterChange,
}: CustomizationsFilterProps) {
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ search: value, status });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onFilterChange({ search, status: value });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 검색 */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            검색
          </label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="제목으로 검색..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        {/* 상태 필터 */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            상태
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="requested">요청됨</option>
            <option value="designing">설계중</option>
            <option value="prototyping">시제품 제작중</option>
            <option value="fitting">착용 테스트</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소됨</option>
          </select>
        </div>
      </div>
    </div>
  );
}
