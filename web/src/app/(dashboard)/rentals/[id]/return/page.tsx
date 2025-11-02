"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { rentalReturnSchema, type RentalReturnData } from "@/lib/validations/rental";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { ProtectedRoute, useUserRole } from "@/components/auth/ProtectedRoute";
import { auditLogger } from "@/lib/logger/auditLogger";
import type { Rental } from "@/lib/validations/rental";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

/**
 * 대여 반납 처리 페이지
 * Sprint 1: ERM-US-02
 *
 * 접근 권한: admin, leader, technician만 가능
 */

function ReturnRentalPageContent({ rentalId }: { rentalId: string }) {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RentalReturnData>({
    resolver: zodResolver(rentalReturnSchema),
    defaultValues: {
      actual_return_date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    fetchRental();
  }, [rentalId]);

  async function fetchRental() {
    try {
      const response = await fetch(`/api/rentals/${rentalId}`);
      if (response.ok) {
        const data = await response.json();
        setRental(data);
      } else {
        showError("대여 기록을 불러올 수 없습니다.");
      }
    } catch (error) {
      showError("대여 기록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: RentalReturnData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/rentals/${rentalId}/return`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        success("반납이 성공적으로 처리되었습니다.");
        auditLogger.info("rental_returned_ui", {
          metadata: { rentalId, ...data },
        });
        setTimeout(() => {
          router.push(`/rentals/${rentalId}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "반납 처리에 실패했습니다.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "반납 처리 중 오류가 발생했습니다.";
      showError(errorMessage);
      auditLogger.error("rental_return_failed_ui", {
        error: err,
        metadata: { rentalId },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">대여 기록을 찾을 수 없습니다.</p>
      </div>
    );
  }

  if (rental.status !== "active") {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">
          {rental.status === "returned"
            ? "이미 반납 처리된 대여입니다."
            : "취소된 대여는 반납할 수 없습니다."}
        </p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">대여 반납 처리</h1>
          <p className="mt-2 text-sm text-gray-600">반납 정보를 입력하여 처리하세요.</p>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h2 className="text-sm font-medium text-gray-700">대여 정보</h2>
          <div className="mt-2 space-y-1 text-sm">
            <div>
              <span className="text-gray-500">기기:</span>
              <span className="ml-2 font-medium">{rental.equipment?.name || "-"}</span>
            </div>
            <div>
              <span className="text-gray-500">대상자:</span>
              <span className="ml-2 font-medium">{rental.client?.name || "-"}</span>
            </div>
            <div>
              <span className="text-gray-500">대여일:</span>
              <span className="ml-2 font-medium">
                {rental.rental_date
                  ? new Date(rental.rental_date).toLocaleDateString("ko-KR")
                  : "-"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">수량:</span>
              <span className="ml-2 font-medium">{rental.quantity || 1}개</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">반납 정보</h2>
            <div className="grid grid-cols-1 gap-6">
              {/* 실제 반납일 */}
              <div>
                <label
                  htmlFor="actual_return_date"
                  className="block text-sm font-medium text-gray-700"
                >
                  실제 반납일
                </label>
                <input
                  {...register("actual_return_date")}
                  type="date"
                  id="actual_return_date"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.actual_return_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.actual_return_date.message}</p>
                )}
              </div>

              {/* 메모 */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  메모
                </label>
                <textarea
                  {...register("notes")}
                  id="notes"
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="반납 관련 메모를 입력하세요"
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "처리 중..." : "반납 처리"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function ReturnRentalPage() {
  const params = useParams();
  const rentalId = params.id as string;

  return (
    <ProtectedRoute requiredRole={["admin", "leader", "technician"]}>
      <ReturnRentalPageContent rentalId={rentalId} />
    </ProtectedRoute>
  );
}
