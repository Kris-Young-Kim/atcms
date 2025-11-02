import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  equipmentUpdateSchema,
  equipmentStatusUpdateSchema,
  equipmentQuantityUpdateSchema,
} from "@/lib/validations/equipment";

/**
 * GET /api/equipment/[id]
 * 기기 상세 조회
 * Sprint 1: ERM-US-01
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.from("equipment").select("*").eq("id", id).single();

    if (error || !data) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    auditLogger.info("equipment_viewed", {
      actorId: userId,
      metadata: { equipmentId: id },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("equipment_fetch_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/equipment/[id]
 * 기기 정보 수정
 * Sprint 1: ERM-US-01
 *
 * 권한: admin, leader, technician만 수정 가능
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      auditLogger.error("equipment_update_forbidden", {
        actorId: userId,
        metadata: { equipmentId: id, userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 기존 기기 조회
    const supabase = createSupabaseServerClient();
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
    const validationResult = equipmentUpdateSchema.safeParse(body);

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

    // 수량 검증
    const totalQuantity = validated.total_quantity ?? existingEquipment.total_quantity;
    const availableQuantity = validated.available_quantity ?? existingEquipment.available_quantity;

    if (availableQuantity > totalQuantity) {
      return NextResponse.json(
        { error: "가용 수량은 전체 수량을 초과할 수 없습니다." },
        { status: 400 },
      );
    }

    // 기기 수정
    const updateData: Record<string, unknown> = {
      ...validated,
      updated_by_user_id: userId,
    };

    const { data, error } = await supabase
      .from("equipment")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      auditLogger.error("equipment_update_failed", {
        actorId: userId,
        metadata: { equipmentId: id, supabaseError: error?.message },
        error,
      });
      return NextResponse.json({ error: "Failed to update equipment" }, { status: 500 });
    }

    auditLogger.info("equipment_updated", {
      actorId: userId,
      metadata: {
        equipmentId: id,
        name: data.name,
        changes: validated,
      },
      tags: { module: "erm", action_type: "update" },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("equipment_update_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/equipment/[id]
 * 기기 삭제
 * Sprint 1: ERM-US-01
 *
 * 권한: admin, leader만 삭제 가능
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 역할 권한 확인 (admin, leader만 삭제 가능)
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.error("equipment_delete_forbidden", {
        actorId: userId,
        metadata: { equipmentId: id, userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 기존 기기 조회
    const supabase = createSupabaseServerClient();
    const { data: existingEquipment, error: fetchError } = await supabase
      .from("equipment")
      .select("name")
      .eq("id", id)
      .single();

    if (fetchError || !existingEquipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // 활성 대여 확인 (RESTRICT 제약조건으로 자동 처리됨)
    const { data: activeRentals } = await supabase
      .from("rentals")
      .select("id")
      .eq("equipment_id", id)
      .eq("status", "active")
      .limit(1);

    if (activeRentals && activeRentals.length > 0) {
      return NextResponse.json(
        { error: "활성 대여 중인 기기는 삭제할 수 없습니다." },
        { status: 400 },
      );
    }

    // 기기 삭제
    const { error } = await supabase.from("equipment").delete().eq("id", id);

    if (error) {
      auditLogger.error("equipment_delete_failed", {
        actorId: userId,
        metadata: { equipmentId: id, supabaseError: error.message },
        error,
      });
      return NextResponse.json({ error: "Failed to delete equipment" }, { status: 500 });
    }

    auditLogger.info("equipment_deleted", {
      actorId: userId,
      metadata: {
        equipmentId: id,
        name: existingEquipment.name,
      },
      tags: { module: "erm", action_type: "delete" },
    });

    return NextResponse.json({ message: "Equipment deleted successfully" });
  } catch (error) {
    auditLogger.error("equipment_delete_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

