import { NextResponse } from "next/server";

/**
 * GET /api/health
 * 
 * 헬스 체크 엔드포인트
 * 배포 후 검증 및 모니터링에 사용됩니다.
 * 
 * @returns 헬스 체크 응답
 */
export async function GET() {
  try {
    // 기본 헬스 체크 정보
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

