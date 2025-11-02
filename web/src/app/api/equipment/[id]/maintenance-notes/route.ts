import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { maintenanceNoteSchema } from "@/lib/validations/maintenance-note";

/**
 * GET /api/equipment/[id]/maintenance-notes
 * 기기별 유지보수 노트 목록 조회
 * Sprint 1: ERM-US-03
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("maintenance_notes")
      .select("*")
      .eq("equipment_id", id)
      .order("note_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      auditLogger.error("maintenance_notes_fetch_failed", {
        actorId: userId,
        metadata: { equipmentId: id, supabaseError: error.message },
        error,
      });
      return NextResponse.json({ error: "Failed to fetch maintenance notes" }, { status: 500 });
    }

    auditLogger.info("maintenance_notes_viewed", {
      actorId: userId,
      metadata: { equipmentId: id, count: data?.length || 0 },
    });

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    auditLogger.error("maintenance_notes_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/equipment/[id]/maintenance-notes
 * 새 유지보수 노트 작성
 * Sprint 1: ERM-US-03
 *
 * 권한: admin, leader, technician만 가능
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      auditLogger.warn("maintenance_note_create_unauthorized", {
        metadata: { reason: "No userId" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 역할 권한 확인
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "technician"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.warn("maintenance_note_create_forbidden", {
        actorId: userId,
        metadata: { equipmentId: id, userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 기기 존재 확인
    const supabase = await createSupabaseServerClient();
    const { data: equipment, error: equipmentError } = await supabase
      .from("equipment")
      .select("id, name")
      .eq("id", id)
      .single();

    if (equipmentError || !equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = maintenanceNoteSchema.safeParse({
      ...body,
      equipment_id: id,
    });

    if (!validationResult.success) {
      auditLogger.error("maintenance_note_create_validation_failed", {
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

    // 유지보수 노트 저장
    const { data, error } = await supabase
      .from("maintenance_notes")
      .insert({
        ...validated,
        note_date: validated.note_date || new Date().toISOString().split("T")[0],
        created_by_user_id: userId,
        updated_by_user_id: userId,
      })
      .select()
      .single();

    if (error) {
      auditLogger.error("maintenance_note_create_failed", {
        actorId: userId,
        metadata: { equipmentId: id, supabaseError: error.message, title: validated.title },
        error,
      });
      return NextResponse.json(
        { error: "Failed to create maintenance note", details: error.message },
        { status: 500 },
      );
    }

    // 성공 감사 로그
    auditLogger.info("maintenance_note_added", {
      actorId: userId,
      metadata: {
        maintenanceNoteId: data.id,
        equipmentId: id,
        equipmentName: equipment.name,
        title: data.title,
        maintenanceType: data.maintenance_type,
      },
      tags: {
        module: "erm",
        action_type: "create",
      },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    auditLogger.error("maintenance_note_create_exception", {
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
