"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientsFilter, type ClientListFilters } from "@/components/clients/ClientsFilter";
import type { Client } from "@/lib/validations/client";
import { useClientsPageController, type Pagination } from "@/hooks/useClientsPageController";

export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    clients,
    filters,
    loading,
    pagination,
    handleFilterChange,
    handleSort,
    handlePageChange,
  } = useClientsPageController({ router, searchParams });

  return (
    <ClientsPageView
      clients={clients}
      filters={filters}
      loading={loading}
      pagination={pagination}
      onFilterChange={handleFilterChange}
      onSort={handleSort}
      onPageChange={handlePageChange}
    />
  );
}

interface ClientsPageViewProps {
  clients: Client[];
  filters: ClientListFilters;
  loading: boolean;
  pagination: Pagination;
  onFilterChange: (
    newFilters: ClientListFilters,
    options: { type: "search" | "apply" | "reset" },
  ) => void;
  onSort: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onPageChange: (newPage: number) => void;
}

function ClientsPageView({
  clients,
  filters,
  loading,
  pagination,
  onFilterChange,
  onSort,
  onPageChange,
}: ClientsPageViewProps) {
  return (
    <div className="space-y-6">
      <ClientsPageHeader total={pagination.total} />
      <ClientsFilter initialFilters={filters} onFilterChange={onFilterChange} />
      {loading ? <ClientsLoadingState /> : <ClientsTable data={clients} onSort={onSort} />}
      <PaginationControls pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}

function ClientsPageHeader({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대상자 목록</h1>
        <p className="mt-2 text-sm text-gray-600">
          전체 {total}명의 대상자를 조회하고 관리할 수 있습니다.
        </p>
      </div>
      <Link
        href="/clients/new"
        className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        + 새 대상자 등록
      </Link>
    </div>
  );
}

function ClientsLoadingState() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
      <p className="text-gray-600">로딩 중...</p>
    </div>
  );
}

function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: Pagination;
  onPageChange: (newPage: number) => void;
}) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="text-sm text-gray-700">
        {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1}-
        {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
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
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="다음 페이지"
        >
          다음
        </button>
      </div>
    </div>
  );
}
