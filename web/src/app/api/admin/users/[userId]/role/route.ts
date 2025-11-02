import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { auditLogger } from "@/lib/logger/auditLogger";

/**
 * PUT /api/admin/users/[userId]/role
 * 사용자 역할 설정 (관리자만 가능)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId: currentUserId } = await auth();

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 현재 사용자가 관리자인지 확인
    // 개발 환경에서는 모든 사용자가 관리자 권한을 가질 수 있음
    const isDevelopment = process.env.NODE_ENV === "development";

    if (!isDevelopment) {
      // 프로덕션에서는 실제 관리자 권한 확인 필요
      const currentUser = await clerkClient.users.getUser(currentUserId);
      const currentUserRole = (currentUser.publicMetadata?.role as string) || "";

      if (currentUserRole !== "admin") {
        auditLogger.warn("admin_role_update_forbidden", {
          actorId: currentUserId,
          metadata: {
            reason: "Not an admin",
            currentUserRole,
          },
          tags: { security: "access_control" },
        });
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
    }

    const { userId: targetUserId } = await params;
    const body = await request.json();
    const { role } = body;

    // 역할 유효성 검사
    const validRoles = ["admin", "leader", "specialist", "socialWorker", "technician"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 },
      );
    }

    // Clerk 사용자 역할 업데이트
    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: {
        role,
      },
    });

    auditLogger.info("user_role_updated", {
      actorId: currentUserId,
      metadata: {
        targetUserId,
        role,
      },
      tags: { security: "user_management" },
    });

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      userId: targetUserId,
      role,
    });
  } catch (error) {
    auditLogger.error("user_role_update_failed", {
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

