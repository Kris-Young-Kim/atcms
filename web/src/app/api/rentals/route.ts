import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rentalSchema, RENTAL_STATUS } from "@/lib/validations/rental";

/**
 * POST /api/rentals
 * 새 대여 기록 생성
 * Sprint 1: ERM-US-02
 *
 * 권한: admin, leader, technician만 가능
 */
export async function POST(request: Request) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      auditLogger.warn("rental_create_unauthorized", {
        metadata: { reason: "No userId" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 역할 권한 확인
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "technician"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.warn("rental_create_forbidden", {
        actorId: userId,
        metadata: { role: userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = rentalSchema.safeParse(body);

    if (!validationResult.success) {
      auditLogger.error("rental_create_validation_failed", {
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

    const supabase = createSupabaseServerClient();

    // 기기 정보 조회 (가용 수량 및 상태 확인을 위해)
    const { data: equipment, error: equipmentError } = await supabase
      .from("equipment")
      .select("id, name, available_quantity, status")
      .eq("id", validated.equipment_id)
      .single();

    if (equipmentError || !equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // 기기 상태 확인: 정상 상태인지 확인 (normal 상태만 대여 가능)
    // maintenance(유지보수) 또는 retired(폐기) 상태의 기기는 대여 불가
    if (equipment.status !== "normal") {
      return NextResponse.json(
        { error: `해당 기기는 현재 대여 불가능한 상태입니다. (${equipment.status})` },
        { status: 400 },
      );
    }

    // 가용 수량 확인: 요청한 수량이 가용 수량 이하인지 확인
    // available_quantity는 현재 대여 가능한 수량을 의미하며,
    // 이 값이 요청한 quantity보다 작으면 대여 불가
    if ((equipment.available_quantity || 0) < validated.quantity) {
      return NextResponse.json(
        {
          error: `가용 수량이 부족합니다. (가용: ${equipment.available_quantity}, 요청: ${validated.quantity})`,
        },
        { status: 400 },
      );
    }

    // 계약서 PDF URL 생성 (Stub 구현)
    // 현재는 빈 문자열로 저장하지만, 향후 실제 PDF 생성 로직 추가 예정
    // PDF 생성 후 Supabase Storage에 업로드하고 URL을 반환할 예정
    const contractUrl = ""; // TODO: 실제 PDF 생성 로직 구현

    // 대여 기록 저장
    // status는 자동으로 'active'로 설정되며,
    // rental_date가 없으면 오늘 날짜로 자동 설정
    // 데이터베이스 트리거가 자동으로 equipment.available_quantity를 감소시킴
    const { data, error } = await supabase
      .from("rentals")
      .insert({
        ...validated,
        status: RENTAL_STATUS.ACTIVE,
        rental_date: validated.rental_date || new Date().toISOString().split("T")[0],
        contract_url: contractUrl || null,
        created_by_user_id: userId,
        updated_by_user_id: userId,
      })
      .select()
      .single();

    if (error) {
      auditLogger.error("rental_create_failed", {
        actorId: userId,
        metadata: { supabaseError: error.message, equipmentId: validated.equipment_id },
        error,
      });
      return NextResponse.json(
        { error: "Failed to create rental", details: error.message },
        { status: 500 },
      );
    }

    // 성공 감사 로그
    auditLogger.info("rental_created", {
      actorId: userId,
      metadata: {
        rentalId: data.id,
        equipmentId: validated.equipment_id,
        clientId: validated.client_id,
        quantity: validated.quantity,
      },
      tags: {
        module: "erm",
        action_type: "create",
      },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    auditLogger.error("rental_create_exception", {
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
 * GET /api/rentals
 * 대여 목록 조회
 * Sprint 1: ERM-US-02
 */
export async function GET(request: Request) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 역할 권한 확인
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist", "socialWorker", "technician"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const equipmentId = searchParams.get("equipment_id");
    const clientId = searchParams.get("client_id");

    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("rentals")
      .select(`
        *,
        equipment:equipment_id (
          id,
          name,
          category
        ),
        client:client_id (
          id,
          name
        )
      `);

    // 상태 필터
    if (status) {
      query = query.eq("status", status);
    }

    // 기기 필터
    if (equipmentId) {
      query = query.eq("equipment_id", equipmentId);
    }

    // 대상자 필터
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    // 정렬 (최신순)
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      auditLogger.error("rental_list_fetch_failed", {
        actorId: userId,
        metadata: { supabaseError: error.message },
        error,
      });
      return NextResponse.json({ error: "Failed to fetch rentals" }, { status: 500 });
    }

    auditLogger.info("rental_list_viewed", {
      actorId: userId,
      metadata: {
        count: data?.length || 0,
        filters: { status, equipmentId, clientId },
      },
    });

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    auditLogger.error("rental_list_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

