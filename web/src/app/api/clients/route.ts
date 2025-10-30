import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientSchema } from "@/lib/validations/client";

/**
 * POST /api/clients
 * 새 대상자 등록
 * Sprint 1: CMS-US-01
 */
export async function POST(request: Request) {
  try {
    // 1. 인증 확인
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      auditLogger.error("client_create_unauthorized", {
        metadata: { reason: "No userId" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 역할 권한 확인 (admin, leader, specialist만 생성 가능)
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

    // 3. 요청 본문 파싱 및 검증
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
    const supabase = createSupabaseServerClient();

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

    // 5. 성공 감사 로그
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

    // 6. 성공 응답
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
 * 대상자 목록 조회 (검색, 필터, 정렬, 페이지네이션)
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

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    const supabase = createSupabaseServerClient();

    // 쿼리 빌더
    let query = supabase.from("clients").select("*", { count: "exact" });

    // 검색 (이름 또는 연락처)
    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_phone.ilike.%${search}%`);
    }

    // 상태 필터
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 페이지네이션
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

    return NextResponse.json({
      data: data || [],
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

