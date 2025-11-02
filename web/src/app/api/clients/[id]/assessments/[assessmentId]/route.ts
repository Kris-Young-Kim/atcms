import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assessmentUpdateSchema, calculateTotalScore } from "@/lib/validations/assessment";

/**
 * GET /api/clients/[id]/assessments/[assessmentId]
 * 평가 기록 상세 조회
 * Sprint 1: CMS-US-05
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; assessmentId: string }> },
) {
  try {
    const { id: clientId, assessmentId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("service_records")
      .select("*")
      .eq("id", assessmentId)
      .eq("client_id", clientId)
      .eq("record_type", "assessment")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    auditLogger.info("assessment_viewed", {
      actorId: userId,
      metadata: { assessmentId, clientId },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("assessment_fetch_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/clients/[id]/assessments/[assessmentId]
 * 평가 기록 수정
 * Sprint 1: CMS-US-05
 *
 * 권한: 작성자 본인 또는 admin/leader만 수정 가능
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; assessmentId: string }> },
) {
  try {
    const { id: clientId, assessmentId } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 기존 기록 조회 (작성자 확인용)
    const supabase = await createSupabaseServerClient();
    const { data: existingRecord, error: fetchError } = await supabase
      .from("service_records")
      .select("created_by_user_id, content, attachments")
      .eq("id", assessmentId)
      .eq("client_id", clientId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // 권한 확인: 작성자 본인 또는 admin/leader만 수정 가능
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const isAuthor = existingRecord.created_by_user_id === userId;
    const isAdminOrLeader = userRole === "admin" || userRole === "leader";

    if (!isAuthor && !isAdminOrLeader) {
      auditLogger.error("assessment_update_forbidden", {
        actorId: userId,
        metadata: {
          assessmentId,
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
    const validationResult = assessmentUpdateSchema.safeParse(body);

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

    // 평가 항목이 있으면 전체 점수 계산 및 content 업데이트
    let content = existingRecord.content;
    let attachments = existingRecord.attachments || [];

    if (validated.items || validated.assessment_type || validated.summary !== undefined) {
      // 기존 데이터 파싱
      let existingData: {
        assessment_type?: string;
        items?: unknown[];
        total_score?: number;
        summary?: string;
      } = {};

      try {
        if (existingRecord.content) {
          existingData = JSON.parse(existingRecord.content);
        }
      } catch {
        // 파싱 실패 시 빈 객체 사용
      }

      // 업데이트된 데이터 병합
      const updatedData = {
        assessment_type: validated.assessment_type || existingData.assessment_type,
        items: validated.items || existingData.items || [],
        total_score: validated.total_score,
        summary: validated.summary !== undefined ? validated.summary : existingData.summary,
      };

      // 전체 점수 계산
      if (updatedData.items && Array.isArray(updatedData.items) && updatedData.items.length > 0) {
        updatedData.total_score =
          updatedData.total_score ??
          calculateTotalScore(
            updatedData.items as Array<{
              question: string;
              score: number;
              notes?: string;
              id?: string;
            }>,
          );
      }

      content = JSON.stringify(updatedData);
    }

    // 첨부파일 업데이트
    if (validated.pdf_attachment !== undefined || validated.attachments !== undefined) {
      const pdfUrl =
        validated.pdf_attachment || (attachments as string[]).find((url) => url.endsWith(".pdf"));
      const otherAttachments =
        validated.attachments || (attachments as string[]).filter((url) => !url.endsWith(".pdf"));
      attachments = pdfUrl ? [pdfUrl, ...otherAttachments] : otherAttachments;
    }

    // 평가 기록 수정
    const updateData: Record<string, unknown> = {
      updated_by_user_id: userId,
    };

    if (validated.record_date) updateData.record_date = validated.record_date;
    if (validated.title) updateData.title = validated.title;
    if (content !== undefined) updateData.content = content;
    if (attachments) updateData.attachments = attachments;

    const { data, error } = await supabase
      .from("service_records")
      .update(updateData)
      .eq("id", assessmentId)
      .eq("client_id", clientId)
      .select()
      .single();

    if (error || !data) {
      auditLogger.error("assessment_update_failed", {
        actorId: userId,
        metadata: { assessmentId, clientId, supabaseError: error?.message },
        error,
      });
      return NextResponse.json({ error: "Failed to update assessment" }, { status: 500 });
    }

    auditLogger.info("assessment_updated", {
      actorId: userId,
      metadata: {
        assessmentId,
        clientId,
        title: data.title,
        changes: validated,
      },
      tags: { module: "cms", action_type: "update" },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("assessment_update_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id]/assessments/[assessmentId]
 * 평가 기록 삭제
 * Sprint 1: CMS-US-05
 *
 * 권한: 작성자 본인 또는 admin/leader만 삭제 가능
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; assessmentId: string }> },
) {
  try {
    const { id: clientId, assessmentId } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 기존 기록 조회 (작성자 확인용)
    const supabase = await createSupabaseServerClient();
    const { data: existingRecord, error: fetchError } = await supabase
      .from("service_records")
      .select("created_by_user_id, title")
      .eq("id", assessmentId)
      .eq("client_id", clientId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // 권한 확인: 작성자 본인 또는 admin/leader만 삭제 가능
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const isAuthor = existingRecord.created_by_user_id === userId;
    const isAdminOrLeader = userRole === "admin" || userRole === "leader";

    if (!isAuthor && !isAdminOrLeader) {
      auditLogger.error("assessment_delete_forbidden", {
        actorId: userId,
        metadata: {
          assessmentId,
          clientId,
          userRole,
          isAuthor,
          authorId: existingRecord.created_by_user_id,
        },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 평가 기록 삭제
    const { error } = await supabase
      .from("service_records")
      .delete()
      .eq("id", assessmentId)
      .eq("client_id", clientId);

    if (error) {
      auditLogger.error("assessment_delete_failed", {
        actorId: userId,
        metadata: { assessmentId, clientId, supabaseError: error.message },
        error,
      });
      return NextResponse.json({ error: "Failed to delete assessment" }, { status: 500 });
    }

    auditLogger.info("assessment_deleted", {
      actorId: userId,
      metadata: {
        assessmentId,
        clientId,
        title: existingRecord.title,
      },
      tags: { module: "cms", action_type: "delete" },
    });

    return NextResponse.json({ message: "Assessment deleted successfully" });
  } catch (error) {
    auditLogger.error("assessment_delete_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
