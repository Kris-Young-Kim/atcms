import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/clients/[id]/stats
 * 대상자 통합 통계 조회 API
 *
 * **권한**: `admin`, `leader`, `specialist`, `technician`, `socialWorker`
 *
 * **설명:**
 * 대상자의 모든 서비스 활동 통계를 조회합니다.
 * 상담 횟수, 평가 횟수, 진행 중인 대여 수, 진행 중인 맞춤제작 요청 수, 다음 예정 일정 정보를 제공합니다.
 *
 * **응답:**
 * ```json
 * {
 *   "client_id": "uuid",
 *   "client_name": "대상자 이름",
 *   "stats": {
 *     "consultation_count": 5,
 *     "assessment_count": 3,
 *     "active_rentals_count": 2,
 *     "active_customizations_count": 1,
 *     "upcoming_schedules": [
 *       {
 *         "id": "uuid",
 *         "title": "일정 제목",
 *         "start_time": "2025-11-10T10:00:00Z",
 *         "schedule_type": "consultation"
 *       }
 *     ],
 *     "next_schedule": {
 *       "id": "uuid",
 *       "title": "다음 일정",
 *       "start_time": "2025-11-10T10:00:00Z"
 *     }
 *   }
 * }
 * ```
 *
 * Phase 10: 통합 대상자 관리
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    // 대상자 존재 확인
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 현재 시간 기준 (다음 일정 조회용)
    const now = new Date().toISOString();

    // 1. 상담 횟수 통계
    const { count: consultationCount } = await supabase
      .from("service_records")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("record_type", "consultation");

    // 2. 평가 횟수 통계
    const { count: assessmentCount } = await supabase
      .from("service_records")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("record_type", "assessment");

    // 3. 진행 중인 대여 수 (status가 'active' 또는 'pending'인 대여)
    const { count: activeRentalsCount } = await supabase
      .from("rentals")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", ["active", "pending"]);

    // 4. 진행 중인 맞춤제작 요청 수 (completed, cancelled 제외)
    const { count: activeCustomizationsCount } = await supabase
      .from("customization_requests")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .not("status", "in", "(completed,cancelled)");

    // 5. 다음 예정 일정 정보 (현재 시간 이후의 일정 중 가장 가까운 것)
    const { data: upcomingSchedules } = await supabase
      .from("schedules")
      .select("id, title, start_time, schedule_type, status")
      .eq("client_id", clientId)
      .gte("start_time", now)
      .eq("status", "scheduled")
      .order("start_time", { ascending: true })
      .limit(5); // 최대 5개까지만

    // 다음 일정 (가장 가까운 일정)
    const nextSchedule = upcomingSchedules && upcomingSchedules.length > 0 ? upcomingSchedules[0] : null;

    // 통계 데이터 구성
    const stats = {
      consultation_count: consultationCount || 0,
      assessment_count: assessmentCount || 0,
      active_rentals_count: activeRentalsCount || 0,
      active_customizations_count: activeCustomizationsCount || 0,
      upcoming_schedules: upcomingSchedules || [],
      next_schedule: nextSchedule
        ? {
            id: nextSchedule.id,
            title: nextSchedule.title,
            start_time: nextSchedule.start_time,
            schedule_type: nextSchedule.schedule_type,
          }
        : null,
    };

    // 감사 로그 기록
    auditLogger.info("client_stats_listed", {
      actorId: userId,
      metadata: {
        clientId,
        clientName: client.name,
        stats,
      },
      tags: {
        module: "cms",
        action_type: "read",
      },
    });

    return NextResponse.json({
      client_id: clientId,
      client_name: client.name,
      stats,
    });
  } catch (error) {
    auditLogger.error("client_stats_fetch_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

