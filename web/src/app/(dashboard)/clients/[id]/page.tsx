"use client";

import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useUserRole } from "@/components/auth/ProtectedRoute";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { ConsultationTimeline } from "@/components/clients/ConsultationTimeline";
import { AssessmentTimeline } from "@/components/clients/AssessmentTimeline";
import { IntegratedActivityTimeline } from "@/components/clients/IntegratedActivityTimeline";
import {
  ClientStatsWidget,
  ActiveTasksWidget,
  NextScheduleWidget,
  RecentActivitiesWidget,
  QuickActionsWidget,
} from "@/components/clients/ClientDashboardWidgets";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Client } from "@/lib/validations/client";

/**
 * 대상자 상세 페이지
 * Sprint 1: CMS-US-02
 */

type ClientTab = "overview" | "consultations" | "assessments" | "activities";

interface ClientStatsSummary {
  client_id: string;
  client_name: string;
  stats: {
    consultation_count: number;
    assessment_count: number;
    active_rentals_count: number;
    active_customizations_count: number;
    upcoming_schedules: Array<{
      id: string;
      title: string;
      start_time: string;
      schedule_type: string;
      status: string;
    }>;
    next_schedule: {
      id: string;
      title: string;
      start_time: string;
      schedule_type: string;
    } | null;
  };
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "활동중", className: "bg-green-100 text-green-700" },
  inactive: { label: "비활동", className: "bg-gray-100 text-gray-700" },
  discharged: { label: "종결", className: "bg-red-100 text-red-700" },
};

export default function ClientDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const router = useRouter();
  const { hasRole } = useUserRole();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [clientStats, setClientStats] = useState<ClientStatsSummary | null>(null);
  const [activeTab, setActiveTab] = useState<ClientTab>("overview");
  const [initialActivityFilter, setInitialActivityFilter] = useState<string | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const clientId = params.id as string;
  const canEdit = hasRole(["admin", "leader", "specialist"]);
  const canDelete = hasRole(["admin", "leader"]);

  const fetchClient = useCallback(async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      } else {
        showError("대상자 정보를 불러올 수 없습니다.");
      }
    } catch {
      showError("대상자 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [clientId, showError]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setClientStats(data);
      }
    } catch (error) {
      console.error("통계 조회 실패:", error);
    }
  }, [clientId]);

  useEffect(() => {
    void fetchClient();
    void fetchStats();
  }, [fetchClient, fetchStats]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const activityTypeParam = searchParams.get("activityType");

    if (
      tabParam &&
      ["overview", "consultations", "assessments", "activities"].includes(tabParam) &&
      tabParam !== activeTab
    ) {
      setActiveTab(tabParam as typeof activeTab);
    }

    if (activityTypeParam) {
      const normalized = activityTypeParam.toLowerCase();
      const validFilters = [
        "consultation",
        "assessment",
        "rental",
        "customization",
        "schedule",
        "all",
      ];
      if (validFilters.includes(normalized) && normalized !== initialActivityFilter) {
        setInitialActivityFilter(normalized);
        if (!tabParam) {
          setActiveTab("activities");
        }
      }
    }
  }, [activeTab, initialActivityFilter, searchParams, searchParamsKey]);

  async function handleDelete() {
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        success("대상자가 종결 처리되었습니다.");
        setDeleteDialogOpen(false);
        setTimeout(() => {
          router.push("/clients");
        }, 2000);
      } else {
        showError("종결 처리에 실패했습니다.");
      }
    } catch {
      showError("종결 처리 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  const statusInfo = useMemo(() => {
    const status = client?.status;
    if (!status) {
      return { label: "-", className: "bg-gray-100" };
    }
    return STATUS_MAP[status] || { label: status, className: "bg-gray-100" };
  }, [client?.status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">대상자를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="대상자를 종결 처리하시겠습니까?"
        description="종결 후에는 되돌릴 수 없습니다."
        confirmLabel="종결"
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteDialogOpen(false);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <div className="space-y-6">
        <ClientDetailHeader
          client={client}
          statusInfo={statusInfo}
          clientId={clientId}
          canEdit={canEdit}
          canDelete={canDelete}
          deleting={deleting}
          onDelete={handleDelete}
        />

        <ClientTabNavigation activeTab={activeTab} onChange={setActiveTab} />

        <ClientTabPanel
          activeTab={activeTab}
          client={client}
          clientId={clientId}
          clientStats={clientStats}
          initialActivityFilter={initialActivityFilter}
          onCreateConsultation={() => router.push(`/clients/${clientId}/consultations/new`)}
          onCreateAssessment={() => router.push(`/clients/${clientId}/assessments/new`)}
        />
      </div>
    </>
  );
}

interface ClientDetailHeaderProps {
  client: Client;
  statusInfo: { label: string; className: string };
  clientId: string;
  canEdit: boolean;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
}

function ClientDetailHeader({
  client,
  statusInfo,
  clientId,
  canEdit,
  canDelete,
  deleting,
  onDelete,
}: ClientDetailHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          접수일:{" "}
          {client.intake_date ? new Date(client.intake_date).toLocaleDateString("ko-KR") : "-"}
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/clients"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          목록으로
        </Link>
        {canEdit && (
          <Link
            href={`/clients/${clientId}/edit`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            수정
          </Link>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "처리 중..." : "종결"}
          </button>
        )}
      </div>
    </div>
  );
}

interface ClientTabNavigationProps {
  activeTab: ClientTab;
  onChange: (tab: ClientTab) => void;
}

function ClientTabNavigation({ activeTab, onChange }: ClientTabNavigationProps) {
  const tabs: Array<{ id: ClientTab; label: string }> = [
    { id: "overview", label: "개요" },
    { id: "consultations", label: "상담 기록" },
    { id: "assessments", label: "평가 기록" },
    { id: "activities", label: "통합 활동" },
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

interface ClientTabPanelProps {
  activeTab: ClientTab;
  client: Client;
  clientId: string;
  clientStats: ClientStatsSummary | null;
  initialActivityFilter?: string;
  onCreateConsultation: () => void;
  onCreateAssessment: () => void;
}

function ClientTabPanel({
  activeTab,
  client,
  clientId,
  clientStats,
  initialActivityFilter,
  onCreateConsultation,
  onCreateAssessment,
}: ClientTabPanelProps) {
  if (activeTab === "consultations") {
    return <ConsultationTimeline clientId={clientId} onCreateNew={onCreateConsultation} />;
  }

  if (activeTab === "assessments") {
    return <AssessmentTimeline clientId={clientId} onCreateNew={onCreateAssessment} />;
  }

  if (activeTab === "activities") {
    return (
      <IntegratedActivityTimeline clientId={clientId} initialFilterType={initialActivityFilter} />
    );
  }

  return <ClientOverviewContent client={client} clientId={clientId} clientStats={clientStats} />;
}

interface ClientOverviewContentProps {
  client: Client;
  clientId: string;
  clientStats: ClientStatsSummary | null;
}

function ClientOverviewContent({ client, clientId, clientStats }: ClientOverviewContentProps) {
  return (
    <div className="space-y-6">
      <ClientStatsWidget clientId={clientId} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {clientStats && <ActiveTasksWidget clientId={clientId} stats={clientStats.stats} />}
          <RecentActivitiesWidget clientId={clientId} />
        </div>

        <div className="space-y-6">
          {clientStats && (
            <NextScheduleWidget
              clientId={clientId}
              nextSchedule={clientStats.stats.next_schedule}
              upcomingSchedules={clientStats.stats.upcoming_schedules}
            />
          )}
          <QuickActionsWidget clientId={clientId} />
        </div>
      </div>

      <InfoSection title="기본 정보">
        <InfoGrid>
          <InfoItem label="이름" value={client.name} />
          <InfoItem
            label="생년월일"
            value={
              client.birth_date ? new Date(client.birth_date).toLocaleDateString("ko-KR") : "-"
            }
          />
          <InfoItem
            label="성별"
            value={
              client.gender === "male"
                ? "남성"
                : client.gender === "female"
                  ? "여성"
                  : client.gender || "-"
            }
          />
          <InfoItem label="의뢰 경로" value={client.referral_source || "-"} />
        </InfoGrid>
      </InfoSection>

      <InfoSection title="장애 정보">
        <InfoGrid>
          <InfoItem label="장애 유형" value={client.disability_type || "-"} />
          <InfoItem label="장애 등급" value={client.disability_grade || "-"} />
        </InfoGrid>
      </InfoSection>

      <InfoSection title="연락처 정보">
        <InfoGrid>
          <InfoItem label="전화번호" value={client.contact_phone || "-"} />
          <InfoItem label="이메일" value={client.contact_email || "-"} />
          <InfoItem label="주소" value={client.address || "-"} fullWidth />
        </InfoGrid>
      </InfoSection>

      {(client.guardian_name || client.guardian_phone) && (
        <InfoSection title="보호자 정보">
          <InfoGrid>
            <InfoItem label="보호자 이름" value={client.guardian_name || "-"} />
            <InfoItem label="보호자 연락처" value={client.guardian_phone || "-"} />
          </InfoGrid>
        </InfoSection>
      )}

      {client.notes && (
        <InfoSection title="메모">
          <p className="whitespace-pre-wrap text-sm text-gray-900">{client.notes}</p>
        </InfoSection>
      )}
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
}

function InfoGrid({ children }: InfoGridProps) {
  return <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</dl>;
}

interface InfoItemProps {
  label: string;
  value: string;
  fullWidth?: boolean;
}

function InfoItem({ label, value, fullWidth = false }: InfoItemProps) {
  return (
    <div className={fullWidth ? "md:col-span-2" : undefined}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}
