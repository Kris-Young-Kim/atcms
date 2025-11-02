"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useUserRole } from "@/components/auth/ProtectedRoute";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { ScheduleForm } from "@/components/schedules/ScheduleForm";
import type { Schedule } from "@/lib/validations/schedule";

/**
 * 일정 상세 페이지
 * Phase 10: SCH-US-02
 */

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useUserRole();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const scheduleId = params.id as string;
  const canEdit = hasRole(["admin", "leader", "specialist", "technician"]);
  const canDelete = hasRole(["admin", "leader"]);

  useEffect(() => {
    fetchSchedule();
  }, [scheduleId]);

  async function fetchSchedule() {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`);
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      } else {
        showError("일정 정보를 불러올 수 없습니다.");
      }
    } catch (err) {
      showError("일정 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("정말 이 일정을 취소하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        success("일정이 취소되었습니다.");
        setTimeout(() => {
          router.push("/schedules");
        }, 2000);
      } else {
        const errorData = await response.json();
        showError(errorData.error || "취소에 실패했습니다.");
      }
    } catch (err) {
      showError("취소 중 오류가 발생했습니다.");
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

  if (!schedule) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">일정을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const scheduleTypeMap: Record<string, string> = {
    consultation: "상담",
    assessment: "평가",
    rental: "대여",
    customization: "맞춤제작",
    other: "기타",
  };

  const statusMap: Record<string, { label: string; class: string }> = {
    scheduled: { label: "예정", class: "bg-blue-100 text-blue-700" },
    completed: { label: "완료", class: "bg-green-100 text-green-700" },
    cancelled: { label: "취소", class: "bg-red-100 text-red-700" },
    no_show: { label: "불참", class: "bg-gray-100 text-gray-700" },
  };

  const statusInfo = statusMap[schedule.status] || {
    label: schedule.status,
    class: "bg-gray-100 text-gray-700",
  };

  const client = (schedule as any).clients;
  const rental = (schedule as any).rentals;
  const customization = (schedule as any).customization_requests;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{schedule.title}</h1>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.class}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {scheduleTypeMap[schedule.schedule_type] || schedule.schedule_type}
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
              <Link
                href={`/schedules/${scheduleId}/edit`}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                수정
              </Link>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "취소 중..." : "취소"}
              </button>
            )}
          </div>
        </div>

        {/* 일정 정보 */}
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">일정 정보</h2>
            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">시작 시간</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(schedule.start_time).toLocaleString("ko-KR")}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">종료 시간</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(schedule.end_time).toLocaleString("ko-KR")}
                </dd>
              </div>
              {schedule.location && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">장소</dt>
                  <dd className="mt-1 text-sm text-gray-900">{schedule.location}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">알림 설정</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {schedule.reminder_minutes === 0
                    ? "알림 없음"
                    : schedule.reminder_minutes >= 60
                      ? `${Math.floor(schedule.reminder_minutes / 60)}시간 전`
                      : `${schedule.reminder_minutes}분 전`}
                </dd>
              </div>
            </dl>
          </div>

          {/* 관련 정보 */}
          {(rental || customization) && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">관련 정보</h2>
              <dl className="space-y-2">
                {rental && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">대여 기록</dt>
                    <dd className="mt-1">
                      <Link
                        href={`/rentals/${schedule.rental_id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        대여 #{rental.id.slice(0, 8)}...
                      </Link>
                    </dd>
                  </div>
                )}
                {customization && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">맞춤제작 요청</dt>
                    <dd className="mt-1">
                      <Link
                        href={`/customization-requests/${schedule.customization_request_id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {customization.title}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* 설명 */}
          {schedule.description && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">설명</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-900">{schedule.description}</p>
            </div>
          )}

          {/* 메모 */}
          {schedule.notes && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">메모</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-900">{schedule.notes}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

