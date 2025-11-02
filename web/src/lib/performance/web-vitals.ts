import { onCLS, onFID, onLCP, onTTFB } from "web-vitals";

/**
 * Web Vitals 성능 측정 및 리포트
 * 
 * Core Web Vitals를 측정하고 분석 도구로 전송합니다.
 * 
 * @see https://web.dev/vitals/
 */

/**
 * Web Vitals 리포트 함수 타입
 */
type ReportHandler = (metric: {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating: "good" | "needs-improvement" | "poor";
}) => void;

/**
 * Web Vitals 메트릭을 로깅하는 리포트 핸들러
 * 
 * @param metric - Web Vitals 메트릭 데이터
 */
function reportMetric(metric: {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating: "good" | "needs-improvement" | "poor";
}): void {
  const { name, value, rating } = metric;

  // 콘솔 로그
  console.log(`[Web Vitals] ${name}: ${value.toFixed(2)}ms (${rating})`);

  // 성능이 나쁜 경우 경고
  if (rating === "poor") {
    console.warn(`[Performance Warning] ${name} is ${rating}: ${value.toFixed(2)}ms`);
  }

  // TODO: 실제 프로덕션에서는 Sentry나 Analytics로 전송
  // if (process.env.NODE_ENV === 'production') {
  //   // Sentry에 전송
  //   // 또는 Analytics API로 전송
  // }
}

/**
 * Web Vitals 측정 초기화
 * 
 * 브라우저에서 Core Web Vitals를 측정하고 리포트합니다.
 * 
 * @example
 * ```typescript
 * // _app.tsx 또는 layout.tsx에서 호출
 * if (typeof window !== 'undefined') {
 *   reportWebVitals();
 * }
 * ```
 */
export function reportWebVitals(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Core Web Vitals 측정
  onCLS(reportMetric); // Cumulative Layout Shift
  onFID(reportMetric); // First Input Delay
  onLCP(reportMetric); // Largest Contentful Paint
  onTTFB(reportMetric); // Time to First Byte
}

/**
 * 성능 메트릭 수집기
 * 
 * 커스텀 성능 메트릭을 수집합니다.
 */
export class PerformanceCollector {
  private metrics: Map<string, number[]> = new Map();

  /**
   * 성능 메트릭 기록
   * 
   * @param name - 메트릭 이름
   * @param value - 메트릭 값 (밀리초)
   */
  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)?.push(value);
  }

  /**
   * 메트릭 평균값 계산
   * 
   * @param name - 메트릭 이름
   * @returns 평균값 (밀리초)
   */
  getAverage(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return 0;
    }
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * 메트릭 통계 반환
   * 
   * @param name - 메트릭 이름
   * @returns 통계 객체
   */
  getStats(name: string): { avg: number; min: number; max: number; count: number } {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  /**
   * 모든 메트릭 초기화
   */
  clear(): void {
    this.metrics.clear();
  }
}

// 싱글톤 인스턴스
export const performanceCollector = new PerformanceCollector();

