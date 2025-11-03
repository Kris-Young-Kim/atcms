import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { equipmentSchema } from "@/lib/validations/equipment";

/**
 * GET /api/equipment
 * 기기 목록 조회
 * Sprint 1: ERM-US-01
 */
export async function GET(request: Request) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 역할 권한 확인 (technician 제외 모든 역할 가능)
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist", "socialWorker", "technician"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const supabase = await createSupabaseServerClient();
    let query = supabase.from("equipment").select("*");

    // 상태 필터
    if (status) {
      query = query.eq("status", status);
    }

    // 카테고리 필터
    if (category) {
      query = query.eq("category", category);
    }

    // 검색 필터 (기기명, 브랜드, 모델명)
    if (search) {
      query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`);
    }

    // 정렬 (최신순)
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      auditLogger.error("equipment_list_fetch_failed", {
        actorId: userId,
        metadata: { supabaseError: error.message },
        error,
      });
      return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
    }

    auditLogger.info("equipment_list_viewed", {
      actorId: userId,
      metadata: { count: data?.length || 0, filters: { status, category, search } },
    });

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    auditLogger.error("equipment_list_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/equipment
 * 새 기기 등록
 * Sprint 1: ERM-US-01
 */
export async function POST(request: Request) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      auditLogger.error("equipment_create_unauthorized", {
        metadata: { reason: "No userId" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 역할 권한 확인 (admin, leader, technician만 생성 가능)
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "technician"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.error("equipment_create_forbidden", {
        actorId: userId,
        metadata: { role: userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();

    const validationResult = equipmentSchema.safeParse(body);

    if (!validationResult.success) {
      auditLogger.error("equipment_create_validation_failed", {
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

    // 가용 수량 검증
    if (validated.available_quantity > validated.total_quantity) {
      return NextResponse.json(
        { error: "가용 수량은 전체 수량을 초과할 수 없습니다." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    // 기기 저장
    const { data, error } = await supabase
      .from("equipment")
      .insert({
        ...validated,
        created_by_user_id: userId,
        updated_by_user_id: userId,
      })
      .select()
      .single();

    if (error) {
      auditLogger.error("equipment_create_failed", {
        actorId: userId,
        metadata: { supabaseError: error.message, name: validated.name },
        error,
      });
      return NextResponse.json(
        { error: "Failed to create equipment", details: error.message },
        { status: 500 },
      );
    }

    // 성공 감사 로그
    auditLogger.info("equipment_created", {
      actorId: userId,
      metadata: {
        equipmentId: data.id,
        name: data.name,
        category: data.category,
        status: data.status,
      },
      tags: {
        module: "erm",
        action_type: "create",
      },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    auditLogger.error("equipment_create_exception", {
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
