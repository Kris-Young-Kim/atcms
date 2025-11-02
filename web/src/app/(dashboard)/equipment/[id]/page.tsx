"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useUserRole } from "@/components/auth/ProtectedRoute";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { MaintenanceNotesTimeline } from "@/components/equipment/MaintenanceNotesTimeline";
import type { Equipment } from "@/lib/validations/equipment";
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CATEGORY_LABELS,
  type EquipmentStatus,
} from "@/lib/validations/equipment";

/**
 * 기기 상세 페이지
 * Sprint 1: ERM-US-03
 */

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useUserRole();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "maintenance">("overview");

  const equipmentId = params.id as string;
  const canEdit = hasRole(["admin", "leader", "technician"]);
  const canDelete = hasRole(["admin", "leader"]);

  useEffect(() => {
    fetchEquipment();
  }, [equipmentId]);

  async function fetchEquipment() {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      } else {
        showError("기기 정보를 불러올 수 없습니다.");
      }
    } catch (err) {
      showError("기기 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">기기를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const statusMap: Record<EquipmentStatus, { label: string; class: string }> = {
    normal: { label: "정상", class: "bg-green-100 text-green-700" },
    maintenance: { label: "유지보수", class: "bg-yellow-100 text-yellow-700" },
    retired: { label: "폐기", class: "bg-red-100 text-red-700" },
  };

  const statusInfo = statusMap[equipment.status as EquipmentStatus] || {
    label: equipment.status,
    class: "bg-gray-100",
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{equipment.name}</h1>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.class}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              등록일:{" "}
              {equipment.created_at
                ? new Date(equipment.created_at).toLocaleDateString("ko-KR")
                : "-"}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/equipment"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              목록으로
            </Link>
            {canEdit && (
              <Link
                href={`/equipment/${equipmentId}/edit`}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                수정
              </Link>
            )}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
              aria-current={activeTab === "overview" ? "page" : undefined}
            >
              개요
            </button>
            <button
              onClick={() => setActiveTab("maintenance")}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === "maintenance"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
              aria-current={activeTab === "maintenance" ? "page" : undefined}
            >
              유지보수 기록
            </button>
          </nav>
        </div>

        {/* 탭 내용 */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">기본 정보</h2>
              <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">기기명</dt>
                  <dd className="mt-1 text-sm text-gray-900">{equipment.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">카테고리</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {equipment.category
                      ? EQUIPMENT_CATEGORY_LABELS[
                          equipment.category as keyof typeof EQUIPMENT_CATEGORY_LABELS
                        ]
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">브랜드</dt>
                  <dd className="mt-1 text-sm text-gray-900">{equipment.brand || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">모델명</dt>
                  <dd className="mt-1 text-sm text-gray-900">{equipment.model || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">시리얼 번호</dt>
                  <dd className="mt-1 text-sm text-gray-900">{equipment.serial_number || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">상태</dt>
                  <dd className="mt-1">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo.class}`}
                    >
                      {statusInfo.label}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* 수량 정보 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">수량 정보</h2>
              <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">전체 수량</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {equipment.total_quantity || 0}개
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">가용 수량</dt>
                  <dd className="mt-1 text-lg font-semibold text-green-600">
                    {equipment.available_quantity || 0}개
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">대여 중</dt>
                  <dd className="mt-1 text-lg font-semibold text-blue-600">
                    {(equipment.total_quantity || 0) - (equipment.available_quantity || 0)}개
                  </dd>
                </div>
              </dl>
            </div>

            {/* 추가 정보 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">추가 정보</h2>
              <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">보관 위치</dt>
                  <dd className="mt-1 text-sm text-gray-900">{equipment.location || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">구매일</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {equipment.purchase_date
                      ? new Date(equipment.purchase_date).toLocaleDateString("ko-KR")
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">구매 가격</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {equipment.purchase_price
                      ? `${equipment.purchase_price.toLocaleString()}원`
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">보증 만료일</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {equipment.warranty_expires
                      ? new Date(equipment.warranty_expires).toLocaleDateString("ko-KR")
                      : "-"}
                  </dd>
                </div>
                {equipment.description && (
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">설명</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {equipment.description}
                    </dd>
                  </div>
                )}
                {equipment.notes && (
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">메모</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {equipment.notes}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {activeTab === "maintenance" && (
          <MaintenanceNotesTimeline
            equipmentId={equipmentId}
            onCreateNew={() => router.push(`/equipment/${equipmentId}/maintenance/new`)}
          />
        )}
      </div>
    </>
  );
}
