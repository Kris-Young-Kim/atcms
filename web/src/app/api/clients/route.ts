import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientSchema } from "@/lib/validations/client";

/**
 * POST /api/clients
 *
 * 새 대상자 등록
 *
 * **권한**: `admin`, `leader`, `specialist`만 가능
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
 *   "name": "홍길동",
 *   "contact_phone": "010-1234-5678",
 *   ...
 * }
 * ```
 *
 * **응답:**
 * - `201 Created`: 성공 시 생성된 대상자 객체 반환
 * - `400 Bad Request`: 입력 검증 실패
 * - `401 Unauthorized`: 인증 실패
 * - `403 Forbidden`: 권한 없음
 * - `500 Internal Server Error`: 서버 오류
 *
 * @see {@link https://github.com/Kris-Young-Kim/atcmp/blob/main/API_DOCS.md#post-apiclients API 문서}
 */
export async function POST(request: Request) {
  try {
    // 1. 인증 확인: Clerk 세션에서 사용자 ID 추출
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      auditLogger.error("client_create_unauthorized", {
        metadata: { reason: "No userId" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 역할 권한 확인: admin, leader, specialist만 대상자 생성 가능
    // socialWorker는 조회만 가능하며, technician은 CMS 모듈 접근 불가
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.error("client_create_forbidden", {
        actorId: userId,
        metadata: { role: userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 3. 요청 본문 파싱 및 검증: Zod 스키마로 입력 데이터 검증
    // 필수 필드(name) 및 형식 검증 수행
    const body = await request.json();

    const validationResult = clientSchema.safeParse(body);
    if (!validationResult.success) {
      auditLogger.error("client_create_validation_failed", {
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

    // 4. Supabase에 데이터 저장
    // created_by_user_id와 updated_by_user_id에 현재 사용자 ID 저장
    // .select().single()로 생성된 레코드를 즉시 반환받음
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("clients")
      .insert({
        ...validated,
        created_by_user_id: userId,
        updated_by_user_id: userId,
      })
      .select()
      .single();

    if (error) {
      auditLogger.error("client_create_failed", {
        actorId: userId,
        metadata: { supabaseError: error.message, clientName: validated.name },
        error,
      });
      return NextResponse.json(
        { error: "Failed to create client", details: error.message },
        { status: 500 },
      );
    }

    // 5. 성공 감사 로그 기록
    // 모든 CRUD 작업은 감사 로그에 기록하여 추적 가능하도록 함
    auditLogger.info("client_created", {
      actorId: userId,
      metadata: {
        clientId: data.id,
        clientName: data.name,
        status: data.status,
      },
      tags: {
        module: "cms",
        action_type: "create",
      },
    });

    // 6. 성공 응답 반환 (201 Created)
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    // 예외 처리
    auditLogger.error("client_create_exception", {
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
 * GET /api/clients
 *
 * 대상자 목록 조회 (검색, 필터, 정렬, 페이지네이션 지원)
 *
 * **권한**: `admin`, `leader`, `specialist`, `socialWorker`
 *
 * **쿼리 파라미터:**
 * - `search`: 검색어 (이름 또는 연락처)
 * - `status`: 상태 필터 (`active`, `inactive`, `discharged`, `all`)
 * - `page`: 페이지 번호 (기본값: 1)
 * - `limit`: 페이지당 항목 수 (기본값: 25)
 * - `sortBy`: 정렬 필드 (기본값: `created_at`)
 * - `sortOrder`: 정렬 순서 (`asc`, `desc`, 기본값: `desc`)
 *
 * **응답:**
 * ```json
 * {
 *   "data": [...],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 25,
 *     "total": 100,
 *     "totalPages": 4
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/Kris-Young-Kim/atcmp/blob/main/API_DOCS.md#get-apiclients API 문서}
 */
export async function GET(request: Request) {
  try {
    // 인증 확인
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 역할 권한 확인 (technician 제외)
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist", "socialWorker"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 쿼리 파라미터 파싱 및 기본값 설정
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 페이지네이션 오프셋 계산: (페이지 번호 - 1) × 페이지당 항목 수
    const offset = (page - 1) * limit;

    const supabase = await createSupabaseServerClient();

    // 활동 필터 파라미터 파싱
    const activityTypesParam = searchParams.get("activityTypes");
    const activityTypes = activityTypesParam
      ? activityTypesParam
          .split(",")
          .map((type) => type.trim())
          .filter(Boolean)
      : [];
    const minActivityCount = searchParams.get("minActivityCount");
    const maxActivityCount = searchParams.get("maxActivityCount");
    const activitySince = searchParams.get("activitySince");

    // 쿼리 빌더 초기화: count: "exact"로 전체 개수도 함께 조회
    let query = supabase.from("client_activity_overview").select("*", { count: "exact" });

    // 검색 조건 추가: 이름 또는 연락처에 검색어가 포함된 경우
    // ilike는 대소문자 구분 없는 부분 일치 검색
    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_phone.ilike.%${search}%`);
    }

    // 상태 필터 추가: "all"이 아닌 경우 특정 상태만 조회
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // 활동 유형 필터: 선택된 유형이 있는 경우 각 유형별로 1개 이상 활동이 있는 대상자만 포함
    activityTypes.forEach((type) => {
      if (type === "consultation") {
        query = query.gt("consultation_count", 0);
      } else if (type === "assessment") {
        query = query.gt("assessment_count", 0);
      } else if (type === "rental") {
        query = query.gt("active_rental_count", 0);
      } else if (type === "customization") {
        query = query.gt("active_customization_count", 0);
      }
    });

    // 활동 총합 범위 필터
    if (minActivityCount) {
      const minValue = Number.parseInt(minActivityCount, 10);
      if (!Number.isNaN(minValue)) {
        query = query.gte("total_activity_count", minValue);
      }
    }
    if (maxActivityCount) {
      const maxValue = Number.parseInt(maxActivityCount, 10);
      if (!Number.isNaN(maxValue)) {
        query = query.lte("total_activity_count", maxValue);
      }
    }

    // 최근 활동 필터 (해당 날짜 이후 활동이 있는 대상자)
    if (activitySince) {
      const sinceDate = new Date(activitySince);
      if (!Number.isNaN(sinceDate.getTime())) {
        query = query.gte("last_activity_at", sinceDate.toISOString());
      }
    }

    // 정렬: sortBy 필드 기준으로 정렬 (asc 또는 desc)
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 페이지네이션: range를 사용하여 특정 범위의 레코드만 조회
    // range(offset, offset + limit - 1): offset부터 offset+limit-1까지 (limit개)
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      auditLogger.error("clients_list_fetch_failed", {
        actorId: userId,
        metadata: { supabaseError: error.message },
        error,
      });
      return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
    }

    auditLogger.info("clients_list_viewed", {
      actorId: userId,
      metadata: { count, search, status, page },
    });

    const clientsWithSummary = (data || []).map((client) => {
      const {
        consultation_count,
        assessment_count,
        active_rental_count,
        active_customization_count,
        total_activity_count,
        last_activity_at,
        ...rest
      } = client as Record<string, unknown>;

      return {
        ...rest,
        activity_summary: {
          consultation_count: Number(consultation_count) || 0,
          assessment_count: Number(assessment_count) || 0,
          active_rental_count: Number(active_rental_count) || 0,
          active_customization_count: Number(active_customization_count) || 0,
          total_activity_count: Number(total_activity_count) || 0,
          last_activity_at: (last_activity_at as string | null) ?? null,
        },
      };
    });

    return NextResponse.json({
      data: clientsWithSummary,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    auditLogger.error("clients_list_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
