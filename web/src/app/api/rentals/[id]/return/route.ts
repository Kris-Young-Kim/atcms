import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rentalReturnSchema, RENTAL_STATUS } from "@/lib/validations/rental";

/**
 * PATCH /api/rentals/[id]/return
 * 대여 반납 처리
 * Sprint 1: ERM-US-02
 *
 * 권한: admin, leader, technician만 가능
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 역할 권한 확인
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "technician"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.warn("rental_return_forbidden", {
        actorId: userId,
        metadata: { rentalId: id, userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();

    // 기존 대여 기록 조회
    const { data: existingRental, error: fetchError } = await supabase
      .from("rentals")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingRental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
    }

    // 이미 반납된 경우 확인
    if (existingRental.status === RENTAL_STATUS.RETURNED) {
      return NextResponse.json({ error: "이미 반납 처리된 대여입니다." }, { status: 400 });
    }

    // 취소된 경우 확인
    if (existingRental.status === RENTAL_STATUS.CANCELLED) {
      return NextResponse.json({ error: "취소된 대여는 반납할 수 없습니다." }, { status: 400 });
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = rentalReturnSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validated = validationResult.data;

    // 반납일 설정 (요청에 없으면 오늘 날짜 사용)
    const actualReturnDate = validated.actual_return_date || new Date().toISOString().split("T")[0];

    // 반납 처리 (트리거가 자동으로 equipment.available_quantity 증가 처리)
    const { data, error } = await supabase
      .from("rentals")
      .update({
        status: RENTAL_STATUS.RETURNED,
        actual_return_date: actualReturnDate,
        notes: validated.notes
          ? `${existingRental.notes || ""}\n[반납] ${validated.notes}`.trim()
          : existingRental.notes,
        updated_by_user_id: userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      auditLogger.error("rental_return_failed", {
        actorId: userId,
        metadata: { rentalId: id, supabaseError: error?.message },
        error,
      });
      return NextResponse.json({ error: "Failed to return rental" }, { status: 500 });
    }

    // 반납 감사 로그
    auditLogger.info("rental_returned", {
      actorId: userId,
      metadata: {
        rentalId: id,
        equipmentId: existingRental.equipment_id,
        clientId: existingRental.client_id,
        quantity: existingRental.quantity,
        actualReturnDate,
      },
      tags: {
        module: "erm",
        action_type: "return",
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("rental_return_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

