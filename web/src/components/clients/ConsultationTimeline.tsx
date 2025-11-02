"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

import { useToast, ToastContainer } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Consultation } from "@/lib/validations/consultation";
import { parseTextToSOAP } from "@/lib/utils/soap-template";

/**
 * 상담 기록 타임라인 컴포넌트
 * Sprint 1: CMS-US-04
 */

interface ConsultationTimelineProps {
  clientId: string;
  onCreateNew?: () => void;
}

export function ConsultationTimeline({ clientId, onCreateNew }: ConsultationTimelineProps) {
  const { user } = useUser();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);

  const fetchConsultations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}/consultations`);
      if (response.ok) {
        const data = await response.json();
        setConsultations(data.data || []);
      } else {
        showError("상담 기록을 불러올 수 없습니다.");
      }
    } catch {
      showError("상담 기록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [clientId, showError]);

  useEffect(() => {
    void fetchConsultations();
  }, [fetchConsultations]);

  function requestDelete(consultationId: string) {
    setConfirmTargetId(consultationId);
  }

  async function handleDelete() {
    if (!confirmTargetId) {
      return;
    }

    setDeletingId(confirmTargetId);
    try {
      const response = await fetch(`/api/clients/${clientId}/consultations/${confirmTargetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        success("상담 기록이 삭제되었습니다.");
        void fetchConsultations(); // 목록 새로고침
      } else {
        showError("상담 기록 삭제에 실패했습니다.");
      }
    } catch (err) {
      showError("상담 기록 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
      setConfirmTargetId(null);
    }
  }

  const canEdit = (consultation: Consultation) => {
    if (!user) return false;
    return (
      consultation.created_by_user_id === user.id ||
      user.publicMetadata?.role === "admin" ||
      user.publicMetadata?.role === "leader"
    );
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        open={!!confirmTargetId}
        title="상담 기록을 삭제하시겠습니까?"
        description="삭제 후에는 되돌릴 수 없습니다."
        confirmLabel="삭제"
        loading={deletingId !== null}
        onCancel={() => {
          if (deletingId === null) {
            setConfirmTargetId(null);
          }
        }}
        onConfirm={handleDelete}
      />

      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">상담 기록</h2>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + 새 상담 기록
            </button>
          )}
        </div>

        {/* 타임라인 */}
        {consultations.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-600">등록된 상담 기록이 없습니다.</p>
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                첫 상담 기록 등록하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => {
              const soap = parseTextToSOAP(consultation.content || "");
              const hasSOAP = !!(soap.subjective || soap.objective || soap.assessment || soap.plan);

              return (
                <div
                  key={consultation.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {consultation.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {new Date(consultation.record_date).toLocaleDateString("ko-KR")}
                        </span>
                      </div>

                      {/* SOAP 형식 표시 */}
                      {hasSOAP ? (
                        <div className="mt-4 space-y-3">
                          {soap.subjective && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">
                                S (Subjective - 주관적)
                              </h4>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                                {soap.subjective}
                              </p>
                            </div>
                          )}
                          {soap.objective && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">
                                O (Objective - 객관적)
                              </h4>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                                {soap.objective}
                              </p>
                            </div>
                          )}
                          {soap.assessment && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">
                                A (Assessment - 평가)
                              </h4>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                                {soap.assessment}
                              </p>
                            </div>
                          )}
                          {soap.plan && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">P (Plan - 계획)</h4>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                                {soap.plan}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        consultation.content && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                            {consultation.content}
                          </p>
                        )
                      )}

                      {/* 첨부파일 */}
                      {consultation.attachments && consultation.attachments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700">첨부파일</h4>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {consultation.attachments.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-700 underline"
                              >
                                파일 {index + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    {canEdit(consultation) && (
                      <div className="ml-4 flex gap-2">
                        <Link
                          href={`/clients/${clientId}/consultations/${consultation.id}/edit`}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => requestDelete(consultation.id)}
                          disabled={deletingId === consultation.id}
                          className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === consultation.id ? "삭제 중..." : "삭제"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
