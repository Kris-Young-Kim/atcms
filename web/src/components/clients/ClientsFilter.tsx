"use client";

import { useState, FormEvent } from "react";

/**
 * 대상자 검색 및 필터 컴포넌트
 */

interface ClientsFilterProps {
  onFilterChange: (filters: {
    search: string;
    status: string;
  }) => void;
}

export function ClientsFilter({ onFilterChange }: ClientsFilterProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onFilterChange({ search, status });
  };

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    onFilterChange({ search: "", status: "all" });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* 검색 입력 */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            검색
          </label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 연락처로 검색"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 상태 필터 */}
        <div className="w-full md:w-48">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            상태
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          >
            검색
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            초기화
          </button>
        </div>
      </div>
    </form>
  );
}

