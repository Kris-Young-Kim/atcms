"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useUserRole } from "@/components/auth/ProtectedRoute";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { ScheduleForm } from "@/components/schedules/ScheduleForm";
import type { Schedule } from "@/lib/validations/schedule";

interface ScheduleDetail extends Schedule {
  clients?: {
    id: string;
    name: string;
    contact_phone?: string | null;
  } | null;
  rentals?: {
    id: string;
    rental_date: string;
  } | null;
  customization_requests?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

type ScheduleTab = "overview" | "edit";

const SCHEDULE_TYPE_MAP: Record<string, string> = {
  consultation: "상담",
  assessment: "평가",
  rental: "대여",
  customization: "맞춤제작",
  other: "기타",
};

const SCHEDULE_STATUS_MAP: Record<string, { label: string; className: string }> = {
  scheduled: { label: "예정", className: "bg-blue-100 text-blue-700" },
  completed: { label: "완료", className: "bg-green-100 text-green-700" },
  cancelled: { label: "취소", className: "bg-red-100 text-red-700" },
  no_show: { label: "불참", className: "bg-gray-100 text-gray-700" },
};

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useUserRole();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<ScheduleTab>("overview");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const scheduleId = params.id as string;
  const canEdit = hasRole(["admin", "leader", "specialist", "technician"]);
  const canDelete = hasRole(["admin", "leader"]);

  const fetchSchedule = useCallback(async () => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`);
      if (response.ok) {
        const data = (await response.json()) as ScheduleDetail;
        setSchedule(data);
      } else {
        showError("일정 정보를 불러올 수 없습니다.");
      }
    } catch {
      showError("일정 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [scheduleId, showError]);

  useEffect(() => {
    void fetchSchedule();
  }, [fetchSchedule]);

  function handleDeleteClick() {
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        success("일정이 취소되었습니다.");
        setDeleteDialogOpen(false);
        setTimeout(() => {
          router.push("/schedules");
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
    const status = schedule?.status;
    if (!status) {
      return { label: "-", className: "bg-gray-100 text-gray-700" };
    }
    return (
      SCHEDULE_STATUS_MAP[status] || {
        label: status,
        className: "bg-gray-100 text-gray-700",
      }
    );
  }, [schedule?.status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">일정을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const client = schedule.clients ?? null;
  const rental = schedule.rentals ?? null;
  const customization = schedule.customization_requests ?? null;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        open={deleteDialogOpen}
        title="이 일정을 취소하시겠습니까?"
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
        <ScheduleDetailHeader
          schedule={schedule}
          statusInfo={statusInfo}
          client={client}
          canEdit={canEdit}
          canDelete={canDelete}
          deleting={deleting}
          onEdit={() => setActiveTab("edit")}
          onDelete={handleDeleteClick}
        />

        <ScheduleTabPanel
          activeTab={activeTab}
          canEdit={canEdit}
          schedule={schedule}
          scheduleId={scheduleId}
          rental={rental}
          customization={customization}
          onCloseEdit={() => setActiveTab("overview")}
          onSaveSuccess={() => {
            success("일정이 수정되었습니다.");
            setActiveTab("overview");
            void fetchSchedule();
          }}
        />
      </div>
    </>
  );
}

interface ScheduleDetailHeaderProps {
  schedule: ScheduleDetail;
  statusInfo: { label: string; className: string };
  client: ScheduleDetail["clients"];
  canEdit: boolean;
  canDelete: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function ScheduleDetailHeader({
  schedule,
  statusInfo,
  client,
  canEdit,
  canDelete,
  deleting,
  onEdit,
  onDelete,
}: ScheduleDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{schedule.title}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {SCHEDULE_TYPE_MAP[schedule.schedule_type] || schedule.schedule_type}
          {client && (
            <>
              {" · "}
              <Link
                href={`/clients/${schedule.client_id}`}
                className="text-blue-600 hover:underline"
              >
                {client.name}
              </Link>
            </>
          )}
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/schedules"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          목록으로
        </Link>
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

interface ScheduleTabPanelProps {
  activeTab: ScheduleTab;
  canEdit: boolean;
  schedule: ScheduleDetail;
  scheduleId: string;
  rental: ScheduleDetail["rentals"];
  customization: ScheduleDetail["customization_requests"];
  onCloseEdit: () => void;
  onSaveSuccess: () => void;
}

function ScheduleTabPanel({
  activeTab,
  canEdit,
  schedule,
  scheduleId,
  rental,
  customization,
  onCloseEdit,
  onSaveSuccess,
}: ScheduleTabPanelProps) {
  if (activeTab === "edit" && canEdit) {
    return (
      <ScheduleForm
        scheduleId={scheduleId}
        initialData={schedule}
        onSuccess={onSaveSuccess}
        onCancel={onCloseEdit}
      />
    );
  }

  return (
    <div className="space-y-6">
      <InfoSection title="일정 정보">
        <InfoGrid columns={2}>
          <InfoItem
            label="시작 시간"
            value={new Date(schedule.start_time).toLocaleString("ko-KR")}
          />
          <InfoItem label="종료 시간" value={new Date(schedule.end_time).toLocaleString("ko-KR")} />
          {schedule.location && <InfoItem label="장소" value={schedule.location} />}
          <InfoItem
            label="알림 설정"
            value={
              schedule.reminder_minutes === 0
                ? "알림 없음"
                : schedule.reminder_minutes >= 60
                  ? `${Math.floor(schedule.reminder_minutes / 60)}시간 전`
                  : `${schedule.reminder_minutes}분 전`
            }
          />
        </InfoGrid>
      </InfoSection>

      {(rental || customization) && (
        <InfoSection title="관련 정보">
          <div className="space-y-2">
            {rental && (
              <InfoLink
                label="대여 기록"
                href={`/rentals/${schedule.rental_id}`}
                text={`대여 #${rental.id.slice(0, 8)}...`}
              />
            )}
            {customization && (
              <InfoLink
                label="맞춤제작 요청"
                href={`/customization-requests/${schedule.customization_request_id}`}
                text={customization.title}
              />
            )}
          </div>
        </InfoSection>
      )}

      {schedule.participant_ids && schedule.participant_ids.length > 0 && (
        <InfoSection title="참석자">
          <ul className="list-inside list-disc text-sm text-gray-900">
            {schedule.participant_ids.map((participant) => (
              <li key={participant}>{participant}</li>
            ))}
          </ul>
        </InfoSection>
      )}

      {schedule.notes && (
        <InfoSection title="메모">
          <p className="whitespace-pre-wrap text-sm text-gray-900">{schedule.notes}</p>
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
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
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
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

interface InfoLinkProps {
  label: string;
  href: string;
  text: string;
}

function InfoLink({ label, href, text }: InfoLinkProps) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1">
        <Link href={href} className="text-sm text-blue-600 hover:underline">
          {text}
        </Link>
      </dd>
    </div>
  );
}
