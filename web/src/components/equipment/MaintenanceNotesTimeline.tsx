"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useUserRole } from "@/components/auth/ProtectedRoute";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import type { MaintenanceNote } from "@/lib/validations/maintenance-note";
import { MAINTENANCE_TYPE_LABELS } from "@/lib/validations/maintenance-note";

/**
 * 유지보수 노트 타임라인 컴포넌트
 * Sprint 1: ERM-US-03
 */

interface MaintenanceNotesTimelineProps {
  equipmentId: string;
  onCreateNew?: () => void;
}

export function MaintenanceNotesTimeline({
  equipmentId,
  onCreateNew,
}: MaintenanceNotesTimelineProps) {
  const router = useRouter();
  const { hasRole } = useUserRole();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [notes, setNotes] = useState<MaintenanceNote[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreate = hasRole(["admin", "leader", "technician"]);

  useEffect(() => {
    fetchNotes();
  }, [equipmentId]);

  async function fetchNotes() {
    try {
      setLoading(true);
      const response = await fetch(`/api/equipment/${equipmentId}/maintenance-notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.data || []);
      } else {
        showError("유지보수 노트를 불러올 수 없습니다.");
      }
    } catch (err) {
      showError("유지보수 노트 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500">유지보수 노트를 불러오는 중...</div>;
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">유지보수 기록</h2>
          {canCreate && onCreateNew && (
            <button
              onClick={onCreateNew}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              + 새 유지보수 노트 작성
            </button>
          )}
        </div>

        {notes.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
            등록된 유지보수 노트가 없습니다.
          </div>
        ) : (
          <div className="relative border-l border-gray-200">
            {notes.map((note) => (
              <div key={note.id} className="mb-10 ml-6">
                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 ring-8 ring-white">
                  <svg
                    className="h-4 w-4 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </span>
                <h3 className="mb-1 flex items-center text-lg font-semibold text-gray-900">
                  {note.title}
                  {note.maintenance_type && (
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {
                        MAINTENANCE_TYPE_LABELS[
                          note.maintenance_type as keyof typeof MAINTENANCE_TYPE_LABELS
                        ]
                      }
                    </span>
                  )}
                  <time className="ml-3 text-sm font-normal text-gray-500">
                    {note.note_date
                      ? new Date(note.note_date).toLocaleDateString("ko-KR")
                      : new Date(note.created_at).toLocaleDateString("ko-KR")}
                  </time>
                </h3>
                {note.content && (
                  <p className="mb-2 text-base font-normal text-gray-700 whitespace-pre-wrap">
                    {note.content}
                  </p>
                )}
                {note.cost && (
                  <p className="mb-2 text-sm text-gray-600">비용: {note.cost.toLocaleString()}원</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
