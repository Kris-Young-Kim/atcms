import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientUpdateSchema } from "@/lib/validations/client";

/**
 * GET /api/clients/[id]
 * 대상자 상세 조회
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();

    if (error || !data) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    auditLogger.info("client_viewed", {
      actorId: userId,
      metadata: { clientId: id },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("client_fetch_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/clients/[id]
 * 대상자 정보 수정
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 수정 권한 확인 (admin, leader, specialist만)
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.error("client_update_forbidden", {
        actorId: userId,
        metadata: { clientId: id, role: userRole },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = clientUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("clients")
      .update({
        ...validationResult.data,
        updated_by_user_id: userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      auditLogger.error("client_update_failed", {
        actorId: userId,
        metadata: { clientId: id, supabaseError: error?.message },
        error,
      });
      return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
    }

    auditLogger.info("client_updated", {
      actorId: userId,
      metadata: {
        clientId: id,
        clientName: data.name,
        changes: validationResult.data,
      },
      tags: { module: "cms", action_type: "update" },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("client_update_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id]
 * 대상자 삭제 (soft delete - status를 discharged로 변경)
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
      auditLogger.error("client_delete_forbidden", {
        actorId: userId,
        metadata: { clientId: id, role: userRole },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();

    // Soft delete: status를 discharged로 변경
    const { data, error } = await supabase
      .from("clients")
      .update({
        status: "discharged",
        updated_by_user_id: userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      auditLogger.error("client_delete_failed", {
        actorId: userId,
        metadata: { clientId: id, supabaseError: error?.message },
        error,
      });
      return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
    }

    auditLogger.info("client_deleted", {
      actorId: userId,
      metadata: {
        clientId: id,
        clientName: data.name,
      },
      tags: { module: "cms", action_type: "delete" },
    });

    return NextResponse.json({ message: "Client deleted successfully", data });
  } catch (error) {
    auditLogger.error("client_delete_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

