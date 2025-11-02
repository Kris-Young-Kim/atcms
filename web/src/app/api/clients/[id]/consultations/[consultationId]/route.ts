import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consultationUpdateSchema } from "@/lib/validations/consultation";

/**
 * GET /api/clients/[id]/consultations/[consultationId]
 * 상담 기록 상세 조회
 * Sprint 1: CMS-US-04
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; consultationId: string }> },
) {
  try {
    const { id: clientId, consultationId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("service_records")
      .select("*")
      .eq("id", consultationId)
      .eq("client_id", clientId)
      .eq("record_type", "consultation")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
    }

    auditLogger.info("consultation_viewed", {
      actorId: userId,
      metadata: { consultationId, clientId },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("consultation_fetch_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/clients/[id]/consultations/[consultationId]
 * 상담 기록 수정
 * Sprint 1: CMS-US-04
 * 
 * 권한: 작성자 본인 또는 admin/leader만 수정 가능
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; consultationId: string }> },
) {
  try {
    const { id: clientId, consultationId } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 기존 기록 조회 (작성자 확인용)
    const supabase = createSupabaseServerClient();
    const { data: existingRecord, error: fetchError } = await supabase
      .from("service_records")
      .select("created_by_user_id")
      .eq("id", consultationId)
      .eq("client_id", clientId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
    }

    // 권한 확인: 작성자 본인 또는 admin/leader만 수정 가능
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const isAuthor = existingRecord.created_by_user_id === userId;
    const isAdminOrLeader = userRole === "admin" || userRole === "leader";

    if (!isAuthor && !isAdminOrLeader) {
      auditLogger.error("consultation_update_forbidden", {
        actorId: userId,
        metadata: {
          consultationId,
          clientId,
          userRole,
          isAuthor,
          authorId: existingRecord.created_by_user_id,
        },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = consultationUpdateSchema.safeParse(body);

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

    // SOAP 필드를 content에 통합 (있는 경우)
    let content = validated.content;
    if (validated.subjective || validated.objective || validated.assessment || validated.plan) {
      const soapContent = [
        validated.subjective && `## S (Subjective - 주관적)\n\n${validated.subjective}`,
        validated.objective && `## O (Objective - 객관적)\n\n${validated.objective}`,
        validated.assessment && `## A (Assessment - 평가)\n\n${validated.assessment}`,
        validated.plan && `## P (Plan - 계획)\n\n${validated.plan}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      content = content ? `${content}\n\n${soapContent}` : soapContent;
    }

    // 상담 기록 수정
    const updateData: Record<string, unknown> = {
      updated_by_user_id: userId,
    };

    if (validated.record_date) updateData.record_date = validated.record_date;
    if (validated.title) updateData.title = validated.title;
    if (content !== undefined) updateData.content = content;
    if (validated.attachments) updateData.attachments = validated.attachments;

    const { data, error } = await supabase
      .from("service_records")
      .update(updateData)
      .eq("id", consultationId)
      .eq("client_id", clientId)
      .select()
      .single();

    if (error || !data) {
      auditLogger.error("consultation_update_failed", {
        actorId: userId,
        metadata: { consultationId, clientId, supabaseError: error?.message },
        error,
      });
      return NextResponse.json({ error: "Failed to update consultation" }, { status: 500 });
    }

    auditLogger.info("consultation_updated", {
      actorId: userId,
      metadata: {
        consultationId,
        clientId,
        title: data.title,
        changes: validated,
      },
      tags: { module: "cms", action_type: "update" },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("consultation_update_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id]/consultations/[consultationId]
 * 상담 기록 삭제
 * Sprint 1: CMS-US-04
 * 
 * 권한: 작성자 본인 또는 admin/leader만 삭제 가능
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; consultationId: string }> },
) {
  try {
    const { id: clientId, consultationId } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 기존 기록 조회 (작성자 확인용)
    const supabase = createSupabaseServerClient();
    const { data: existingRecord, error: fetchError } = await supabase
      .from("service_records")
      .select("created_by_user_id, title")
      .eq("id", consultationId)
      .eq("client_id", clientId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
    }

    // 권한 확인: 작성자 본인 또는 admin/leader만 삭제 가능
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const isAuthor = existingRecord.created_by_user_id === userId;
    const isAdminOrLeader = userRole === "admin" || userRole === "leader";

    if (!isAuthor && !isAdminOrLeader) {
      auditLogger.error("consultation_delete_forbidden", {
        actorId: userId,
        metadata: {
          consultationId,
          clientId,
          userRole,
          isAuthor,
          authorId: existingRecord.created_by_user_id,
        },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 상담 기록 삭제
    const { error } = await supabase
      .from("service_records")
      .delete()
      .eq("id", consultationId)
      .eq("client_id", clientId);

    if (error) {
      auditLogger.error("consultation_delete_failed", {
        actorId: userId,
        metadata: { consultationId, clientId, supabaseError: error.message },
        error,
      });
      return NextResponse.json({ error: "Failed to delete consultation" }, { status: 500 });
    }

    auditLogger.info("consultation_deleted", {
      actorId: userId,
      metadata: {
        consultationId,
        clientId,
        title: existingRecord.title,
      },
      tags: { module: "cms", action_type: "delete" },
    });

    return NextResponse.json({ message: "Consultation deleted successfully" });
  } catch (error) {
    auditLogger.error("consultation_delete_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

