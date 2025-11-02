import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/search/activities
 * 통합 활동 검색 API
 *
 * **권한**: `admin`, `leader`, `specialist`, `technician`, `socialWorker`
 *
 * **설명:**
 * 대상자 이름, 활동 유형, 날짜 범위, 담당자 등을 기준으로 모든 활동을 통합 검색합니다.
 * 상담, 평가, 대여, 맞춤제작, 일정을 모두 검색하며, 활동 유형별로 그룹화하여 반환합니다.
 *
 * **쿼리 파라미터:**
 * - `query`: 검색어 (대상자 이름 또는 활동 제목)
 * - `activity_type`: 활동 유형 필터 (`consultation`, `assessment`, `customization`, `rental`, `schedule`, `all`)
 * - `start_date`: 시작 날짜 필터 (이 날짜 이후)
 * - `end_date`: 종료 날짜 필터 (이 날짜 이전)
 * - `created_by_user_id`: 담당자 ID 필터 (Clerk User ID)
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
 *       "client_id": "uuid",
 *       "client_name": "대상자 이름",
 *       "metadata": {...},
 *       "created_at": "2025-11-02T10:00:00Z"
 *     },
 *     ...
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 25,
 *     "total": 100,
 *     "totalPages": 4
 *   },
 *   "grouped": {
 *     "consultation": 5,
 *     "assessment": 3,
 *     "rental": 2,
 *     "customization": 1,
 *     "schedule": 4
 *   }
 * }
 * ```
 *
 * Phase 10: 통합 대상자 관리
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const activityType = searchParams.get("activity_type") || "all";
    const startDate = searchParams.get("start_date") || undefined;
    const endDate = searchParams.get("end_date") || undefined;
    const createdByUserId = searchParams.get("created_by_user_id") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const offset = (page - 1) * limit;

    const supabase = await createSupabaseServerClient();

    // 모든 활동을 저장할 배열
    const activities: Array<{
      id: string;
      type: string;
      title: string;
      date: string;
      client_id: string;
      client_name: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }> = [];

    // 1. 상담 및 평가 기록 검색
    if (activityType === "all" || activityType === "consultation" || activityType === "assessment") {
      let serviceQuery = supabase
        .from("service_records")
        .select(
          `
          id,
          record_type,
          title,
          record_date,
          content,
          created_at,
          created_by_user_id,
          clients:client_id (
            id,
            name
          )
        `,
        );

      // 활동 유형 필터
      if (activityType === "consultation") {
        serviceQuery = serviceQuery.eq("record_type", "consultation");
      } else if (activityType === "assessment") {
        serviceQuery = serviceQuery.eq("record_type", "assessment");
      }

      // 검색어 필터 (제목에 검색어가 포함된 경우)
      // 대상자 이름 검색은 별도로 처리
      if (query) {
        serviceQuery = serviceQuery.ilike("title", `%${query}%`);
      }

      // 날짜 필터
      if (startDate) {
        serviceQuery = serviceQuery.gte("record_date", startDate);
      }
      if (endDate) {
        serviceQuery = serviceQuery.lte("record_date", endDate);
      }

      // 담당자 필터
      if (createdByUserId) {
        serviceQuery = serviceQuery.eq("created_by_user_id", createdByUserId);
      }

      // 정렬
      serviceQuery = serviceQuery.order("record_date", { ascending: false });

      const { data: serviceRecords } = await serviceQuery;

      if (serviceRecords) {
        // 대상자 이름으로 추가 검색 (필요한 경우)
        let filteredRecords = serviceRecords;
        if (query && serviceRecords.length > 0) {
          // 대상자 이름으로 필터링
          const clientIds = serviceRecords.map((r: any) => r.clients?.id).filter(Boolean);
          if (clientIds.length > 0) {
            const { data: matchingClients } = await supabase
              .from("clients")
              .select("id, name")
              .in("id", clientIds)
              .ilike("name", `%${query}%`);

            if (matchingClients) {
              const matchingClientIds = new Set(matchingClients.map((c) => c.id));
              filteredRecords = serviceRecords.filter((r: any) => {
                // 제목에 검색어가 포함되거나 대상자 이름에 검색어가 포함된 경우
                return (
                  r.title.toLowerCase().includes(query.toLowerCase()) ||
                  (r.clients && matchingClientIds.has(r.clients.id))
                );
              });
            }
          }
        }

        filteredRecords.forEach((record: any) => {
          if (record.clients) {
            activities.push({
              id: record.id,
              type: record.record_type,
              title: record.title,
              date: record.record_date,
              client_id: record.clients.id,
              client_name: record.clients.name,
              metadata: {
                content: record.content,
              },
              created_at: record.created_at,
            });
          }
        });
      }
    }

    // 2. 맞춤제작 요청 검색
    if (activityType === "all" || activityType === "customization") {
      let customizationQuery = supabase
        .from("customization_requests")
        .select(
          `
          id,
          title,
          status,
          requested_date,
          description,
          created_at,
          created_by_user_id,
          clients:client_id (
            id,
            name
          )
        `,
        );

      // 검색어 필터 (제목)
      if (query) {
        customizationQuery = customizationQuery.ilike("title", `%${query}%`);
      }

      // 날짜 필터
      if (startDate) {
        customizationQuery = customizationQuery.gte("requested_date", startDate);
      }
      if (endDate) {
        customizationQuery = customizationQuery.lte("requested_date", endDate);
      }

      // 담당자 필터
      if (createdByUserId) {
        customizationQuery = customizationQuery.eq("created_by_user_id", createdByUserId);
      }

      // 정렬
      customizationQuery = customizationQuery.order("requested_date", { ascending: false });

      const { data: customizations } = await customizationQuery;

      if (customizations) {
        // 대상자 이름으로 추가 검색 (필요한 경우)
        let filteredCustomizations = customizations;
        if (query && customizations.length > 0) {
          const clientIds = customizations.map((c: any) => c.clients?.id).filter(Boolean);
          if (clientIds.length > 0) {
            const { data: matchingClients } = await supabase
              .from("clients")
              .select("id, name")
              .in("id", clientIds)
              .ilike("name", `%${query}%`);

            if (matchingClients) {
              const matchingClientIds = new Set(matchingClients.map((c) => c.id));
              filteredCustomizations = customizations.filter((c: any) => {
                return (
                  c.title.toLowerCase().includes(query.toLowerCase()) ||
                  (c.clients && matchingClientIds.has(c.clients.id))
                );
              });
            }
          }
        }

        filteredCustomizations.forEach((customization: any) => {
          if (customization.clients) {
            activities.push({
              id: customization.id,
              type: "customization",
              title: customization.title,
              date: customization.requested_date,
              client_id: customization.clients.id,
              client_name: customization.clients.name,
              metadata: {
                status: customization.status,
                description: customization.description,
              },
              created_at: customization.created_at,
            });
          }
        });
      }
    }

    // 3. 대여 기록 검색
    if (activityType === "all" || activityType === "rental") {
      let rentalQuery = supabase
        .from("rentals")
        .select(
          `
          id,
          equipment_id,
          rental_date,
          return_date,
          status,
          quantity,
          created_at,
          created_by_user_id,
          clients:client_id (
            id,
            name
          ),
          equipment:equipment_id (
            id,
            name
          )
        `,
        );

      // 날짜 필터
      if (startDate) {
        rentalQuery = rentalQuery.gte("rental_date", startDate);
      }
      if (endDate) {
        rentalQuery = rentalQuery.lte("rental_date", endDate);
      }

      // 담당자 필터
      if (createdByUserId) {
        rentalQuery = rentalQuery.eq("created_by_user_id", createdByUserId);
      }

      // 정렬
      rentalQuery = rentalQuery.order("rental_date", { ascending: false });

      const { data: rentals } = await rentalQuery;

      if (rentals) {
        // 검색어 필터 적용 (대상자 이름 또는 기기 이름)
        let filteredRentals = rentals;
        if (query && rentals.length > 0) {
          const clientIds = rentals.map((r: any) => r.clients?.id).filter(Boolean);
          const equipmentIds = rentals.map((r: any) => r.equipment_id).filter(Boolean);

          // 대상자 이름 검색
          const { data: matchingClients } = clientIds.length > 0
            ? await supabase
                .from("clients")
                .select("id, name")
                .in("id", clientIds)
                .ilike("name", `%${query}%`)
            : { data: null };

          // 기기 이름 검색
          const { data: matchingEquipment } = equipmentIds.length > 0
            ? await supabase
                .from("equipment")
                .select("id, name")
                .in("id", equipmentIds)
                .ilike("name", `%${query}%`)
            : { data: null };

          const matchingClientIds = new Set(matchingClients?.map((c) => c.id) || []);
          const matchingEquipmentIds = new Set(matchingEquipment?.map((e) => e.id) || []);

          filteredRentals = rentals.filter((r: any) => {
            return (
              (r.clients && matchingClientIds.has(r.clients.id)) ||
              (r.equipment_id && matchingEquipmentIds.has(r.equipment_id))
            );
          });
        }

        filteredRentals.forEach((rental: any) => {
          if (rental.clients) {
            activities.push({
              id: rental.id,
              type: "rental",
              title: rental.equipment?.name || "기기 대여",
              date: rental.rental_date,
              client_id: rental.clients.id,
              client_name: rental.clients.name,
              metadata: {
                status: rental.status,
                quantity: rental.quantity,
                return_date: rental.return_date,
              },
              created_at: rental.created_at,
            });
          }
        });
      }
    }

    // 4. 일정 검색
    if (activityType === "all" || activityType === "schedule") {
      let scheduleQuery = supabase
        .from("schedules")
        .select(
          `
          id,
          schedule_type,
          title,
          start_time,
          status,
          description,
          created_at,
          created_by_user_id,
          clients:client_id (
            id,
            name
          )
        `,
        )
        .not("client_id", "is", null); // client_id가 있는 일정만

      // 검색어 필터 (제목)
      if (query) {
        scheduleQuery = scheduleQuery.ilike("title", `%${query}%`);
      }

      // 날짜 필터
      if (startDate) {
        scheduleQuery = scheduleQuery.gte("start_time", startDate);
      }
      if (endDate) {
        scheduleQuery = scheduleQuery.lte("start_time", endDate);
      }

      // 담당자 필터
      if (createdByUserId) {
        scheduleQuery = scheduleQuery.eq("created_by_user_id", createdByUserId);
      }

      // 정렬
      scheduleQuery = scheduleQuery.order("start_time", { ascending: false });

      const { data: schedules } = await scheduleQuery;

      if (schedules) {
        // 대상자 이름으로 추가 검색 (필요한 경우)
        let filteredSchedules = schedules;
        if (query && schedules.length > 0) {
          const clientIds = schedules.map((s: any) => s.clients?.id).filter(Boolean);
          if (clientIds.length > 0) {
            const { data: matchingClients } = await supabase
              .from("clients")
              .select("id, name")
              .in("id", clientIds)
              .ilike("name", `%${query}%`);

            if (matchingClients) {
              const matchingClientIds = new Set(matchingClients.map((c) => c.id));
              filteredSchedules = schedules.filter((s: any) => {
                return (
                  s.title.toLowerCase().includes(query.toLowerCase()) ||
                  (s.clients && matchingClientIds.has(s.clients.id))
                );
              });
            }
          }
        }

        filteredSchedules.forEach((schedule: any) => {
          if (schedule.clients) {
            const scheduleDate = new Date(schedule.start_time).toISOString().split("T")[0];
            activities.push({
              id: schedule.id,
              type: `schedule_${schedule.schedule_type}`,
              title: schedule.title,
              date: scheduleDate,
              client_id: schedule.clients.id,
              client_name: schedule.clients.name,
              metadata: {
                schedule_type: schedule.schedule_type,
                status: schedule.status,
                start_time: schedule.start_time,
                description: schedule.description,
              },
              created_at: schedule.created_at,
            });
          }
        });
      }
    }

    // 날짜순 정렬 (최신순)
    activities.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // 활동 유형별 그룹화 통계
    const grouped: Record<string, number> = {};
    activities.forEach((activity) => {
      const baseType = activity.type.startsWith("schedule_")
        ? "schedule"
        : activity.type === "consultation" || activity.type === "assessment"
          ? activity.type
          : activity.type;
      grouped[baseType] = (grouped[baseType] || 0) + 1;
    });

    // 전체 개수
    const total = activities.length;

    // 페이지네이션 적용
    const paginatedActivities = activities.slice(offset, offset + limit);

    // 감사 로그 기록
    auditLogger.info("activities_searched", {
      actorId: userId,
      metadata: {
        query,
        activityType,
        totalResults: total,
        grouped,
      },
      tags: {
        module: "cms",
        action_type: "search",
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
      grouped,
    });
  } catch (error) {
    auditLogger.error("activities_search_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

