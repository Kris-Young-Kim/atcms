import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { equipmentStatusUpdateSchema } from "@/lib/validations/equipment";

/**
 * PATCH /api/equipment/[id]/status
 * 기기 상태 변경
 * Sprint 1: ERM-US-01
 *
 * 권한: admin, leader, technician만 가능
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      auditLogger.error("equipment_status_update_forbidden", {
        actorId: userId,
        metadata: { equipmentId: id, userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 기존 기기 조회
    const supabase = await createSupabaseServerClient();
    const { data: existingEquipment, error: fetchError } = await supabase
      .from("equipment")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingEquipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = equipmentStatusUpdateSchema.safeParse(body);

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

    // 상태 전이 검증
    const oldStatus = existingEquipment.status;
    const newStatus = validated.status;

    // 폐기된 기기는 복구 불가
    if (oldStatus === "retired" && newStatus !== "retired") {
      return NextResponse.json({ error: "폐기된 기기는 복구할 수 없습니다." }, { status: 400 });
    }

    // 기기 상태 업데이트
    const { data, error } = await supabase
      .from("equipment")
      .update({
        status: validated.status,
        updated_by_user_id: userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      auditLogger.error("equipment_status_update_failed", {
        actorId: userId,
        metadata: { equipmentId: id, supabaseError: error?.message },
        error,
      });
      return NextResponse.json({ error: "Failed to update equipment status" }, { status: 500 });
    }

    // 상태 변경 감사 로그
    auditLogger.info("equipment_status_updated", {
      actorId: userId,
      metadata: {
        equipmentId: id,
        name: data.name,
        oldStatus,
        newStatus,
      },
      tags: { module: "erm", action_type: "status_update" },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("equipment_status_update_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
