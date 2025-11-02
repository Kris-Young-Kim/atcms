"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ScheduleForm } from "@/components/schedules/ScheduleForm";
import type { Schedule } from "@/lib/validations/schedule";

/**
 * 일정 수정 페이지
 * Phase 10: SCH-US-02
 */

export default function EditSchedulePage() {
  const params = useParams();
  const scheduleId = params.id as string;

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [scheduleId]);

  async function fetchSchedule() {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`);
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      }
    } catch (error) {
      console.error("일정 정보 조회 실패:", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">일정 수정</h1>
        <p className="mt-2 text-sm text-gray-600">
          {schedule.title}의 정보를 수정합니다. 필수 항목은 <span className="text-red-500">*</span>
          로 표시됩니다.
        </p>
      </div>

      <ScheduleForm
        initialData={schedule}
        scheduleId={scheduleId}
        mode="edit"
        clientId={schedule.client_id || undefined}
        rentalId={schedule.rental_id || undefined}
        customizationRequestId={schedule.customization_request_id || undefined}
      />
    </div>
  );
}
