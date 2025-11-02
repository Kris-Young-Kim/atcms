"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import { EquipmentTable } from "@/components/equipment/EquipmentTable";
import { EquipmentStatusChart } from "@/components/equipment/EquipmentStatusChart";
import { useUserRole } from "@/components/auth/ProtectedRoute";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { debounce } from "@/lib/utils/debounce";
import type { Equipment } from "@/lib/validations/equipment";
import {
  EQUIPMENT_STATUS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CATEGORY_LABELS,
  type EquipmentStatus,
} from "@/lib/validations/equipment";

/**
 * 기기 목록 페이지
 * Sprint 1: ERM-US-01
 *
 * 접근 권한: technician을 제외한 모든 역할
 */

export default function EquipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole } = useUserRole();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [categoryFilter, setCategoryFilter] = useState<string>(
    searchParams.get("category") || "all",
  );
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("search") || "");

  const canCreate = hasRole(["admin", "leader", "technician"]);

  useEffect(() => {
    fetchEquipment();
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    // URL 쿼리 파라미터 동기화
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (searchQuery) params.set("search", searchQuery);

    const queryString = params.toString();
    const newUrl = queryString ? `/equipment?${queryString}` : "/equipment";
    router.replace(newUrl, { scroll: false });
  }, [statusFilter, categoryFilter, searchQuery, router]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/equipment?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.data || []);
      } else {
        showError("기기 목록을 불러올 수 없습니다.");
      }
    } catch (err) {
      showError("기기 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = debounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleStatusChange = async (equipmentId: string, newStatus: EquipmentStatus) => {
    if (!confirm(`기기 상태를 "${EQUIPMENT_STATUS_LABELS[newStatus]}"로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/equipment/${equipmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        success("기기 상태가 변경되었습니다.");
        fetchEquipment(); // 목록 새로고침
      } else {
        const errorData = await response.json();
        showError(errorData.error || "기기 상태 변경에 실패했습니다.");
      }
    } catch (err) {
      showError("기기 상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleQuantityAdjust = (equipmentId: string) => {
    router.push(`/equipment/${equipmentId}/quantity`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="space-y-6">
        {/* 헤더 */}
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

        {/* 필터 섹션 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 검색 */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                검색
              </label>
              <input
                type="text"
                id="search"
                defaultValue={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="기기명, 브랜드, 모델명 검색"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="기기 검색"
              />
            </div>

            {/* 상태 필터 (버튼 형태로 개선) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    statusFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  aria-label="전체 상태"
                >
                  전체
                </button>
                {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => {
                  const statusColors: Record<EquipmentStatus, string> = {
                    normal: "bg-green-100 text-green-700",
                    maintenance: "bg-yellow-100 text-yellow-700",
                    retired: "bg-red-100 text-red-700",
                  };
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        statusFilter === value
                          ? statusColors[value as EquipmentStatus] + " ring-2 ring-blue-500"
                          : statusColors[value as EquipmentStatus] + " hover:opacity-80"
                      }`}
                      aria-label={`${label} 상태 필터`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 카테고리 필터 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                카테고리
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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

        {/* 기기 상태 차트 */}
        <EquipmentStatusChart
          data={{
            normal: equipment.filter((eq) => eq.status === "normal").length,
            maintenance: equipment.filter((eq) => eq.status === "maintenance").length,
            retired: equipment.filter((eq) => eq.status === "retired").length,
          }}
        />

        {/* 기기 목록 테이블 */}
        <EquipmentTable
          equipment={equipment}
          onStatusChange={handleStatusChange}
          onQuantityAdjust={handleQuantityAdjust}
        />
      </div>
    </>
  );
}
