/**
 * API 성능 측정 유틸리티
 *
 * API 엔드포인트의 응답 시간을 측정하고 로깅합니다.
 * 목표: 평균 < 2초, 95%ile < 3초, 99%ile < 5초
 */

/**
 * API 성능 측정 결과
 */
interface ApiPerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

/**
 * API 성능 측정 함수
 *
 * API 핸들러의 실행 시간을 측정하고 로깅합니다.
 *
 * @param endpoint - API 엔드포인트 경로
 * @param method - HTTP 메서드
 * @param handler - API 핸들러 함수
 * @returns API 응답
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   return measureApiPerformance('/api/clients', 'GET', async () => {
 *     // API 로직
 *     return NextResponse.json(data);
 *   });
 * }
 * ```
 */
export async function measureApiPerformance<T>(
  endpoint: string,
  method: string,
  handler: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  let status = 200;

  try {
    const result = await handler();

    // NextResponse인 경우 status 추출
    if (result && typeof result === "object" && "status" in result) {
      status = (result as { status: number }).status;
    }

    return result;
  } catch (error) {
    status = 500;
    throw error;
  } finally {
    const duration = performance.now() - start;

    // 성능 메트릭 기록
    const metric: ApiPerformanceMetric = {
      endpoint,
      method,
      duration: Math.round(duration),
      status,
      timestamp: Date.now(),
    };

    // 로그 출력
    logApiPerformance(metric);

    // 느린 요청 경고 (500ms 초과)
    if (duration > 500) {
      console.warn(`[Slow API] ${method} ${endpoint}: ${duration.toFixed(2)}ms`);
    }

    // 프로덕션 환경에서 Sentry로 전송
    if (process.env.NODE_ENV === "production") {
      await sendToSentry(metric);
    }
  }
}

/**
 * Sentry로 API 성능 메트릭 전송
 *
 * @param metric - API 성능 메트릭 데이터
 */
async function sendToSentry(metric: ApiPerformanceMetric): Promise<void> {
  try {
    const Sentry = await import("@sentry/nextjs").catch(() => null);
    if (Sentry && Sentry.metrics) {
      Sentry.metrics.distribution("api.performance", metric.duration, {
        unit: "millisecond",
        tags: {
          endpoint: metric.endpoint,
          method: metric.method,
          status: metric.status.toString(),
        },
      });

      // 느린 요청 경고 (500ms 초과)
      if (metric.duration > 500) {
        Sentry.captureMessage(`Slow API: ${metric.method} ${metric.endpoint}`, {
          level: "warning",
          tags: {
            endpoint: metric.endpoint,
            method: metric.method,
            duration: metric.duration,
            status: metric.status,
          },
        });
      }
    }
  } catch (error) {
    // Sentry 전송 실패 시 무시
    // 개발 환경에서만 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to send API performance to Sentry:", error);
    }
  }
}

/**
 * API 성능 메트릭 로깅
 *
 * @param metric - 성능 메트릭 데이터
 */
function logApiPerformance(metric: ApiPerformanceMetric): void {
  const { endpoint, method, duration, status } = metric;

  // 성능 로그 포맷
  const logMessage = `[API Performance] ${method} ${endpoint} - ${duration}ms (${status})`;

  // 상태 코드에 따라 로그 레벨 결정
  if (status >= 500) {
    console.error(logMessage);
  } else if (status >= 400) {
    console.warn(logMessage);
  } else if (process.env.NODE_ENV === "development") {
    // 개발 환경에서만 일반 로그 출력
    console.warn(logMessage);
  }
}

/**
 * 데이터베이스 쿼리 성능 측정
 *
 * @param queryName - 쿼리 이름
 * @param queryFn - 쿼리 함수
 * @returns 쿼리 결과
 *
 * @example
 * ```typescript
 * const data = await measureQueryPerformance('getClients', async () => {
 *   return await supabase.from('clients').select('*');
 * });
 * ```
 */
export async function measureQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();

  try {
    const result = await queryFn();
    return result;
  } finally {
    const duration = performance.now() - start;

    // 느린 쿼리 경고 (300ms 초과)
    if (duration > 300) {
      console.warn(`[Slow Query] ${queryName}: ${duration.toFixed(2)}ms`);
    } else if (process.env.NODE_ENV === "development") {
      // 개발 환경에서만 일반 로그 출력
      console.warn(`[Query Performance] ${queryName}: ${duration.toFixed(2)}ms`);
    }
  }
}
