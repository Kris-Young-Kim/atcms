import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { scheduleSchema } from "@/lib/validations/schedule";
import { ASSESSMENT_TYPES } from "@/lib/validations/assessment";
import { z } from "zod";

/**
 * 평가 일정 생성을 위한 확장 스키마
 */
const assessmentScheduleSchema = scheduleSchema.extend({
  schedule_type: z.literal("assessment"),
  client_id: z.string().uuid("대상자 ID는 필수입니다."),
  assessment_type: z.enum(
    [ASSESSMENT_TYPES.FUNCTIONAL, ASSESSMENT_TYPES.ENVIRONMENTAL, ASSESSMENT_TYPES.NEEDS],
    {
      errorMap: () => ({ message: "유효한 평가 유형을 선택하세요." }),
    },
  ),
  location: z.string().max(500, "장소는 최대 500자까지 입력 가능합니다.").optional(),
});

/**
 * POST /api/schedules/assessment
 *
 * 평가 일정 생성
 *
 * **권한**: `admin`, `leader`, `specialist`, `technician`만 가능
 *
 * **처리 순서:**
 * 1. 인증 확인 (Clerk)
 * 2. 역할 권한 확인
 * 3. 입력 데이터 검증 (Zod)
 * 4. 데이터베이스 저장
 * 5. 감사 로그 기록
 *
 * **요청 본문:**
 * ```json
 * {
 *   "schedule_type": "assessment",
 *   "client_id": "uuid",
 *   "title": "기능 평가 일정",
 *   "assessment_type": "functional",
 *   "start_time": "2025-11-05T10:00:00Z",
 *   "end_time": "2025-11-05T11:00:00Z",
 *   "location": "1층 상담실",
 *   ...
 * }
 * ```
 */
export async function POST(request: Request) {
  try {
    // 1. 인증 확인
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      auditLogger.error("assessment_schedule_create_unauthorized", {
        metadata: { reason: "No userId" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 역할 권한 확인
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist", "technician"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.error("assessment_schedule_create_forbidden", {
        actorId: userId,
        metadata: { role: userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 3. 요청 본문 파싱 및 검증
    const body = await request.json();

    const validationResult = assessmentScheduleSchema.safeParse(body);
    if (!validationResult.success) {
      auditLogger.error("assessment_schedule_create_validation_failed", {
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

    // 4. 관련 엔티티 존재 확인
    const supabase = await createSupabaseServerClient();

    // 대상자 존재 확인 (필수)
    const { data: clientExists } = await supabase
      .from("clients")
      .select("id")
      .eq("id", validated.client_id)
      .single();

    if (!clientExists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 5. 평가 유형 정보를 description에 JSON으로 저장
    const description = JSON.stringify({
      assessment_type: validated.assessment_type,
      ...(validated.description && { original_description: validated.description }),
    });

    // 6. Supabase에 데이터 저장
    const { data, error } = await supabase
      .from("schedules")
      .insert({
        schedule_type: "assessment",
        client_id: validated.client_id,
        title: validated.title,
        description,
        start_time: validated.start_time,
        end_time: validated.end_time,
        location: validated.location,
        participant_ids: validated.participant_ids || [],
        reminder_minutes: validated.reminder_minutes || 30,
        status: validated.status || "scheduled",
        notes: validated.notes,
        created_by_user_id: userId,
        updated_by_user_id: userId,
      })
      .select()
      .single();

    if (error) {
      auditLogger.error("assessment_schedule_create_failed", {
        actorId: userId,
        metadata: {
          supabaseError: error.message,
          title: validated.title,
          assessmentType: validated.assessment_type,
        },
        error,
      });
      return NextResponse.json(
        { error: "Failed to create assessment schedule", details: error.message },
        { status: 500 },
      );
    }

    // 7. 성공 감사 로그 기록
    auditLogger.info("assessment_schedule_created", {
      actorId: userId,
      metadata: {
        scheduleId: data.id,
        clientId: validated.client_id,
        assessmentType: validated.assessment_type,
        title: data.title,
        startTime: data.start_time,
        location: data.location,
      },
      tags: {
        module: "sch",
        action_type: "create",
        schedule_type: "assessment",
      },
    });

    // 8. 성공 응답 반환 (201 Created)
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    auditLogger.error("assessment_schedule_create_exception", {
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

