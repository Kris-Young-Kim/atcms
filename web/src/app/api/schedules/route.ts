import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  scheduleFilterSchema,
  scheduleSchema,
  type ScheduleFilter,
} from "@/lib/validations/schedule";

/**
 * POST /api/schedules
 *
 * 새 일정 등록
 *
 * **권한**: `admin`, `leader`, `specialist`, `technician`만 가능
 *
 * **처리 순서:**
 * 1. 인증 확인 (Clerk)
 * 2. 역할 권한 확인
 * 3. 입력 데이터 검증 (Zod)
 * 4. 데이터베이스 저장
 * 5. 감사 로그 기록
 *
 * **요청 본문:**
 * ```json
 * {
 *   "schedule_type": "consultation",
 *   "client_id": "uuid",
 *   "title": "상담 일정",
 *   "start_time": "2025-11-05T10:00:00Z",
 *   "end_time": "2025-11-05T11:00:00Z",
 *   ...
 * }
 * ```
 */
export async function POST(request: Request) {
  try {
    // 1. 인증 확인
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      auditLogger.error("schedule_create_unauthorized", {
        metadata: { reason: "No userId" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 역할 권한 확인
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist", "technician"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.error("schedule_create_forbidden", {
        actorId: userId,
        metadata: { role: userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 3. 요청 본문 파싱 및 검증
    const body = await request.json();

    const validationResult = scheduleSchema.safeParse(body);
    if (!validationResult.success) {
      auditLogger.error("schedule_create_validation_failed", {
        actorId: userId,
        metadata: { errors: validationResult.error.flatten().fieldErrors },
      });
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validated = validationResult.data;

    // 4. 관련 엔티티 존재 확인
    const supabase = await createSupabaseServerClient();

    if (validated.client_id) {
      const { data: clientExists } = await supabase
        .from("clients")
        .select("id")
        .eq("id", validated.client_id)
        .single();
      if (!clientExists) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }

    if (validated.rental_id) {
      const { data: rentalExists } = await supabase
        .from("rentals")
        .select("id")
        .eq("id", validated.rental_id)
        .single();
      if (!rentalExists) {
        return NextResponse.json({ error: "Rental not found" }, { status: 404 });
      }
    }

    if (validated.customization_request_id) {
      const { data: customizationExists } = await supabase
        .from("customization_requests")
        .select("id")
        .eq("id", validated.customization_request_id)
        .single();
      if (!customizationExists) {
        return NextResponse.json({ error: "Customization request not found" }, { status: 404 });
      }
    }

    // 5. Supabase에 데이터 저장
    const { data, error } = await supabase
      .from("schedules")
      .insert({
        ...validated,
        created_by_user_id: userId,
        updated_by_user_id: userId,
      })
      .select()
      .single();

    if (error) {
      auditLogger.error("schedule_create_failed", {
        actorId: userId,
        metadata: { supabaseError: error.message, title: validated.title },
        error,
      });
      return NextResponse.json(
        { error: "Failed to create schedule", details: error.message },
        { status: 500 },
      );
    }

    // 6. 성공 감사 로그 기록
    auditLogger.info("schedule_created", {
      actorId: userId,
      metadata: {
        scheduleId: data.id,
        scheduleType: data.schedule_type,
        title: data.title,
        startTime: data.start_time,
      },
      tags: {
        module: "sch",
        action_type: "create",
      },
    });

    // 7. 성공 응답 반환 (201 Created)
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    auditLogger.error("schedule_create_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      { error: "Internal server error", details: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/schedules
 *
 * 일정 목록 조회 (검색, 필터, 정렬, 페이지네이션 지원)
 *
 * **권한**: `admin`, `leader`, `specialist`, `technician`, `socialWorker`
 *
 * **쿼리 파라미터:**
 * - `schedule_type`: 일정 유형 필터 (`consultation`, `assessment`, `rental`, `customization`, `other`, `all`)
 * - `client_id`: 대상자 ID 필터
 * - `status`: 상태 필터 (`scheduled`, `completed`, `cancelled`, `no_show`, `all`)
 * - `start_date`: 시작 날짜 필터 (이 날짜 이후)
 * - `end_date`: 종료 날짜 필터 (이 날짜 이전)
 * - `assessment_type`: 평가 유형 필터 (`functional`, `environmental`, `needs`) - assessment 일정만 적용
 * - `page`: 페이지 번호 (기본값: 1)
 * - `limit`: 페이지당 항목 수 (기본값: 25)
 */
export async function GET(request: Request) {
  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 쿼리 파라미터 파싱 및 기본값 설정
    const { searchParams } = new URL(request.url);
    const isRecurringParam = searchParams.get("is_recurring");
    const includeInstancesParam = searchParams.get("include_instances");
    const recurrenceParentParam = searchParams.get("recurrence_parent_id");

    const isRecurring =
      isRecurringParam === null
        ? undefined
        : isRecurringParam === "true"
          ? true
          : isRecurringParam === "false"
            ? false
            : undefined;

    const includeInstances =
      includeInstancesParam === null ? true : includeInstancesParam !== "false";

    const rawFilter = {
      schedule_type:
        (searchParams.get("schedule_type") as ScheduleFilter["schedule_type"]) || "all",
      client_id: searchParams.get("client_id") || undefined,
      status: (searchParams.get("status") as ScheduleFilter["status"]) || "all",
      start_date: searchParams.get("start_date") || undefined,
      end_date: searchParams.get("end_date") || undefined,
      assessment_type:
        (searchParams.get("assessment_type") as
          | "functional"
          | "environmental"
          | "needs"
          | undefined) || undefined,
      is_recurring: isRecurring,
      recurrence_parent_id: recurrenceParentParam || undefined,
      include_instances: includeInstances,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "25", 10),
    };

    // 필터 검증
    const validationResult = scheduleFilterSchema.safeParse(rawFilter);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validatedFilter = validationResult.data;

    // 페이지네이션 오프셋 계산
    const offset = (validatedFilter.page - 1) * validatedFilter.limit;

    const supabase = await createSupabaseServerClient();

    // 쿼리 빌더 초기화
    let query = supabase.from("schedules").select("*", { count: "exact" });

    // 필터 적용
    if (validatedFilter.schedule_type !== "all") {
      query = query.eq("schedule_type", validatedFilter.schedule_type);
    }

    if (validatedFilter.client_id) {
      query = query.eq("client_id", validatedFilter.client_id);
    }

    if (validatedFilter.status !== "all") {
      query = query.eq("status", validatedFilter.status);
    }

    if (validatedFilter.is_recurring !== undefined) {
      query = query.eq("is_recurring", validatedFilter.is_recurring);
    }

    if (validatedFilter.recurrence_parent_id) {
      query = query.eq("recurrence_parent_id", validatedFilter.recurrence_parent_id);
    }

    if (!validatedFilter.include_instances) {
      query = query.is("recurrence_parent_id", null);
    }

    if (validatedFilter.start_date) {
      query = query.gte("start_time", validatedFilter.start_date);
    }

    if (validatedFilter.end_date) {
      query = query.lte("end_time", validatedFilter.end_date);
    }

    // 평가 일정 전용 필터: 평가 유형별 조회 (description 필드의 JSON에서 평가 유형 추출)
    if (validatedFilter.assessment_type && validatedFilter.schedule_type === "assessment") {
      // 평가 일정인 경우에만 평가 유형 필터 적용
      // description 필드에 JSON으로 저장된 assessment_type 검색
      query = query.like("description", `%"assessment_type":"${validatedFilter.assessment_type}"%`);
    }

    // 정렬: 시작 시간 기준 오름차순 (가까운 일정부터)
    query = query.order("start_time", { ascending: true });

    // 페이지네이션
    query = query.range(offset, offset + validatedFilter.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      auditLogger.error("schedules_list_fetch_failed", {
        actorId: userId,
        metadata: { supabaseError: error.message },
        error,
      });
      return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
    }

    auditLogger.info("schedules_list_viewed", {
      actorId: userId,
      metadata: {
        count,
        scheduleType: validatedFilter.schedule_type,
        isRecurring: validatedFilter.is_recurring,
        includeInstances: validatedFilter.include_instances,
      },
    });

    return NextResponse.json({
      data: data || [],
      pagination: {
        page: validatedFilter.page,
        limit: validatedFilter.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / validatedFilter.limit),
      },
    });
  } catch (error) {
    auditLogger.error("schedules_list_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
