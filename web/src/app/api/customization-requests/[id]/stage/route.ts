import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { customizationStageSchema } from "@/lib/validations/customization";

/**
 * PATCH /api/customization-requests/[id]/stage
 * 맞춤제작 요청 단계 변경
 *
 * **권한**: `admin`, `leader`, `specialist`, `technician`만 가능
 *
 * **상태 전이 규칙:**
 * - requested → designing, cancelled
 * - designing → prototyping, cancelled
 * - prototyping → fitting, cancelled
 * - fitting → completed, cancelled
 * - completed → (변경 불가)
 * - cancelled → (변경 불가)
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
    const allowedRoles = ["admin", "leader", "specialist", "technician"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.error("customization_stage_update_forbidden", {
        actorId: userId,
        metadata: { requestId: id, role: userRole },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = customizationStageSchema.safeParse(body);

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
    const supabase = await createSupabaseServerClient();

    // 기존 요청의 현재 상태 확인
    const { data: existingRequest } = await supabase
      .from("customization_requests")
      .select("status")
      .eq("id", id)
      .single();

    if (!existingRequest) {
      return NextResponse.json({ error: "Customization request not found" }, { status: 404 });
    }

    // 상태 전이 검증
    const currentStatus = existingRequest.status;
    const newStatus = validated.stage;

    // 이미 완료되거나 취소된 경우 변경 불가
    if (currentStatus === "completed" || currentStatus === "cancelled") {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus}` },
        { status: 400 },
      );
    }

    // 상태 전이 규칙 검증
    const validTransitions: Record<string, string[]> = {
      requested: ["designing", "cancelled"],
      designing: ["prototyping", "cancelled"],
      prototyping: ["fitting", "cancelled"],
      fitting: ["completed", "cancelled"],
    };

    const allowedNextStatuses = validTransitions[currentStatus] || [];
    if (!allowedNextStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition: ${currentStatus} → ${newStatus}`,
          allowedTransitions: allowedNextStatuses,
        },
        { status: 400 },
      );
    }

    // 상태 업데이트
    const updateData: {
      status: string;
      updated_by_user_id: string;
      completed_date?: string;
    } = {
      status: newStatus,
      updated_by_user_id: userId,
    };

    // 완료 상태로 변경 시 completed_date 설정
    if (newStatus === "completed") {
      updateData.completed_date = validated.stage_date || new Date().toISOString().split("T")[0];
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from("customization_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedRequest) {
      auditLogger.error("customization_request_stage_update_failed", {
        actorId: userId,
        metadata: { requestId: id, supabaseError: updateError?.message },
        error: updateError,
      });
      return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });
    }

    // 단계 히스토리 기록
    const { error: stageError } = await supabase.from("customization_stages").insert({
      customization_request_id: id,
      stage: newStatus,
      notes: validated.notes || `상태 변경: ${currentStatus} → ${newStatus}`,
      metadata: validated.metadata || {},
      attachments: validated.attachments || [],
      stage_date: validated.stage_date || new Date().toISOString().split("T")[0],
      created_by_user_id: userId,
    });

    if (stageError) {
      auditLogger.error("customization_stage_history_create_failed", {
        actorId: userId,
        metadata: { requestId: id, supabaseError: stageError.message },
        error: stageError,
      });
      // 단계 히스토리 실패는 치명적이지 않으므로 계속 진행
    }

    auditLogger.info("customization_stage_updated", {
      actorId: userId,
      metadata: {
        requestId: id,
        previousStatus: currentStatus,
        newStatus: newStatus,
      },
      tags: { module: "cdm", action_type: "update" },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    auditLogger.error("customization_stage_update_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
