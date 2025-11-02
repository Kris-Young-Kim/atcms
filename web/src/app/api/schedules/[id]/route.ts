import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { scheduleUpdateSchema } from "@/lib/validations/schedule";

/**
 * GET /api/schedules/[id]
 * 일정 상세 조회
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    // 일정 상세 조회 (관련 엔티티 포함)
    const { data, error } = await supabase
      .from("schedules")
      .select(
        `
        *,
        clients:client_id (
          id,
          name,
          contact_phone
        ),
        rentals:rental_id (
          id,
          rental_date
        ),
        customization_requests:customization_request_id (
          id,
          title,
          status
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      auditLogger.error("schedule_not_found", {
        actorId: userId,
        metadata: { scheduleId: id },
      });
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    auditLogger.info("schedule_viewed", {
      actorId: userId,
      metadata: { scheduleId: id },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("schedule_fetch_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/schedules/[id]
 * 일정 수정
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 수정 권한 확인 (admin, leader만, 또는 작성자 본인)
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader"];

    // 기존 일정 조회하여 작성자 확인
    const supabase = await createSupabaseServerClient();
    const { data: existingSchedule } = await supabase
      .from("schedules")
      .select("created_by_user_id")
      .eq("id", id)
      .single();

    if (!existingSchedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // 작성자 본인 또는 admin/leader만 수정 가능
    const isOwner = existingSchedule.created_by_user_id === userId;
    const hasPermission = userRole && allowedRoles.includes(userRole);

    if (!isOwner && !hasPermission) {
      auditLogger.error("schedule_update_forbidden", {
        actorId: userId,
        metadata: { scheduleId: id, role: userRole, isOwner },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = scheduleUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { data: updatedSchedule, error: updateError } = await supabase
      .from("schedules")
      .update({
        ...validationResult.data,
        updated_by_user_id: userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedSchedule) {
      auditLogger.error("schedule_update_failed", {
        actorId: userId,
        metadata: { scheduleId: id, supabaseError: updateError?.message },
        error: updateError,
      });
      return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
    }

    auditLogger.info("schedule_updated", {
      actorId: userId,
      metadata: {
        scheduleId: id,
        title: updatedSchedule.title,
        changes: validationResult.data,
      },
      tags: { module: "sch", action_type: "update" },
    });

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    auditLogger.error("schedule_update_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/schedules/[id]
 * 일정 삭제 (취소 처리)
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 삭제 권한 확인 (admin, leader만)
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.error("schedule_delete_forbidden", {
        actorId: userId,
        metadata: { scheduleId: id, role: userRole },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const supabase = await createSupabaseServerClient();

    // 취소 처리: status를 cancelled로 변경
    const { data, error } = await supabase
      .from("schedules")
      .update({
        status: "cancelled",
        updated_by_user_id: userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      auditLogger.error("schedule_delete_failed", {
        actorId: userId,
        metadata: { scheduleId: id, supabaseError: error?.message },
        error,
      });
      return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
    }

    auditLogger.info("schedule_deleted", {
      actorId: userId,
      metadata: {
        scheduleId: id,
        title: data.title,
      },
      tags: { module: "sch", action_type: "delete" },
    });

    return NextResponse.json({ message: "Schedule cancelled successfully", data });
  } catch (error) {
    auditLogger.error("schedule_delete_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

