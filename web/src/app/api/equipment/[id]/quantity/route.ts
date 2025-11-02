import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { equipmentQuantityUpdateSchema } from "@/lib/validations/equipment";

/**
 * PATCH /api/equipment/[id]/quantity
 * 기기 수량 조정
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
      auditLogger.error("equipment_quantity_update_forbidden", {
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
    const validationResult = equipmentQuantityUpdateSchema.safeParse(body);

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

    // 활성 대여 수량 확인
    const { data: activeRentals } = await supabase
      .from("rentals")
      .select("quantity")
      .eq("equipment_id", id)
      .eq("status", "active");

    const totalRentedQuantity =
      activeRentals?.reduce((sum, rental) => sum + (rental.quantity || 0), 0) || 0;

    // 가용 수량은 전체 수량에서 대여 중인 수량을 뺀 값 이상이어야 함
    const minAvailableQuantity = Math.max(0, validated.total_quantity - totalRentedQuantity);

    if (validated.available_quantity < minAvailableQuantity) {
      return NextResponse.json(
        {
          error: `가용 수량은 최소 ${minAvailableQuantity} 이상이어야 합니다. (현재 대여 중: ${totalRentedQuantity}개)`,
        },
        { status: 400 },
      );
    }

    // 기기 수량 업데이트
    const { data, error } = await supabase
      .from("equipment")
      .update({
        total_quantity: validated.total_quantity,
        available_quantity: validated.available_quantity,
        updated_by_user_id: userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      auditLogger.error("equipment_quantity_update_failed", {
        actorId: userId,
        metadata: { equipmentId: id, supabaseError: error?.message },
        error,
      });
      return NextResponse.json({ error: "Failed to update equipment quantity" }, { status: 500 });
    }

    // 수량 변경 감사 로그
    auditLogger.info("equipment_quantity_updated", {
      actorId: userId,
      metadata: {
        equipmentId: id,
        name: data.name,
        oldTotalQuantity: existingEquipment.total_quantity,
        newTotalQuantity: validated.total_quantity,
        oldAvailableQuantity: existingEquipment.available_quantity,
        newAvailableQuantity: validated.available_quantity,
      },
      tags: { module: "erm", action_type: "quantity_update" },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("equipment_quantity_update_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
