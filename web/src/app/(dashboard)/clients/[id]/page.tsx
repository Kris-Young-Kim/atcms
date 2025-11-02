"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useUserRole } from "@/components/auth/ProtectedRoute";
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
import type { Client } from "@/lib/validations/client";

/**
 * 대상자 상세 페이지
 * Sprint 1: CMS-US-02
 */

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useUserRole();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [clientStats, setClientStats] = useState<{
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
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "consultations" | "assessments" | "activities"
  >("overview");

  const clientId = params.id as string;
  const canEdit = hasRole(["admin", "leader", "specialist"]);
  const canDelete = hasRole(["admin", "leader"]);

  useEffect(() => {
    fetchClient();
    fetchStats();
  }, [clientId]);

  async function fetchClient() {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      } else {
        showError("대상자 정보를 불러올 수 없습니다.");
      }
    } catch (err) {
      showError("대상자 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch(`/api/clients/${clientId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setClientStats(data);
      }
    } catch (err) {
      console.error("통계 조회 실패:", err);
    }
  }

  async function handleDelete() {
    if (!confirm("정말 이 대상자를 종결 처리하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        success("대상자가 종결 처리되었습니다.");
        setTimeout(() => {
          router.push("/clients");
        }, 2000);
      } else {
        showError("종결 처리에 실패했습니다.");
      }
    } catch (err) {
      showError("종결 처리 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

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

  const statusMap: Record<string, { label: string; class: string }> = {
    active: { label: "활동중", class: "bg-green-100 text-green-700" },
    inactive: { label: "비활동", class: "bg-gray-100 text-gray-700" },
    discharged: { label: "종결", class: "bg-red-100 text-red-700" },
  };

  const statusInfo = statusMap[client.status] || { label: client.status, class: "bg-gray-100" };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.class}`}>
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
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "처리 중..." : "종결"}
              </button>
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
              onClick={() => setActiveTab("consultations")}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === "consultations"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
              aria-current={activeTab === "consultations" ? "page" : undefined}
            >
              상담 기록
            </button>
            <button
              onClick={() => setActiveTab("assessments")}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === "assessments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
              aria-current={activeTab === "assessments" ? "page" : undefined}
            >
              평가 기록
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === "activities"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
              aria-current={activeTab === "activities" ? "page" : undefined}
            >
              통합 활동
            </button>
          </nav>
        </div>

        {/* 탭 내용 */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 통합 통계 위젯 */}
            <ClientStatsWidget clientId={clientId} />

            {/* 대시보드 위젯 그리드 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 진행 중인 작업 및 최근 활동 */}
              <div className="space-y-6">
                {clientStats && <ActiveTasksWidget clientId={clientId} stats={clientStats.stats} />}
                <RecentActivitiesWidget clientId={clientId} />
              </div>

              {/* 다음 일정 및 빠른 액션 */}
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

            {/* 기본 정보 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">기본 정보</h2>
              <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">이름</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">생년월일</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.birth_date
                      ? new Date(client.birth_date).toLocaleDateString("ko-KR")
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">성별</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.gender === "male"
                      ? "남성"
                      : client.gender === "female"
                        ? "여성"
                        : client.gender || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">의뢰 경로</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.referral_source || "-"}</dd>
                </div>
              </dl>
            </div>

            {/* 장애 정보 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">장애 정보</h2>
              <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">장애 유형</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.disability_type || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">장애 등급</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.disability_grade || "-"}</dd>
                </div>
              </dl>
            </div>

            {/* 연락처 정보 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">연락처 정보</h2>
              <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">전화번호</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.contact_phone || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">이메일</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.contact_email || "-"}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">주소</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.address || "-"}</dd>
                </div>
              </dl>
            </div>

            {/* 보호자 정보 */}
            {(client.guardian_name || client.guardian_phone) && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">보호자 정보</h2>
                <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">보호자 이름</dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.guardian_name || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">보호자 연락처</dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.guardian_phone || "-"}</dd>
                  </div>
                </dl>
              </div>
            )}

            {/* 메모 */}
            {client.notes && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">메모</h2>
                <p className="whitespace-pre-wrap text-sm text-gray-900">{client.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "consultations" && (
          <ConsultationTimeline
            clientId={clientId}
            onCreateNew={() => router.push(`/clients/${clientId}/consultations/new`)}
          />
        )}

        {activeTab === "assessments" && (
          <AssessmentTimeline
            clientId={clientId}
            onCreateNew={() => router.push(`/clients/${clientId}/assessments/new`)}
          />
        )}

        {activeTab === "activities" && <IntegratedActivityTimeline clientId={clientId} />}
      </div>
    </>
  );
}
