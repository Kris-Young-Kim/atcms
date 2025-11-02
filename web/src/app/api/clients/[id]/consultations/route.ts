import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consultationSchema, consultationUpdateSchema } from "@/lib/validations/consultation";

/**
 * GET /api/clients/[id]/consultations
 * 대상자의 상담 기록 목록 조회
 * Sprint 1: CMS-US-04
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 역할 권한 확인 (technician 제외)
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist", "socialWorker"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 대상자 존재 확인
    const supabase = createSupabaseServerClient();
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 상담 기록 조회
    const { data, error } = await supabase
      .from("service_records")
      .select("*")
      .eq("client_id", clientId)
      .eq("record_type", "consultation")
      .order("record_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      auditLogger.error("consultations_list_fetch_failed", {
        actorId: userId,
        metadata: { clientId, supabaseError: error.message },
        error,
      });
      return NextResponse.json({ error: "Failed to fetch consultations" }, { status: 500 });
    }

    auditLogger.info("consultations_list_viewed", {
      actorId: userId,
      metadata: { clientId, count: data?.length || 0 },
    });

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    auditLogger.error("consultations_list_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/clients/[id]/consultations
 * 새 상담 기록 생성
 * Sprint 1: CMS-US-04
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      auditLogger.error("consultation_create_unauthorized", {
        metadata: { reason: "No userId" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 역할 권한 확인 (admin, leader, specialist만 생성 가능)
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.error("consultation_create_forbidden", {
        actorId: userId,
        metadata: { role: userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();

    const validationResult = consultationSchema.safeParse({
      ...body,
      client_id: clientId,
    });

    if (!validationResult.success) {
      auditLogger.error("consultation_create_validation_failed", {
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

    // 대상자 존재 확인
    const supabase = createSupabaseServerClient();
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // SOAP 필드를 content에 통합 (있는 경우)
    let content = validated.content || "";
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

    // 상담 기록 저장
    const { data, error } = await supabase
      .from("service_records")
      .insert({
        client_id: clientId,
        record_type: "consultation",
        record_date: validated.record_date || new Date().toISOString().split("T")[0],
        title: validated.title,
        content,
        attachments: validated.attachments || [],
        created_by_user_id: userId,
        updated_by_user_id: userId,
      })
      .select()
      .single();

    if (error) {
      auditLogger.error("consultation_create_failed", {
        actorId: userId,
        metadata: { clientId, supabaseError: error.message, title: validated.title },
        error,
      });
      return NextResponse.json(
        { error: "Failed to create consultation", details: error.message },
        { status: 500 },
      );
    }

    // 성공 감사 로그
    auditLogger.info("consultation_created", {
      actorId: userId,
      metadata: {
        consultationId: data.id,
        clientId,
        title: data.title,
      },
      tags: {
        module: "cms",
        action_type: "create",
      },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    auditLogger.error("consultation_create_exception", {
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

