import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { customizationRequestUpdateSchema, customizationStageSchema } from "@/lib/validations/customization";

/**
 * GET /api/customization-requests/[id]
 * 맞춤제작 요청 상세 조회
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    // 맞춤제작 요청과 대상자 정보를 함께 조회
    const { data, error } = await supabase
      .from("customization_requests")
      .select(
        `
        *,
        clients:client_id (
          id,
          name,
          contact_phone
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      auditLogger.error("customization_request_not_found", {
        actorId: userId,
        metadata: { requestId: id },
      });
      return NextResponse.json({ error: "Customization request not found" }, { status: 404 });
    }

    auditLogger.info("customization_request_viewed", {
      actorId: userId,
      metadata: { requestId: id },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("customization_request_fetch_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/customization-requests/[id]
 * 맞춤제작 요청 수정
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

    // 기존 요청 조회하여 작성자 확인
    const supabase = await createSupabaseServerClient();
    const { data: existingRequest } = await supabase
      .from("customization_requests")
      .select("created_by_user_id")
      .eq("id", id)
      .single();

    if (!existingRequest) {
      return NextResponse.json({ error: "Customization request not found" }, { status: 404 });
    }

    // 작성자 본인 또는 admin/leader만 수정 가능
    const isOwner = existingRequest.created_by_user_id === userId;
    const hasPermission = userRole && allowedRoles.includes(userRole);

    if (!isOwner && !hasPermission) {
      auditLogger.error("customization_request_update_forbidden", {
        actorId: userId,
        metadata: { requestId: id, role: userRole, isOwner },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = customizationRequestUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // client_id는 수정 불가 (요청 스키마에서 제외)
    const { client_id, ...updateData } = validationResult.data;

    const { data, error } = await supabase
      .from("customization_requests")
      .update({
        ...updateData,
        updated_by_user_id: userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      auditLogger.error("customization_request_update_failed", {
        actorId: userId,
        metadata: { requestId: id, supabaseError: error?.message },
        error,
      });
      return NextResponse.json({ error: "Failed to update customization request" }, { status: 500 });
    }

    auditLogger.info("customization_request_updated", {
      actorId: userId,
      metadata: {
        requestId: id,
        title: data.title,
        changes: updateData,
      },
      tags: { module: "cdm", action_type: "update" },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("customization_request_update_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/customization-requests/[id]
 * 맞춤제작 요청 삭제 (취소 처리)
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
      auditLogger.error("customization_request_delete_forbidden", {
        actorId: userId,
        metadata: { requestId: id, role: userRole },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const supabase = await createSupabaseServerClient();

    // 취소 처리: status를 cancelled로 변경
    const { data, error } = await supabase
      .from("customization_requests")
      .update({
        status: "cancelled",
        updated_by_user_id: userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      auditLogger.error("customization_request_delete_failed", {
        actorId: userId,
        metadata: { requestId: id, supabaseError: error?.message },
        error,
      });
      return NextResponse.json({ error: "Failed to delete customization request" }, { status: 500 });
    }

    // 취소 단계 기록 추가
    await supabase.from("customization_stages").insert({
      customization_request_id: id,
      stage: "cancelled",
      notes: "맞춤제작 요청 취소됨",
      stage_date: new Date().toISOString().split("T")[0],
      created_by_user_id: userId,
    });

    auditLogger.info("customization_request_deleted", {
      actorId: userId,
      metadata: {
        requestId: id,
        title: data.title,
      },
      tags: { module: "cdm", action_type: "delete" },
    });

    return NextResponse.json({ message: "Customization request cancelled successfully", data });
  } catch (error) {
    auditLogger.error("customization_request_delete_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

