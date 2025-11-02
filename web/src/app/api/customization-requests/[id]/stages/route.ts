import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CustomizationStage } from "@/lib/validations/customization";

/**
 * GET /api/customization-requests/[id]/stages
 * 맞춤제작 요청 단계 히스토리 조회
 *
 * **권한**: `admin`, `leader`, `specialist`, `technician`, `socialWorker`
 *
 * **응답:**
 * ```json
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "stage": "requested",
 *       "notes": "맞춤제작 요청 등록됨",
 *       "stage_date": "2025-11-02",
 *       ...
 *     }
 *   ]
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

    const supabase = await createSupabaseServerClient();

    // 맞춤제작 요청 존재 확인
    const { data: requestExists } = await supabase
      .from("customization_requests")
      .select("id")
      .eq("id", id)
      .single();

    if (!requestExists) {
      return NextResponse.json({ error: "Customization request not found" }, { status: 404 });
    }

    // 단계 히스토리 조회 (날짜순 정렬)
    const { data, error } = await supabase
      .from("customization_stages")
      .select("*")
      .eq("customization_request_id", id)
      .order("stage_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      auditLogger.error("customization_stages_fetch_failed", {
        actorId: userId,
        metadata: { requestId: id, supabaseError: error.message },
        error,
      });
      return NextResponse.json({ error: "Failed to fetch stages" }, { status: 500 });
    }

    auditLogger.info("customization_stages_viewed", {
      actorId: userId,
      metadata: { requestId: id, stageCount: data?.length || 0 },
    });

    return NextResponse.json({
      data: (data as CustomizationStage[]) || [],
    });
  } catch (error) {
    auditLogger.error("customization_stages_fetch_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

