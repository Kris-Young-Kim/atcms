"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientsFilter, type ClientListFilters } from "@/components/clients/ClientsFilter";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import type { Client } from "@/lib/validations/client";
import { useClientsPageController, type Pagination } from "@/hooks/useClientsPageController";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

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
      <div className="px-6">
        <ClientsFilter initialFilters={filters} onFilterChange={onFilterChange} />
      </div>
      <div className="px-6">
        {loading ? <ClientsLoadingState /> : <ClientsTable data={clients} onSort={onSort} />}
      </div>
      {pagination.totalPages > 1 && (
        <div className="px-6">
          <PaginationControls pagination={pagination} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}

function ClientsPageHeader({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between px-6 pt-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">대상자 목록</h1>
        <p className="mt-2 text-sm text-neutral-600">
          전체 {total}명의 대상자를 조회하고 관리할 수 있습니다.
        </p>
      </div>
      <Button variant="primary" href="/clients/new">
        + 새 대상자 등록
      </Button>
    </div>
  );
}

function ClientsLoadingState() {
  return (
    <div className="card mx-6 p-12">
      <LoadingState message="대상자 목록을 불러오는 중..." />
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
    <div className="card flex items-center justify-between px-4 py-3">
      <div className="text-sm text-neutral-700">
        {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1}-
        {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          aria-label="이전 페이지"
        >
          이전
        </Button>
        <span
          className="flex items-center px-3 text-sm text-neutral-700"
          aria-label={`페이지 ${pagination.page} / ${pagination.totalPages}`}
        >
          {pagination.page} / {pagination.totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          aria-label="다음 페이지"
        >
          다음
        </Button>
      </div>
    </div>
  );
}
