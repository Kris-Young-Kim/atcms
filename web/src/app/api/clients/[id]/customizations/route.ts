import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/clients/[id]/customizations
 * 대상자별 맞춤제작 요청 조회
 *
 * **권한**: `admin`, `leader`, `specialist`, `technician`, `socialWorker`
 *
 * **쿼리 파라미터:**
 * - `status`: 상태 필터 (선택)
 * - `page`: 페이지 번호 (기본값: 1)
 * - `limit`: 페이지당 항목 수 (기본값: 25)
 *
 * **응답:**
 * ```json
 * {
 *   "data": [...],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 25,
 *     "total": 10,
 *     "totalPages": 1
 *   }
 * }
 * ```
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const offset = (page - 1) * limit;

    const supabase = await createSupabaseServerClient();

    // 대상자 존재 확인
    const { data: clientExists } = await supabase
      .from("clients")
      .select("id")
      .eq("id", id)
      .single();

    if (!clientExists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 대상자별 맞춤제작 요청 조회
    let query = supabase
      .from("customization_requests")
      .select("*", { count: "exact" })
      .eq("client_id", id);

    // 상태 필터 적용
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // 정렬 및 페이지네이션
    query = query.order("requested_date", { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      auditLogger.error("client_customizations_fetch_failed", {
        actorId: userId,
        metadata: { clientId: id, supabaseError: error.message },
        error,
      });
      return NextResponse.json({ error: "Failed to fetch customizations" }, { status: 500 });
    }

    auditLogger.info("client_customizations_viewed", {
      actorId: userId,
      metadata: { clientId: id, count: data?.length || 0 },
    });

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    auditLogger.error("client_customizations_fetch_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
