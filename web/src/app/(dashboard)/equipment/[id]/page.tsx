"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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

type EquipmentTab = "overview" | "maintenance";

const EQUIPMENT_STATUS_MAP: Record<EquipmentStatus, { label: string; className: string }> = {
  normal: { label: "정상", className: "bg-green-100 text-green-700" },
  maintenance: { label: "유지보수", className: "bg-yellow-100 text-yellow-700" },
  retired: { label: "폐기", className: "bg-red-100 text-red-700" },
};

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useUserRole();
  const { toasts, removeToast, error: showError } = useToast();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EquipmentTab>("overview");

  const equipmentId = params.id as string;
  const canEdit = hasRole(["admin", "leader", "technician"]);

  const fetchEquipment = useCallback(async () => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      } else {
        showError("기기 정보를 불러올 수 없습니다.");
      }
    } catch {
      showError("기기 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [equipmentId, showError]);

  useEffect(() => {
    void fetchEquipment();
  }, [fetchEquipment]);

  const statusInfo = useMemo(() => {
    const status = equipment?.status as EquipmentStatus | undefined;
    if (!status) {
      return { label: "-", className: "bg-gray-100" };
    }
    return (
      EQUIPMENT_STATUS_MAP[status] || {
        label: status,
        className: "bg-gray-100",
      }
    );
  }, [equipment?.status]);

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

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="space-y-6">
        <EquipmentDetailHeader
          equipment={equipment}
          statusInfo={statusInfo}
          canEdit={canEdit}
          equipmentId={equipmentId}
        />

        <EquipmentTabNavigation activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "maintenance" ? (
          <MaintenanceNotesTimeline
            equipmentId={equipmentId}
            onCreateNew={() => router.push(`/equipment/${equipmentId}/maintenance/new`)}
          />
        ) : (
          <EquipmentOverviewContent equipment={equipment} />
        )}
      </div>
    </>
  );
}

interface EquipmentDetailHeaderProps {
  equipment: Equipment;
  statusInfo: { label: string; className: string };
  canEdit: boolean;
  equipmentId: string;
}

function EquipmentDetailHeader({
  equipment,
  statusInfo,
  canEdit,
  equipmentId,
}: EquipmentDetailHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{equipment.name}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          등록일:{" "}
          {equipment.created_at ? new Date(equipment.created_at).toLocaleDateString("ko-KR") : "-"}
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
  );
}

interface EquipmentTabNavigationProps {
  activeTab: EquipmentTab;
  onChange: (tab: EquipmentTab) => void;
}

function EquipmentTabNavigation({ activeTab, onChange }: EquipmentTabNavigationProps) {
  const tabs: Array<{ id: EquipmentTab; label: string }> = [
    { id: "overview", label: "개요" },
    { id: "maintenance", label: "유지보수 기록" },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

interface EquipmentOverviewContentProps {
  equipment: Equipment;
}

function EquipmentOverviewContent({ equipment }: EquipmentOverviewContentProps) {
  return (
    <div className="space-y-6">
      <InfoSection title="기본 정보">
        <InfoGrid columns={2}>
          <InfoItem label="기기명" value={equipment.name} />
          <InfoItem
            label="카테고리"
            value={
              equipment.category
                ? EQUIPMENT_CATEGORY_LABELS[
                    equipment.category as keyof typeof EQUIPMENT_CATEGORY_LABELS
                  ]
                : "-"
            }
          />
          <InfoItem label="브랜드" value={equipment.brand || "-"} />
          <InfoItem label="모델명" value={equipment.model || "-"} />
          <InfoItem label="시리얼 번호" value={equipment.serial_number || "-"} />
          <InfoItem
            label="상태"
            value={EQUIPMENT_STATUS_LABELS[equipment.status] ?? equipment.status}
          />
        </InfoGrid>
      </InfoSection>

      <InfoSection title="수량 정보">
        <InfoGrid columns={3}>
          <InfoItem label="전체 수량" value={`${equipment.total_quantity || 0}개`} />
          <InfoItem label="가용 수량" value={`${equipment.available_quantity || 0}개`} />
          <InfoItem
            label="대여 중"
            value={`${(equipment.total_quantity || 0) - (equipment.available_quantity || 0)}개`}
          />
        </InfoGrid>
      </InfoSection>

      <InfoSection title="추가 정보">
        <InfoGrid columns={2}>
          <InfoItem label="보관 위치" value={equipment.location || "-"} />
          <InfoItem
            label="구매일"
            value={
              equipment.purchase_date
                ? new Date(equipment.purchase_date).toLocaleDateString("ko-KR")
                : "-"
            }
          />
          <InfoItem
            label="구매 가격"
            value={
              equipment.purchase_price ? `${equipment.purchase_price.toLocaleString()}원` : "-"
            }
          />
          <InfoItem
            label="보증 만료일"
            value={
              equipment.warranty_expires
                ? new Date(equipment.warranty_expires).toLocaleDateString("ko-KR")
                : "-"
            }
          />
          {equipment.description && (
            <InfoItem label="설명" value={equipment.description} fullWidth multiline />
          )}
          {equipment.notes && <InfoItem label="메모" value={equipment.notes} fullWidth multiline />}
        </InfoGrid>
      </InfoSection>
    </div>
  );
}

interface InfoSectionProps {
  title: string;
  children: ReactNode;
}

function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

interface InfoGridProps {
  children: ReactNode;
  columns?: 2 | 3;
}

function InfoGrid({ children, columns = 2 }: InfoGridProps) {
  const columnClass = columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
  return <dl className={`grid grid-cols-1 gap-4 ${columnClass}`}>{children}</dl>;
}

interface InfoItemProps {
  label: string;
  value: string;
  fullWidth?: boolean;
  multiline?: boolean;
}

function InfoItem({ label, value, fullWidth = false, multiline = false }: InfoItemProps) {
  return (
    <div className={fullWidth ? "md:col-span-2" : undefined}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className={`mt-1 text-sm text-gray-900 ${multiline ? "whitespace-pre-wrap" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
