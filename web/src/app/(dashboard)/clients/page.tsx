"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";

import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientsFilter } from "@/components/clients/ClientsFilter";
import { auditLogger } from "@/lib/logger/auditLogger";
import { debounce } from "@/lib/utils/debounce";
import type { Client } from "@/lib/validations/client";

/**
 * 대상자 목록 페이지
 * 검색, 필터, 정렬, 페이지네이션 기능
 * Sprint 1: CMS-US-02, CMS-US-03
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 쿼리 파라미터에서 초기값 읽기
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "all",
  });
  const [sorting, setSorting] = useState({
    sortBy: searchParams.get("sortBy") || "created_at",
    sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
  });
  const [loading, setLoading] = useState(true);

  // URL 쿼리 파라미터 업데이트 함수
  const updateURL = useCallback(
    (newFilters: typeof filters, newSorting: typeof sorting, newPage: number) => {
      const params = new URLSearchParams();
      if (newFilters.search) params.set("search", newFilters.search);
      if (newFilters.status !== "all") params.set("status", newFilters.status);
      if (newSorting.sortBy !== "created_at") params.set("sortBy", newSorting.sortBy);
      if (newSorting.sortOrder !== "desc") params.set("sortOrder", newSorting.sortOrder);
      if (newPage > 1) params.set("page", newPage.toString());

      // URL 업데이트 (히스토리 추가하지 않음)
      router.replace(`/clients?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  // 디바운스된 검색 함수
  const debouncedSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        const newFilters = { ...filters, search: searchValue };
        setFilters(newFilters);
        setPagination((prev) => ({ ...prev, page: 1 }));
        updateURL(newFilters, sorting, 1);

        // 감사 로그 기록
        if (searchValue) {
          auditLogger.info("clients_search_executed", {
            metadata: { searchQuery: searchValue },
          });
        }
      }, 300),
    [filters, sorting, updateURL],
  );

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
      auditLogger.error("clients_list_fetch_failed", {
        error,
        metadata: { filters, sorting, page: pagination.page },
      });
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (newFilters: { search: string; status: string }) => {
    // 상태 필터는 즉시 적용
    if (newFilters.status !== filters.status) {
      setFilters(newFilters);
      setPagination((prev) => ({ ...prev, page: 1 }));
      updateURL(newFilters, sorting, 1);

      // 감사 로그 기록
      auditLogger.info("clients_filter_applied", {
        metadata: { status: newFilters.status },
      });
    }
    // 검색은 디바운스 적용
    if (newFilters.search !== filters.search) {
      debouncedSearch(newFilters.search);
    }
  };

  const handleSort = (sortBy: string, sortOrder: "asc" | "desc") => {
    const newSorting = { sortBy, sortOrder };
    setSorting(newSorting);
    updateURL(filters, newSorting, pagination.page);

    // 감사 로그 기록
    auditLogger.info("clients_sorted", {
      metadata: { sortBy, sortOrder },
    });
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    updateURL(filters, sorting, newPage);
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
          className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + 새 대상자 등록
        </Link>
      </div>

      {/* 필터 */}
      <ClientsFilter
        initialSearch={filters.search}
        initialStatus={filters.status}
        onFilterChange={handleFilterChange}
      />

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
              aria-label="이전 페이지"
            >
              이전
            </button>
            <span
              className="flex items-center px-3 text-sm text-gray-700"
              aria-label={`페이지 ${pagination.page} / ${pagination.totalPages}`}
            >
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="다음 페이지"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
