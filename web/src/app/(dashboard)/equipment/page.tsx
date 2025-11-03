"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { EquipmentTable } from "@/components/equipment/EquipmentTable";
import { EquipmentStatusChart } from "@/components/equipment/EquipmentStatusChart";
import { useUserRole } from "@/components/auth/ProtectedRoute";
import { SkeletonTable, SkeletonCard } from "@/components/ui/LoadingState";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CATEGORY_LABELS,
  type EquipmentStatus,
  type Equipment,
} from "@/lib/validations/equipment";
import { useEquipmentPageController } from "@/hooks/useEquipmentPageController";

export default function EquipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole } = useUserRole();
  const { toasts, removeToast, success, error: showError } = useToast();

  const controller = useEquipmentPageController({
    router,
    searchParams,
    onSuccess: success,
    onError: showError,
  });

  const canCreate = hasRole(["admin", "leader", "technician"]);

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        open={controller.statusChangeRequest !== null}
        title="기기 상태를 변경하시겠습니까?"
        description={
          controller.statusChangeRequest
            ? `선택한 기기를 "${EQUIPMENT_STATUS_LABELS[controller.statusChangeRequest.nextStatus]}" 상태로 변경합니다.`
            : undefined
        }
        confirmLabel="변경"
        loading={controller.statusUpdating}
        onCancel={() => {
          if (!controller.statusUpdating) {
            controller.cancelStatusChange();
          }
        }}
        onConfirm={controller.confirmStatusChange}
      />

      <EquipmentPageView
        equipment={controller.equipment}
        loading={controller.loading}
        statusFilter={controller.statusFilter}
        categoryFilter={controller.categoryFilter}
        searchQuery={controller.searchQuery}
        canCreate={canCreate}
        onStatusFilterSelect={controller.handleStatusFilterSelect}
        onCategoryFilterSelect={controller.handleCategoryFilterSelect}
        onSearchInput={controller.handleSearchInput}
        onStatusChangeRequest={controller.requestStatusChange}
        onQuantityAdjust={controller.navigateToQuantityAdjust}
      />
    </>
  );
}

interface EquipmentPageViewProps {
  equipment: Equipment[];
  loading: boolean;
  statusFilter: string;
  categoryFilter: string;
  searchQuery: string;
  canCreate: boolean;
  onStatusFilterSelect: (value: string) => void;
  onCategoryFilterSelect: (value: string) => void;
  onSearchInput: (value: string) => void;
  onStatusChangeRequest: (equipmentId: string, newStatus: EquipmentStatus) => void;
  onQuantityAdjust: (equipmentId: string) => void;
}

function EquipmentPageView({
  equipment,
  loading,
  statusFilter,
  categoryFilter,
  searchQuery,
  canCreate,
  onStatusFilterSelect,
  onCategoryFilterSelect,
  onSearchInput,
  onStatusChangeRequest,
  onQuantityAdjust,
}: EquipmentPageViewProps) {

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-96 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard className="h-64" />
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
  }

  const statusData = buildStatusData(equipment);

  return (
    <div className="space-y-6 p-6">
      <EquipmentPageHeader canCreate={canCreate} />
      <EquipmentFilters
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        searchQuery={searchQuery}
        onStatusFilterSelect={onStatusFilterSelect}
        onCategoryFilterSelect={onCategoryFilterSelect}
        onSearchInput={onSearchInput}
      />
      <EquipmentStatusChart data={statusData} />
      <EquipmentTable
        equipment={equipment}
        onStatusChange={onStatusChangeRequest}
        onQuantityAdjust={onQuantityAdjust}
      />
    </div>
  );
}

function EquipmentPageHeader({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">기기 재고 관리</h1>
        <p className="mt-2 text-sm text-gray-600">재고를 관리하고 상태를 변경할 수 있습니다.</p>
      </div>
      {canCreate && (
        <Link
          href="/equipment/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + 새 기기 등록
        </Link>
      )}
    </div>
  );
}

function EquipmentFilters({
  statusFilter,
  categoryFilter,
  searchQuery,
  onStatusFilterSelect,
  onCategoryFilterSelect,
  onSearchInput,
}: {
  statusFilter: string;
  categoryFilter: string;
  searchQuery: string;
  onStatusFilterSelect: (value: string) => void;
  onCategoryFilterSelect: (value: string) => void;
  onSearchInput: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="equipment-search" className="block text-sm font-medium text-gray-700">
            검색
          </label>
          <input
            id="equipment-search"
            type="text"
            key={searchQuery}
            defaultValue={searchQuery}
            onChange={(event) => onSearchInput(event.target.value)}
            placeholder="기기명, 브랜드, 모델명 검색"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="기기 검색"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">상태</label>
          <div className="flex flex-wrap gap-2">
            <EquipmentStatusFilterButton
              active={statusFilter === "all"}
              label="전체"
              onClick={() => onStatusFilterSelect("all")}
            />
            {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
              <EquipmentStatusFilterButton
                key={value}
                active={statusFilter === value}
                label={label}
                status={value as EquipmentStatus}
                onClick={() => onStatusFilterSelect(value)}
              />
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="equipment-category" className="block text-sm font-medium text-gray-700">
            카테고리
          </label>
          <select
            id="equipment-category"
            value={categoryFilter}
            onChange={(event) => onCategoryFilterSelect(event.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="카테고리 필터"
          >
            <option value="all">전체</option>
            {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function EquipmentStatusFilterButton({
  active,
  label,
  status,
  onClick,
}: {
  active: boolean;
  label: string;
  status?: EquipmentStatus;
  onClick: () => void;
}) {
  const baseClass = status
    ? {
        normal: "bg-green-100 text-green-700",
        maintenance: "bg-yellow-100 text-yellow-700",
        retired: "bg-red-100 text-red-700",
      }[status]
    : "bg-gray-100 text-gray-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
        active ? `${baseClass} ring-2 ring-blue-500` : `${baseClass} hover:opacity-80`
      }`}
    >
      {label}
    </button>
  );
}

function buildStatusData(equipment: Equipment[]) {
  return {
    normal: equipment.filter((item) => item.status === "normal").length,
    maintenance: equipment.filter((item) => item.status === "maintenance").length,
    retired: equipment.filter((item) => item.status === "retired").length,
  };
}
