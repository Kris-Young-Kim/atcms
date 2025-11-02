"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import { RentalsTable } from "@/components/rentals/RentalsTable";
import { useUserRole } from "@/components/auth/ProtectedRoute";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import type { Rental } from "@/lib/validations/rental";
import { RENTAL_STATUS, RENTAL_STATUS_LABELS, type RentalStatus } from "@/lib/validations/rental";

/**
 * 대여 목록 페이지
 * Sprint 1: ERM-US-02
 *
 * 접근 권한: 모든 역할 가능
 */

export default function RentalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole } = useUserRole();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [equipmentIdFilter, setEquipmentIdFilter] = useState<string>(
    searchParams.get("equipment_id") || "",
  );
  const [clientIdFilter, setClientIdFilter] = useState<string>(searchParams.get("client_id") || "");

  const canCreate = hasRole(["admin", "leader", "technician"]);

  useEffect(() => {
    fetchRentals();
  }, [statusFilter, equipmentIdFilter, clientIdFilter]);

  useEffect(() => {
    // URL 쿼리 파라미터 동기화
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (equipmentIdFilter) params.set("equipment_id", equipmentIdFilter);
    if (clientIdFilter) params.set("client_id", clientIdFilter);

    const queryString = params.toString();
    const newUrl = queryString ? `/rentals?${queryString}` : "/rentals";
    router.replace(newUrl, { scroll: false });
  }, [statusFilter, equipmentIdFilter, clientIdFilter, router]);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (equipmentIdFilter) params.set("equipment_id", equipmentIdFilter);
      if (clientIdFilter) params.set("client_id", clientIdFilter);

      const response = await fetch(`/api/rentals?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRentals(data.data || []);
      } else {
        showError("대여 목록을 불러올 수 없습니다.");
      }
    } catch (err) {
      showError("대여 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (rentalId: string) => {
    router.push(`/rentals/${rentalId}/return`);
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
            <h1 className="text-3xl font-bold text-gray-900">대여 관리</h1>
            <p className="mt-2 text-sm text-gray-600">기기 대여 및 반납을 관리합니다.</p>
          </div>
          {canCreate && (
            <Link
              href="/rentals/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + 새 대여 등록
            </Link>
          )}
        </div>

        {/* 필터 섹션 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 상태 필터 */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                상태
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="상태 필터"
              >
                <option value="all">전체</option>
                {Object.entries(RENTAL_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* 기기 필터 (향후 구현) */}
            <div>
              <label htmlFor="equipment_id" className="block text-sm font-medium text-gray-700">
                기기 (ID)
              </label>
              <input
                type="text"
                id="equipment_id"
                value={equipmentIdFilter}
                onChange={(e) => setEquipmentIdFilter(e.target.value)}
                placeholder="기기 ID로 필터"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="기기 ID 필터"
              />
            </div>

            {/* 대상자 필터 (향후 구현) */}
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                대상자 (ID)
              </label>
              <input
                type="text"
                id="client_id"
                value={clientIdFilter}
                onChange={(e) => setClientIdFilter(e.target.value)}
                placeholder="대상자 ID로 필터"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="대상자 ID 필터"
              />
            </div>
          </div>
        </div>

        {/* 대여 목록 테이블 */}
        <RentalsTable rentals={rentals} onReturn={handleReturn} />
      </div>
    </>
  );
}
