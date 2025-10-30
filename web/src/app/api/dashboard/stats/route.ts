import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { auditLogger } from "@/lib/logger/auditLogger";

/**
 * GET /api/dashboard/stats
 * 대시보드 통계 데이터 조회
 */
export async function GET() {
  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // 전체 대상자 수
    const { count: totalClients } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true });

    // 활동 중인 대상자 수
    const { count: activeClients } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // 이번 달 신규 등록 수
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count: newThisMonth } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .gte("created_at", firstDayOfMonth);

    // 최근 등록된 대상자 5명
    const { data: recentClients } = await supabase
      .from("clients")
      .select("id, name, intake_date, status")
      .order("created_at", { ascending: false })
      .limit(5);

    const stats = {
      totalClients: totalClients || 0,
      activeClients: activeClients || 0,
      newThisMonth: newThisMonth || 0,
      pendingConsultations: 0, // Phase 2에서 구현
    };

    auditLogger.info("dashboard_stats_viewed", {
      actorId: userId,
      metadata: { stats },
    });

    return NextResponse.json({
      stats,
      recentClients: recentClients || [],
    });
  } catch (error) {
    auditLogger.error("dashboard_stats_fetch_failed", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

