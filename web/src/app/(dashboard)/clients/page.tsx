"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientsFilter } from "@/components/clients/ClientsFilter";
import type { Client } from "@/lib/validations/client";

/**
 * 대상자 목록 페이지
 * 검색, 필터, 정렬, 페이지네이션 기능
 *
 * 접근 권한: technician을 제외한 모든 역할
 */

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({ search: "", status: "all" });
  const [sorting, setSorting] = useState({ sortBy: "created_at", sortOrder: "desc" as "asc" | "desc" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, [filters, sorting, pagination.page]);

  async function fetchClients() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: filters.search,
        status: filters.status,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
      });

      const response = await fetch(`/api/clients?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("대상자 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (newFilters: { search: string; status: string }) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // 필터 변경 시 첫 페이지로
  };

  const handleSort = (sortBy: string, sortOrder: "asc" | "desc") => {
    setSorting({ sortBy, sortOrder });
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대상자 목록</h1>
          <p className="mt-2 text-sm text-gray-600">
            전체 {pagination.total}명의 대상자를 조회하고 관리할 수 있습니다.
          </p>
        </div>
        <Link
          href="/clients/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + 새 대상자 등록
        </Link>
      </div>

      {/* 필터 */}
      <ClientsFilter onFilterChange={handleFilterChange} />

      {/* 테이블 */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      ) : (
        <ClientsTable data={clients} onSort={handleSort} />
      )}

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="text-sm text-gray-700">
            {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              이전
            </button>
            <span className="flex items-center px-3 text-sm text-gray-700">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

