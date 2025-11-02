import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { scheduleSchema } from "@/lib/validations/schedule";
import { z } from "zod";

/**
 * 대여 일정 생성을 위한 확장 스키마
 */
const rentalScheduleSchema = scheduleSchema.extend({
  schedule_type: z.literal("rental"),
  rental_id: z.string().uuid("대여 ID는 필수입니다."),
  client_id: z.string().uuid("대상자 ID는 필수입니다."),
  // 기기 준비 일정 자동 생성 옵션
  auto_create_preparation: z.boolean().default(true), // 기본값: true
  preparation_days_before: z.number().int().min(0).max(30).default(1), // 대여 일정 전 며칠 전에 준비 일정 생성
});

/**
 * POST /api/schedules/rental
 *
 * 대여 일정 생성
 *
 * **권한**: `admin`, `leader`, `specialist`, `technician`만 가능
 *
 * **처리 순서:**
 * 1. 인증 확인 (Clerk)
 * 2. 역할 권한 확인
 * 3. 입력 데이터 검증 (Zod)
 * 4. 대여 기록 존재 확인
 * 5. 대여 일정 저장
 * 6. 기기 준비 일정 자동 생성 (옵션)
 * 7. 감사 로그 기록
 *
 * **요청 본문:**
 * ```json
 * {
 *   "schedule_type": "rental",
 *   "rental_id": "uuid",
 *   "client_id": "uuid",
 *   "title": "기기 대여 일정",
 *   "start_time": "2025-11-05T10:00:00Z",
 *   "end_time": "2025-11-05T11:00:00Z",
 *   "auto_create_preparation": true,
 *   "preparation_days_before": 1,
 *   ...
 * }
 * ```
 */
export async function POST(request: Request) {
  try {
    // 1. 인증 확인
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      auditLogger.error("rental_schedule_create_unauthorized", {
        metadata: { reason: "No userId" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 역할 권한 확인
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const allowedRoles = ["admin", "leader", "specialist", "technician"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      auditLogger.error("rental_schedule_create_forbidden", {
        actorId: userId,
        metadata: { role: userRole },
        tags: { security: "access_control" },
      });
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 3. 요청 본문 파싱 및 검증
    const body = await request.json();

    const validationResult = rentalScheduleSchema.safeParse(body);
    if (!validationResult.success) {
      auditLogger.error("rental_schedule_create_validation_failed", {
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

    // 대여 기록 존재 확인 (필수)
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select("id, client_id, equipment_id, status")
      .eq("id", validated.rental_id)
      .single();

    if (rentalError || !rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
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
    if (rental.client_id !== validated.client_id) {
      return NextResponse.json({ error: "Client ID does not match rental record" }, { status: 400 });
    }

    // 5. 대여 일정 저장
    const { data: scheduleData, error: scheduleError } = await supabase
      .from("schedules")
      .insert({
        schedule_type: "rental",
        rental_id: validated.rental_id,
        client_id: validated.client_id,
        title: validated.title,
        description: validated.description,
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
      auditLogger.error("rental_schedule_create_failed", {
        actorId: userId,
        metadata: {
          supabaseError: scheduleError.message,
          rentalId: validated.rental_id,
          title: validated.title,
        },
        error: scheduleError,
      });
      return NextResponse.json(
        { error: "Failed to create rental schedule", details: scheduleError.message },
        { status: 500 },
      );
    }

    // 6. 기기 준비 일정 자동 생성 (옵션)
    let preparationScheduleId: string | null = null;
    if (validated.auto_create_preparation) {
      const startTime = new Date(validated.start_time);
      const preparationTime = new Date(startTime);
      preparationTime.setDate(preparationTime.getDate() - validated.preparation_days_before);
      preparationTime.setHours(9, 0, 0, 0); // 오전 9시로 설정

      const preparationEndTime = new Date(preparationTime);
      preparationEndTime.setHours(17, 0, 0, 0); // 오후 5시로 설정

      // 기기 정보 조회
      const { data: equipment } = await supabase
        .from("equipment")
        .select("name")
        .eq("id", rental.equipment_id)
        .single();

      const { data: preparationSchedule, error: prepError } = await supabase
        .from("schedules")
        .insert({
          schedule_type: "rental",
          rental_id: validated.rental_id,
          client_id: validated.client_id,
          title: equipment ? `${equipment.name} 준비 일정` : "기기 준비 일정",
          description: `대여 일정 전 기기 준비`,
          start_time: preparationTime.toISOString(),
          end_time: preparationEndTime.toISOString(),
          location: validated.location,
          participant_ids: validated.participant_ids || [],
          reminder_minutes: 60, // 준비 일정은 1시간 전 알림
          status: "scheduled",
          notes: `대여 일정 (${scheduleData.id}) 준비`,
          created_by_user_id: userId,
          updated_by_user_id: userId,
        })
        .select()
        .single();

      if (!prepError && preparationSchedule) {
        preparationScheduleId = preparationSchedule.id;
        auditLogger.info("rental_preparation_schedule_created", {
          actorId: userId,
          metadata: {
            preparationScheduleId: preparationSchedule.id,
            rentalScheduleId: scheduleData.id,
            rentalId: validated.rental_id,
          },
        });
      }
    }

    // 7. 성공 감사 로그 기록
    auditLogger.info("rental_schedule_created", {
      actorId: userId,
      metadata: {
        scheduleId: scheduleData.id,
        rentalId: validated.rental_id,
        clientId: validated.client_id,
        title: scheduleData.title,
        startTime: scheduleData.start_time,
        preparationScheduleId,
        autoCreatedPreparation: validated.auto_create_preparation,
      },
      tags: {
        module: "sch",
        action_type: "create",
        schedule_type: "rental",
      },
    });

    // 8. 성공 응답 반환 (201 Created)
    return NextResponse.json(
      {
        ...scheduleData,
        preparation_schedule_id: preparationScheduleId,
      },
      { status: 201 },
    );
  } catch (error) {
    auditLogger.error("rental_schedule_create_exception", {
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

