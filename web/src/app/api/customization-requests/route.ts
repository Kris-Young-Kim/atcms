import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  customizationRequestSchema,
  customizationRequestFilterSchema,
  type CustomizationRequestFilter,
} from "@/lib/validations/customization";

/**
 * POST /api/customization-requests
 *
 * 새 맞춤제작 요청 등록
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
 *   "client_id": "uuid",
 *   "title": "맞춤 의자 제작",
 *   "height_cm": 45.5,
 *   "materials": ["플라스틱", "알루미늄"],
 *   ...
 * }
 * ```
 *
 * **응답:**
 * - `201 Created`: 성공 시 생성된 맞춤제작 요청 객체 반환
 * - `400 Bad Request`: 입력 검증 실패
 * - `401 Unauthorized`: 인증 실패
 * - `403 Forbidden`: 권한 없음
 * - `500 Internal Server Error`: 서버 오류
 */
export async function POST(request: Request) {
  try {
    // 1. 인증 확인: Clerk 세션에서 사용자 ID 추출
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      auditLogger.error("customization_request_create_unauthorized", {
        metadata: { reason: "No userId" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 역할 권한 확인: admin, leader, specialist, technician만 맞춤제작 요청 생성 가능
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist", "technician"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.error("customization_request_create_forbidden", {
        actorId: userId,
        metadata: { role: userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 3. 요청 본문 파싱 및 검증: Zod 스키마로 입력 데이터 검증
    const body = await request.json();

    const validationResult = customizationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      auditLogger.error("customization_request_create_validation_failed", {
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

    // 4. 대상자 존재 확인
    const supabase = await createSupabaseServerClient();
    const { data: clientExists } = await supabase.from("clients").select("id").eq("id", validated.client_id).single();

    if (!clientExists) {
      auditLogger.error("customization_request_create_client_not_found", {
        actorId: userId,
        metadata: { clientId: validated.client_id },
      });
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 5. Supabase에 데이터 저장
    const { data, error } = await supabase
      .from("customization_requests")
      .insert({
        ...validated,
        created_by_user_id: userId,
        updated_by_user_id: userId,
      })
      .select()
      .single();

    if (error) {
      auditLogger.error("customization_request_create_failed", {
        actorId: userId,
        metadata: { supabaseError: error.message, title: validated.title },
        error,
      });
      return NextResponse.json(
        { error: "Failed to create customization request", details: error.message },
        { status: 500 },
      );
    }

    // 6. 초기 단계 기록 생성 (requested 단계)
    const { error: stageError } = await supabase.from("customization_stages").insert({
      customization_request_id: data.id,
      stage: "requested",
      notes: "맞춤제작 요청 등록됨",
      stage_date: validated.requested_date || new Date().toISOString().split("T")[0],
      created_by_user_id: userId,
    });

    if (stageError) {
      auditLogger.error("customization_stage_create_failed", {
        actorId: userId,
        metadata: { requestId: data.id, supabaseError: stageError.message },
        error: stageError,
      });
      // 단계 기록 실패는 치명적이지 않으므로 계속 진행
    }

    // 7. 성공 감사 로그 기록
    auditLogger.info("customization_request_created", {
      actorId: userId,
      metadata: {
        requestId: data.id,
        clientId: validated.client_id,
        title: data.title,
        status: data.status,
      },
      tags: {
        module: "cdm",
        action_type: "create",
      },
    });

    // 8. 성공 응답 반환 (201 Created)
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    // 예외 처리
    auditLogger.error("customization_request_create_exception", {
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
 * GET /api/customization-requests
 *
 * 맞춤제작 요청 목록 조회 (검색, 필터, 정렬, 페이지네이션 지원)
 *
 * **권한**: `admin`, `leader`, `specialist`, `technician`, `socialWorker`
 *
 * **쿼리 파라미터:**
 * - `search`: 검색어 (제목 또는 대상자 이름)
 * - `status`: 상태 필터 (`requested`, `designing`, `prototyping`, `fitting`, `completed`, `cancelled`, `all`)
 * - `client_id`: 대상자 ID 필터
 * - `page`: 페이지 번호 (기본값: 1)
 * - `limit`: 페이지당 항목 수 (기본값: 25)
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
 */
export async function GET(request: Request) {
  try {
    // 인증 확인
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 역할 권한 확인
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist", "technician", "socialWorker"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 쿼리 파라미터 파싱 및 기본값 설정
    const { searchParams } = new URL(request.url);
    const filter: CustomizationRequestFilter = {
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as CustomizationRequestFilter["status"]) || "all",
      client_id: searchParams.get("client_id") || undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "25", 10),
    };

    // 필터 검증
    const validationResult = customizationRequestFilterSchema.safeParse(filter);
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

    // 쿼리 빌더 초기화: clients 테이블과 JOIN하여 대상자 이름도 함께 조회
    let query = supabase
      .from("customization_requests")
      .select(
        `
        *,
        clients:client_id (
          id,
          name
        )
      `,
        { count: "exact" },
      );

    // 검색 조건 추가: 제목에 검색어가 포함된 경우
    if (validatedFilter.search) {
      query = query.ilike("title", `%${validatedFilter.search}%`);
    }

    // 상태 필터 추가
    if (validatedFilter.status !== "all") {
      query = query.eq("status", validatedFilter.status);
    }

    // 대상자 필터 추가
    if (validatedFilter.client_id) {
      query = query.eq("client_id", validatedFilter.client_id);
    }

    // 정렬: 요청일 기준 내림차순 (최신순)
    query = query.order("requested_date", { ascending: false });

    // 페이지네이션
    query = query.range(offset, offset + validatedFilter.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      auditLogger.error("customization_requests_list_fetch_failed", {
        actorId: userId,
        metadata: { supabaseError: error.message },
        error,
      });
      return NextResponse.json({ error: "Failed to fetch customization requests" }, { status: 500 });
    }

    auditLogger.info("customization_requests_list_viewed", {
      actorId: userId,
      metadata: { count, search: validatedFilter.search, status: validatedFilter.status },
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
    auditLogger.error("customization_requests_list_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

