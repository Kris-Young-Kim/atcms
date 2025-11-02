"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

import { useToast, ToastContainer } from "@/components/ui/Toast";
import type { Assessment } from "@/lib/validations/assessment";
import { ASSESSMENT_TYPE_LABELS, getScoreLevel } from "@/lib/validations/assessment";

/**
 * 평가 기록 타임라인 컴포넌트
 * Sprint 1: CMS-US-05
 */

interface AssessmentTimelineProps {
  clientId: string;
  onCreateNew?: () => void;
}

export function AssessmentTimeline({ clientId, onCreateNew }: AssessmentTimelineProps) {
  const { user } = useUser();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, [clientId]);

  async function fetchAssessments() {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}/assessments`);
      if (response.ok) {
        const data = await response.json();
        // content를 파싱하여 Assessment 타입으로 변환
        const parsedData = (data.data || []).map((item: Assessment & { content?: string }) => {
          if (item.content) {
            try {
              const parsed = JSON.parse(item.content);
              return {
                ...item,
                assessment_type: parsed.assessment_type || item.assessment_type,
                items: parsed.items || [],
                total_score: parsed.total_score || item.total_score,
                summary: parsed.summary || item.summary,
              };
            } catch {
              return item;
            }
          }
          return item;
        });
        setAssessments(parsedData);
      } else {
        showError("평가 기록을 불러올 수 없습니다.");
      }
    } catch (err) {
      showError("평가 기록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(assessmentId: string) {
    if (!confirm("정말 이 평가 기록을 삭제하시겠습니까?")) {
      return;
    }

    setDeletingId(assessmentId);
    try {
      const response = await fetch(`/api/clients/${clientId}/assessments/${assessmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        success("평가 기록이 삭제되었습니다.");
        fetchAssessments(); // 목록 새로고침
      } else {
        showError("평가 기록 삭제에 실패했습니다.");
      }
    } catch (err) {
      showError("평가 기록 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  const canEdit = (assessment: Assessment) => {
    if (!user) return false;
    return (
      assessment.created_by_user_id === user.id ||
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

      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">평가 기록</h2>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + 새 평가 기록
            </button>
          )}
        </div>

        {/* 타임라인 */}
        {assessments.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-600">등록된 평가 기록이 없습니다.</p>
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                첫 평가 기록 등록하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment) => {
              const scoreLevel = assessment.total_score
                ? getScoreLevel(assessment.total_score)
                : { level: "-", color: "text-gray-600" };

              return (
                <div
                  key={assessment.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                          {ASSESSMENT_TYPE_LABELS[assessment.assessment_type]}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(assessment.record_date).toLocaleDateString("ko-KR")}
                        </span>
                      </div>

                      {/* 전체 점수 */}
                      {assessment.total_score !== undefined && (
                        <div className="mt-4 flex items-center gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-700">전체 점수: </span>
                            <span className={`text-lg font-bold ${scoreLevel.color}`}>
                              {assessment.total_score} / 5.0
                            </span>
                            <span className={`ml-2 text-sm ${scoreLevel.color}`}>({scoreLevel.level})</span>
                          </div>
                        </div>
                      )}

                      {/* 평가 항목 목록 */}
                      {assessment.items && assessment.items.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700">평가 항목</h4>
                          <ul className="mt-2 space-y-2">
                            {assessment.items.map((item, index) => (
                              <li key={item.id || index} className="flex items-center gap-4 text-sm">
                                <span className="flex-1 text-gray-900">{item.question}</span>
                                <span className="text-gray-600">
                                  점수: <span className="font-medium">{item.score} / 5</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 요약 */}
                      {assessment.summary && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700">요약</h4>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{assessment.summary}</p>
                        </div>
                      )}

                      {/* PDF 첨부 */}
                      {assessment.pdf_attachment && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700">PDF 첨부</h4>
                          <a
                            href={assessment.pdf_attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 underline"
                          >
                            PDF 다운로드
                          </a>
                        </div>
                      )}

                      {/* 기타 첨부파일 */}
                      {assessment.attachments && assessment.attachments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700">첨부파일</h4>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {assessment.attachments.map((url, index) => (
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
                    {canEdit(assessment) && (
                      <div className="ml-4 flex gap-2">
                        <Link
                          href={`/clients/${clientId}/assessments/${assessment.id}/edit`}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => handleDelete(assessment.id)}
                          disabled={deletingId === assessment.id}
                          className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === assessment.id ? "삭제 중..." : "삭제"}
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

