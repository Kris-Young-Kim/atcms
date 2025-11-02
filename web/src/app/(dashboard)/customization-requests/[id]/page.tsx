"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useUserRole } from "@/components/auth/ProtectedRoute";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { CustomizationForm } from "@/components/customization/CustomizationForm";
import type { CustomizationRequest, CustomizationStage } from "@/lib/validations/customization";

interface CustomizationDetail extends CustomizationRequest {
  clients?: {
    id: string;
    name: string;
    contact_phone?: string | null;
  } | null;
}

type CustomizationTab = "overview" | "stages" | "edit";

const CUSTOMIZATION_STATUS_MAP: Record<string, { label: string; className: string }> = {
  requested: { label: "요청됨", className: "bg-blue-100 text-blue-700" },
  designing: { label: "설계중", className: "bg-yellow-100 text-yellow-700" },
  prototyping: { label: "시제품 제작중", className: "bg-orange-100 text-orange-700" },
  fitting: { label: "착용 테스트", className: "bg-purple-100 text-purple-700" },
  completed: { label: "완료", className: "bg-green-100 text-green-700" },
  cancelled: { label: "취소됨", className: "bg-red-100 text-red-700" },
};

export default function CustomizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useUserRole();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [customization, setCustomization] = useState<CustomizationDetail | null>(null);
  const [stages, setStages] = useState<CustomizationStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<CustomizationTab>("overview");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const customizationId = params.id as string;
  const canEdit = hasRole(["admin", "leader", "specialist", "technician"]);
  const canDelete = hasRole(["admin", "leader"]);

  const fetchCustomization = useCallback(async () => {
    try {
      const response = await fetch(`/api/customization-requests/${customizationId}`);
      if (response.ok) {
        const data = (await response.json()) as CustomizationDetail;
        setCustomization(data);
      } else {
        showError("맞춤제작 요청 정보를 불러올 수 없습니다.");
      }
    } catch {
      showError("맞춤제작 요청 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [customizationId, showError]);

  const fetchStages = useCallback(async () => {
    try {
      const response = await fetch(`/api/customization-requests/${customizationId}/stages`);
      if (response.ok) {
        const data = (await response.json()) as { data?: CustomizationStage[] };
        setStages(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error("단계 히스토리 조회 실패:", error);
    }
  }, [customizationId]);

  useEffect(() => {
    void fetchCustomization();
    void fetchStages();
  }, [fetchCustomization, fetchStages]);

  function handleDeleteClick() {
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/customization-requests/${customizationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        success("맞춤제작 요청이 취소되었습니다.");
        setDeleteDialogOpen(false);
        setTimeout(() => {
          router.push("/customization-requests");
        }, 2000);
      } else {
        const errorData = await response.json();
        showError(errorData.error || "취소에 실패했습니다.");
      }
    } catch {
      showError("취소 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  const statusInfo = useMemo(() => {
    const status = customization?.status;
    if (!status) {
      return { label: "-", className: "bg-gray-100 text-gray-700" };
    }
    return (
      CUSTOMIZATION_STATUS_MAP[status] || {
        label: status,
        className: "bg-gray-100 text-gray-700",
      }
    );
  }, [customization?.status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (!customization) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">맞춤제작 요청을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const client = customization.clients ?? null;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        open={deleteDialogOpen}
        title="이 맞춤제작 요청을 취소하시겠습니까?"
        description="취소 후에는 되돌릴 수 없습니다."
        confirmLabel="취소"
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteDialogOpen(false);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <div className="space-y-6">
        <CustomizationDetailHeader
          customization={customization}
          statusInfo={statusInfo}
          client={client}
          canEdit={canEdit}
          canDelete={canDelete}
          deleting={deleting}
          onEdit={() => setActiveTab("edit")}
          onDelete={handleDeleteClick}
        />

        <CustomizationTabNavigation activeTab={activeTab} onChange={setActiveTab} />

        <CustomizationTabPanel
          activeTab={activeTab}
          customization={customization}
          customizationId={customizationId}
          stages={stages}
          canEdit={canEdit}
          onCloseEdit={() => setActiveTab("overview")}
          onSaveSuccess={() => {
            success("맞춤제작 요청이 수정되었습니다.");
            setActiveTab("overview");
            void fetchCustomization();
            void fetchStages();
          }}
        />
      </div>
    </>
  );
}

interface CustomizationDetailHeaderProps {
  customization: CustomizationDetail;
  statusInfo: { label: string; className: string };
  client: CustomizationDetail["clients"];
  canEdit: boolean;
  canDelete: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function CustomizationDetailHeader({
  customization,
  statusInfo,
  client,
  canEdit,
  canDelete,
  deleting,
  onEdit,
  onDelete,
}: CustomizationDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{customization.title}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {client && (
            <>
              대상자:{" "}
              <Link
                href={`/clients/${customization.client_id}`}
                className="text-blue-600 hover:underline"
              >
                {client.name}
              </Link>
            </>
          )}
        </p>
      </div>
      <div className="flex gap-3">
        {canEdit && (
          <button
            onClick={onEdit}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            수정
          </button>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "취소 중..." : "취소"}
          </button>
        )}
      </div>
    </div>
  );
}

interface CustomizationTabNavigationProps {
  activeTab: CustomizationTab;
  onChange: (tab: CustomizationTab) => void;
}

function CustomizationTabNavigation({ activeTab, onChange }: CustomizationTabNavigationProps) {
  const tabs: Array<{ id: CustomizationTab; label: string }> = [
    { id: "overview", label: "개요" },
    { id: "stages", label: "단계 추적" },
    { id: "edit", label: "수정" },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

interface CustomizationTabPanelProps {
  activeTab: CustomizationTab;
  customization: CustomizationDetail;
  customizationId: string;
  stages: CustomizationStage[];
  canEdit: boolean;
  onCloseEdit: () => void;
  onSaveSuccess: () => void;
}

function CustomizationTabPanel({
  activeTab,
  customization,
  customizationId,
  stages,
  canEdit,
  onCloseEdit,
  onSaveSuccess,
}: CustomizationTabPanelProps) {
  if (activeTab === "edit" && canEdit) {
    return (
      <CustomizationForm
        customizationId={customizationId}
        initialData={customization}
        mode="edit"
      />
    );
  }

  if (activeTab === "stages") {
    return <CustomizationStagesContent stages={stages} />;
  }

  return <CustomizationOverviewContent customization={customization} />;
}

interface CustomizationOverviewContentProps {
  customization: CustomizationDetail;
}

function CustomizationOverviewContent({ customization }: CustomizationOverviewContentProps) {
  return (
    <div className="space-y-6">
      <InfoSection title="기본 정보">
        <InfoGrid columns={2}>
          <InfoItem label="제작 목적" value={customization.purpose || "-"} />
          <InfoItem
            label="요청일"
            value={
              customization.requested_date
                ? new Date(customization.requested_date).toLocaleDateString("ko-KR")
                : "-"
            }
          />
          <InfoItem
            label="예상 완료일"
            value={
              customization.expected_completion_date
                ? new Date(customization.expected_completion_date).toLocaleDateString("ko-KR")
                : "-"
            }
          />
          {customization.completed_date && (
            <InfoItem
              label="완료일"
              value={new Date(customization.completed_date).toLocaleDateString("ko-KR")}
            />
          )}
        </InfoGrid>
      </InfoSection>

      {(customization.height_cm ||
        customization.width_cm ||
        customization.depth_cm ||
        customization.weight_kg) && (
        <InfoSection title="치수 정보">
          <InfoGrid columns={4}>
            {customization.height_cm && (
              <InfoItem label="높이" value={`${customization.height_cm} cm`} />
            )}
            {customization.width_cm && (
              <InfoItem label="너비" value={`${customization.width_cm} cm`} />
            )}
            {customization.depth_cm && (
              <InfoItem label="깊이" value={`${customization.depth_cm} cm`} />
            )}
            {customization.weight_kg && (
              <InfoItem label="무게" value={`${customization.weight_kg} kg`} />
            )}
          </InfoGrid>
        </InfoSection>
      )}

      {customization.materials && customization.materials.length > 0 && (
        <InfoSection title="재료">
          <div className="flex flex-wrap gap-2">
            {customization.materials.map((material, index) => (
              <span
                key={index}
                className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
              >
                {material}
              </span>
            ))}
          </div>
        </InfoSection>
      )}

      {(customization.description || customization.special_requirements) && (
        <InfoSection title="상세 정보">
          <div className="space-y-4">
            {customization.description && (
              <InfoParagraph label="설명" value={customization.description} />
            )}
            {customization.special_requirements && (
              <InfoParagraph label="특수 요구사항" value={customization.special_requirements} />
            )}
          </div>
        </InfoSection>
      )}

      {customization.design_files && customization.design_files.length > 0 && (
        <InfoSection title="설계 파일">
          <div className="space-y-2">
            {customization.design_files.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-blue-600 hover:bg-gray-100 hover:underline"
              >
                파일 {index + 1}
              </a>
            ))}
          </div>
        </InfoSection>
      )}

      {customization.notes && (
        <InfoSection title="메모">
          <p className="whitespace-pre-wrap text-sm text-gray-900">{customization.notes}</p>
        </InfoSection>
      )}
    </div>
  );
}

interface CustomizationStagesContentProps {
  stages: CustomizationStage[];
}

function CustomizationStagesContent({ stages }: CustomizationStagesContentProps) {
  if (stages.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">단계 히스토리</h2>
        <p className="text-gray-500">단계 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">단계 히스토리</h2>
      <div className="space-y-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="border-l-4 pl-4"
            style={{ borderLeftColor: getStageColor(stage.stage) }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{getStageLabel(stage.stage)}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {new Date(stage.stage_date).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </div>
            {stage.notes && <p className="mt-2 text-sm text-gray-700">{stage.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

interface InfoSectionProps {
  title: string;
  children: ReactNode;
}

function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

interface InfoGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

function InfoGrid({ children, columns = 2 }: InfoGridProps) {
  const columnClass =
    columns === 4 ? "md:grid-cols-4" : columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
  return <dl className={`grid grid-cols-1 gap-4 ${columnClass}`}>{children}</dl>;
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

interface InfoParagraphProps {
  label: string;
  value: string;
}

function InfoParagraph({ label, value }: InfoParagraphProps) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function getStageLabel(stage: string): string {
  const map: Record<string, string> = {
    requested: "요청됨",
    designing: "설계중",
    prototyping: "시제품 제작중",
    fitting: "착용 테스트",
    completed: "완료",
    cancelled: "취소됨",
  };
  return map[stage] || stage;
}

function getStageColor(stage: string): string {
  const map: Record<string, string> = {
    requested: "#3b82f6",
    designing: "#eab308",
    prototyping: "#f97316",
    fitting: "#a855f7",
    completed: "#22c55e",
    cancelled: "#ef4444",
  };
  return map[stage] || "#6b7280";
}
