"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useUserRole } from "@/components/auth/ProtectedRoute";
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

/**
 * 맞춤제작 요청 상세 페이지
 * Phase 10: CDM-US-02
 */

export default function CustomizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useUserRole();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [customization, setCustomization] = useState<CustomizationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "stages">("overview");
  const [stages, setStages] = useState<CustomizationStage[]>([]);

  const customizationId = params.id as string;
  const canEdit = hasRole(["admin", "leader", "specialist", "technician"]);
  const canDelete = hasRole(["admin", "leader"]);

  useEffect(() => {
    fetchCustomization();
    fetchStages();
  }, [customizationId]);

  async function fetchCustomization() {
    try {
      const response = await fetch(`/api/customization-requests/${customizationId}`);
      if (response.ok) {
        const data = (await response.json()) as CustomizationDetail;
        setCustomization(data);
      } else {
        showError("맞춤제작 요청 정보를 불러올 수 없습니다.");
      }
    } catch (err) {
      showError("맞춤제작 요청 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStages() {
    try {
      const response = await fetch(`/api/customization-requests/${customizationId}/stages`);
      if (response.ok) {
        const data = (await response.json()) as { data?: CustomizationStage[] };
        setStages(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) {
      console.error("단계 히스토리 조회 실패:", err);
    }
  }

  async function handleDelete() {
    if (!confirm("정말 이 맞춤제작 요청을 취소하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/customization-requests/${customizationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        success("맞춤제작 요청이 취소되었습니다.");
        setTimeout(() => {
          router.push("/customization-requests");
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

  if (!customization) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">맞춤제작 요청을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; class: string }> = {
    requested: { label: "요청됨", class: "bg-blue-100 text-blue-700" },
    designing: { label: "설계중", class: "bg-yellow-100 text-yellow-700" },
    prototyping: { label: "시제품 제작중", class: "bg-orange-100 text-orange-700" },
    fitting: { label: "착용 테스트", class: "bg-purple-100 text-purple-700" },
    completed: { label: "완료", class: "bg-green-100 text-green-700" },
    cancelled: { label: "취소됨", class: "bg-red-100 text-red-700" },
  };

  const statusInfo = statusMap[customization.status] || {
    label: customization.status,
    class: "bg-gray-100 text-gray-700",
  };

  const client = customization.clients ?? null;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customization.title}</h1>
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
              <Link
                href={`/customization-requests/${customizationId}/edit`}
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

        {/* 상태 배지 */}
        <div>
          <span
            className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${statusInfo.class}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* 탭 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              개요
            </button>
            <button
              onClick={() => setActiveTab("stages")}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === "stages"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              단계 추적
            </button>
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">기본 정보</h2>
              <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">제작 목적</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customization.purpose || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">요청일</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {customization.requested_date
                      ? new Date(customization.requested_date).toLocaleDateString("ko-KR")
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">예상 완료일</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {customization.expected_completion_date
                      ? new Date(customization.expected_completion_date).toLocaleDateString("ko-KR")
                      : "-"}
                  </dd>
                </div>
                {customization.completed_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">완료일</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(customization.completed_date).toLocaleDateString("ko-KR")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* 치수 정보 */}
            {(customization.height_cm ||
              customization.width_cm ||
              customization.depth_cm ||
              customization.weight_kg) && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">치수 정보</h2>
                <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {customization.height_cm && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">높이</dt>
                      <dd className="mt-1 text-sm text-gray-900">{customization.height_cm} cm</dd>
                    </div>
                  )}
                  {customization.width_cm && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">너비</dt>
                      <dd className="mt-1 text-sm text-gray-900">{customization.width_cm} cm</dd>
                    </div>
                  )}
                  {customization.depth_cm && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">깊이</dt>
                      <dd className="mt-1 text-sm text-gray-900">{customization.depth_cm} cm</dd>
                    </div>
                  )}
                  {customization.weight_kg && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">무게</dt>
                      <dd className="mt-1 text-sm text-gray-900">{customization.weight_kg} kg</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* 재료 */}
            {customization.materials && customization.materials.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">재료</h2>
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
              </div>
            )}

            {/* 설명 및 특수 요구사항 */}
            {(customization.description || customization.special_requirements) && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">상세 정보</h2>
                {customization.description && (
                  <div className="mb-4">
                    <dt className="text-sm font-medium text-gray-500">설명</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                      {customization.description}
                    </dd>
                  </div>
                )}
                {customization.special_requirements && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">특수 요구사항</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                      {customization.special_requirements}
                    </dd>
                  </div>
                )}
              </div>
            )}

            {/* 설계 파일 */}
            {customization.design_files && customization.design_files.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">설계 파일</h2>
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
              </div>
            )}

            {/* 메모 */}
            {customization.notes && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">메모</h2>
                <p className="whitespace-pre-wrap text-sm text-gray-900">{customization.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "stages" && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">단계 히스토리</h2>
            {stages.length === 0 ? (
              <p className="text-gray-500">단계 기록이 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="border-l-4 border-blue-500 pl-4"
                    style={{ borderLeftColor: getStageColor(stage.stage) }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getStageLabel(stage.stage)}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {new Date(stage.stage_date).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                    </div>
                    {stage.notes && <p className="mt-2 text-sm text-gray-700">{stage.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
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
    requested: "#3b82f6", // blue
    designing: "#eab308", // yellow
    prototyping: "#f97316", // orange
    fitting: "#a855f7", // purple
    completed: "#22c55e", // green
    cancelled: "#ef4444", // red
  };
  return map[stage] || "#6b7280"; // gray
}
