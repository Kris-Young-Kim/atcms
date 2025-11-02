"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";

import { CustomizationsTable } from "@/components/customization/CustomizationsTable";
import { CustomizationsFilter } from "@/components/customization/CustomizationsFilter";
import { auditLogger } from "@/lib/logger/auditLogger";
import { debounce } from "@/lib/utils/debounce";
import type { CustomizationRequest } from "@/lib/validations/customization";

/**
 * 맞춤제작 요청 목록 페이지
 * Phase 10: CDM-US-02
 */

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CustomizationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customizations, setCustomizations] = useState<CustomizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  const filters = useMemo(() => {
    return {
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "all",
    };
  }, [searchParams]);

  const updateURL = useCallback(
    (newFilters: typeof filters, newPage: number) => {
      const params = new URLSearchParams();
      if (newFilters.search) params.set("search", newFilters.search);
      if (newFilters.status !== "all") params.set("status", newFilters.status);
      if (newPage > 1) params.set("page", newPage.toString());

      router.push(`/customization-requests?${params.toString()}`);
    },
    [router],
  );

  const debouncedFetch = useMemo(
    () =>
      debounce(async (search: string, status: string, page: number) => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (search) params.set("search", search);
          if (status !== "all") params.set("status", status);
          params.set("page", page.toString());
          params.set("limit", "25");

          const response = await fetch(`/api/customization-requests?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setCustomizations(data.data || []);
            setPagination(data.pagination || pagination);
          }
        } catch (error) {
          console.error("맞춤제작 요청 조회 실패:", error);
          auditLogger.error("customizations_list_fetch_failed", {
            error,
            metadata: { search, status, page },
          });
        } finally {
          setLoading(false);
        }
      }, 300),
    [pagination],
  );

  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    debouncedFetch(filters.search, filters.status, page);
  }, [filters.search, filters.status, searchParams, debouncedFetch]);

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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">맞춤제작 요청</h1>
          <p className="mt-2 text-sm text-gray-600">
            전체 {pagination.total}개의 맞춤제작 요청을 조회하고 관리할 수 있습니다.
          </p>
        </div>
        <Link
          href="/customization-requests/new"
          className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + 새 맞춤제작 요청
        </Link>
      </div>

      {/* 필터 */}
      <CustomizationsFilter
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
        <CustomizationsTable data={customizations} />
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
