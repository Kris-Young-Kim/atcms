import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/clients/[id]/activities
 * 대상자 통합 활동 조회 API
 *
 * **권한**: `admin`, `leader`, `specialist`, `technician`, `socialWorker`
 *
 * **설명:**
 * 대상자의 모든 활동(상담 기록, 맞춤제작 요청, 대여 기록, 일정)을 통합하여 조회합니다.
 * 활동 타입별로 필터링 가능하며, 날짜순으로 정렬됩니다.
 *
 * **쿼리 파라미터:**
 * - `activity_type`: 활동 유형 필터 (`consultation`, `assessment`, `customization`, `rental`, `schedule`, `all`)
 * - `start_date`: 시작 날짜 필터 (이 날짜 이후)
 * - `end_date`: 종료 날짜 필터 (이 날짜 이전)
 * - `page`: 페이지 번호 (기본값: 1)
 * - `limit`: 페이지당 항목 수 (기본값: 25)
 *
 * **응답:**
 * ```json
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "type": "consultation",
 *       "title": "상담 기록",
 *       "date": "2025-11-02",
 *       "metadata": {...}
 *     },
 *     ...
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 25,
 *     "total": 100,
 *     "totalPages": 4
 *   }
 * }
 * ```
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const activityType = searchParams.get("activity_type") || "all";
    const startDate = searchParams.get("start_date") || undefined;
    const endDate = searchParams.get("end_date") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const offset = (page - 1) * limit;

    const supabase = await createSupabaseServerClient();

    // 대상자 존재 확인
    const { data: clientExists } = await supabase.from("clients").select("id, name").eq("id", id).single();

    if (!clientExists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 모든 활동 타입별로 조회
    const activities: Array<{
      id: string;
      type: string;
      title: string;
      date: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }> = [];

    // 1. 상담 및 평가 기록 조회
    if (activityType === "all" || activityType === "consultation" || activityType === "assessment") {
      let serviceQuery = supabase
        .from("service_records")
        .select("id, record_type, title, record_date, content, created_at")
        .eq("client_id", id);

      if (activityType === "consultation") {
        serviceQuery = serviceQuery.eq("record_type", "consultation");
      } else if (activityType === "assessment") {
        serviceQuery = serviceQuery.eq("record_type", "assessment");
      }

      if (startDate) {
        serviceQuery = serviceQuery.gte("record_date", startDate);
      }
      if (endDate) {
        serviceQuery = serviceQuery.lte("record_date", endDate);
      }

      const { data: serviceRecords } = await serviceQuery.order("record_date", { ascending: false });

      if (serviceRecords) {
        serviceRecords.forEach((record) => {
          activities.push({
            id: record.id,
            type: record.record_type,
            title: record.title,
            date: record.record_date,
            metadata: {
              content: record.content,
            },
            created_at: record.created_at,
          });
        });
      }
    }

    // 2. 맞춤제작 요청 조회
    if (activityType === "all" || activityType === "customization") {
      let customizationQuery = supabase
        .from("customization_requests")
        .select("id, title, status, requested_date, description, created_at")
        .eq("client_id", id);

      if (startDate) {
        customizationQuery = customizationQuery.gte("requested_date", startDate);
      }
      if (endDate) {
        customizationQuery = customizationQuery.lte("requested_date", endDate);
      }

      const { data: customizations } = await customizationQuery.order("requested_date", { ascending: false });

      if (customizations) {
        customizations.forEach((customization) => {
          activities.push({
            id: customization.id,
            type: "customization",
            title: customization.title,
            date: customization.requested_date,
            metadata: {
              status: customization.status,
              description: customization.description,
            },
            created_at: customization.created_at,
          });
        });
      }
    }

    // 3. 대여 기록 조회
    if (activityType === "all" || activityType === "rental") {
      let rentalQuery = supabase
        .from("rentals")
        .select("id, equipment_id, rental_date, return_date, status, quantity, created_at")
        .eq("client_id", id);

      if (startDate) {
        rentalQuery = rentalQuery.gte("rental_date", startDate);
      }
      if (endDate) {
        rentalQuery = rentalQuery.lte("rental_date", endDate);
      }

      const { data: rentals } = await rentalQuery.order("rental_date", { ascending: false });

      if (rentals) {
        const equipmentIds = rentals.map((r) => r.equipment_id).filter(Boolean);
        let equipmentMap: Record<string, { name: string }> = {};

        if (equipmentIds.length > 0) {
          const { data: equipmentList } = await supabase
            .from("equipment")
            .select("id, name")
            .in("id", equipmentIds);

          if (equipmentList) {
            equipmentList.forEach((eq) => {
              equipmentMap[eq.id] = { name: eq.name };
            });
          }
        }

        rentals.forEach((rental) => {
          activities.push({
            id: rental.id,
            type: "rental",
            title: equipmentMap[rental.equipment_id]?.name || "기기 대여",
            date: rental.rental_date,
            metadata: {
              status: rental.status,
              quantity: rental.quantity,
              return_date: rental.return_date,
            },
            created_at: rental.created_at,
          });
        });
      }
    }

    // 4. 일정 조회
    if (activityType === "all" || activityType === "schedule") {
      let scheduleQuery = supabase
        .from("schedules")
        .select("id, schedule_type, title, start_time, status, description, created_at")
        .eq("client_id", id);

      if (activityType === "schedule") {
        // schedule 필터는 모든 일정 유형 포함
      }

      if (startDate) {
        scheduleQuery = scheduleQuery.gte("start_time", startDate);
      }
      if (endDate) {
        scheduleQuery = scheduleQuery.lte("start_time", endDate);
      }

      const { data: schedules } = await scheduleQuery.order("start_time", { ascending: false });

      if (schedules) {
        schedules.forEach((schedule) => {
          const scheduleDate = new Date(schedule.start_time).toISOString().split("T")[0];
          activities.push({
            id: schedule.id,
            type: `schedule_${schedule.schedule_type}`,
            title: schedule.title,
            date: scheduleDate,
            metadata: {
              schedule_type: schedule.schedule_type,
              status: schedule.status,
              start_time: schedule.start_time,
              description: schedule.description,
            },
            created_at: schedule.created_at,
          });
        });
      }
    }

    // 날짜순 정렬 (최신순)
    activities.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // 전체 개수
    const total = activities.length;

    // 페이지네이션 적용
    const paginatedActivities = activities.slice(offset, offset + limit);

    auditLogger.info("client_activities_viewed", {
      actorId: userId,
      metadata: {
        clientId: id,
        clientName: clientExists.name,
        activityType,
        totalActivities: total,
      },
    });

    return NextResponse.json({
      data: paginatedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    auditLogger.error("client_activities_fetch_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

