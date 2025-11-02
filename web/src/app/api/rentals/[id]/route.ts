import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rentalReturnSchema, RENTAL_STATUS } from "@/lib/validations/rental";

/**
 * GET /api/rentals/[id]
 * 대여 상세 조회
 * Sprint 1: ERM-US-02
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("rentals")
      .select(
        `
        *,
        equipment:equipment_id (
          id,
          name,
          category,
          brand,
          model
        ),
        client:client_id (
          id,
          name,
          contact_phone,
          contact_email
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
    }

    auditLogger.info("rental_viewed", {
      actorId: userId,
      metadata: { rentalId: id },
    });

    return NextResponse.json(data);
  } catch (error) {
    auditLogger.error("rental_fetch_exception", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
