import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { scheduleSchema } from "@/lib/validations/schedule";
import { z } from "zod";

/**
 * 맞춤제작 일정 생성을 위한 확장 스키마
 */
const customizationScheduleSchema = scheduleSchema.extend({
  schedule_type: z.literal("customization"),
  customization_request_id: z.string().uuid("맞춤제작 요청 ID는 필수입니다."),
  client_id: z.string().uuid("대상자 ID는 필수입니다."),
  // 맞춤제작 단계와 연동
  stage: z.enum(["requested", "designing", "prototyping", "fitting", "completed"]).optional(),
  // 단계별 일정 자동 생성 옵션
  auto_create_stage_schedules: z.boolean().default(false), // 기본값: false (수동 생성)
});

/**
 * 맞춤제작 단계별 일정 생성 설정
 */
const STAGE_SCHEDULE_CONFIG: Record<
  string,
  { title: string; durationDays: number; defaultStartHour: number; defaultEndHour: number }
> = {
  designing: { title: "설계 일정", durationDays: 7, defaultStartHour: 9, defaultEndHour: 18 },
  prototyping: { title: "시제품 제작 일정", durationDays: 14, defaultStartHour: 9, defaultEndHour: 18 },
  fitting: { title: "착용 테스트 일정", durationDays: 3, defaultStartHour: 10, defaultEndHour: 16 },
};

/**
 * POST /api/schedules/customization
 *
 * 맞춤제작 일정 생성
 *
 * **권한**: `admin`, `leader`, `specialist`, `technician`만 가능
 *
 * **처리 순서:**
 * 1. 인증 확인 (Clerk)
 * 2. 역할 권한 확인
 * 3. 입력 데이터 검증 (Zod)
 * 4. 맞춤제작 요청 존재 확인
 * 5. 맞춤제작 일정 저장
 * 6. 단계별 일정 자동 생성 (옵션)
 * 7. 감사 로그 기록
 *
 * **요청 본문:**
 * ```json
 * {
 *   "schedule_type": "customization",
 *   "customization_request_id": "uuid",
 *   "client_id": "uuid",
 *   "title": "맞춤제작 설계 일정",
 *   "stage": "designing",
 *   "start_time": "2025-11-05T10:00:00Z",
 *   "end_time": "2025-11-05T11:00:00Z",
 *   "auto_create_stage_schedules": false,
 *   ...
 * }
 * ```
 */
export async function POST(request: Request) {
  try {
    // 1. 인증 확인
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      auditLogger.error("customization_schedule_create_unauthorized", {
        metadata: { reason: "No userId" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 역할 권한 확인
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist", "technician"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.error("customization_schedule_create_forbidden", {
        actorId: userId,
        metadata: { role: userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 3. 요청 본문 파싱 및 검증
    const body = await request.json();

    const validationResult = customizationScheduleSchema.safeParse(body);
    if (!validationResult.success) {
      auditLogger.error("customization_schedule_create_validation_failed", {
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

    // 맞춤제작 요청 존재 확인 (필수)
    const { data: customizationRequest, error: customizationError } = await supabase
      .from("customization_requests")
      .select("id, client_id, title, status")
      .eq("id", validated.customization_request_id)
      .single();

    if (customizationError || !customizationRequest) {
      return NextResponse.json({ error: "Customization request not found" }, { status: 404 });
    }

    // 대상자 존재 확인
    const { data: clientExists } = await supabase
      .from("clients")
      .select("id")
      .eq("id", validated.client_id)
      .single();

    if (!clientExists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // client_id 일치 확인
    if (customizationRequest.client_id !== validated.client_id) {
      return NextResponse.json(
        { error: "Client ID does not match customization request" },
        { status: 400 },
      );
    }

    // 5. 맞춤제작 일정 저장
    // 단계 정보를 description에 JSON으로 저장
    const description = JSON.stringify({
      stage: validated.stage || customizationRequest.status,
      customization_request_title: customizationRequest.title,
      ...(validated.description && { original_description: validated.description }),
    });

    const { data: scheduleData, error: scheduleError } = await supabase
      .from("schedules")
      .insert({
        schedule_type: "customization",
        customization_request_id: validated.customization_request_id,
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

    if (scheduleError) {
      auditLogger.error("customization_schedule_create_failed", {
        actorId: userId,
        metadata: {
          supabaseError: scheduleError.message,
          customizationRequestId: validated.customization_request_id,
          title: validated.title,
        },
        error: scheduleError,
      });
      return NextResponse.json(
        { error: "Failed to create customization schedule", details: scheduleError.message },
        { status: 500 },
      );
    }

    // 6. 단계별 일정 자동 생성 (옵션)
    const createdStageScheduleIds: string[] = [];
    if (validated.auto_create_stage_schedules) {
      const startTime = new Date(validated.start_time);
      const stages = ["designing", "prototyping", "fitting"];

      for (const stage of stages) {
        const config = STAGE_SCHEDULE_CONFIG[stage];
        if (!config) continue;

        const stageStartTime = new Date(startTime);
        stageStartTime.setDate(stageStartTime.getDate() + (createdStageScheduleIds.length * config.durationDays));
        stageStartTime.setHours(config.defaultStartHour, 0, 0, 0);

        const stageEndTime = new Date(stageStartTime);
        stageEndTime.setDate(stageEndTime.getDate() + config.durationDays);
        stageEndTime.setHours(config.defaultEndHour, 0, 0, 0);

        const { data: stageSchedule, error: stageError } = await supabase
          .from("schedules")
          .insert({
            schedule_type: "customization",
            customization_request_id: validated.customization_request_id,
            client_id: validated.client_id,
            title: `${customizationRequest.title} - ${config.title}`,
            description: JSON.stringify({
              stage,
              auto_generated: true,
              parent_schedule_id: scheduleData.id,
            }),
            start_time: stageStartTime.toISOString(),
            end_time: stageEndTime.toISOString(),
            location: validated.location,
            participant_ids: validated.participant_ids || [],
            reminder_minutes: 60,
            status: "scheduled",
            notes: `자동 생성된 ${config.title}`,
            created_by_user_id: userId,
            updated_by_user_id: userId,
          })
          .select()
          .single();

        if (!stageError && stageSchedule) {
          createdStageScheduleIds.push(stageSchedule.id);
        }
      }

      if (createdStageScheduleIds.length > 0) {
        auditLogger.info("customization_stage_schedules_auto_created", {
          actorId: userId,
          metadata: {
            parentScheduleId: scheduleData.id,
            customizationRequestId: validated.customization_request_id,
            createdScheduleIds: createdStageScheduleIds,
            count: createdStageScheduleIds.length,
          },
        });
      }
    }

    // 7. 성공 감사 로그 기록
    auditLogger.info("customization_schedule_created", {
      actorId: userId,
      metadata: {
        scheduleId: scheduleData.id,
        customizationRequestId: validated.customization_request_id,
        clientId: validated.client_id,
        title: scheduleData.title,
        stage: validated.stage || customizationRequest.status,
        startTime: scheduleData.start_time,
        autoCreatedStageSchedules: createdStageScheduleIds.length,
      },
      tags: {
        module: "sch",
        action_type: "create",
        schedule_type: "customization",
      },
    });

    // 8. 성공 응답 반환 (201 Created)
    return NextResponse.json(
      {
        ...scheduleData,
        created_stage_schedule_ids: createdStageScheduleIds,
      },
      { status: 201 },
    );
  } catch (error) {
    auditLogger.error("customization_schedule_create_exception", {
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

