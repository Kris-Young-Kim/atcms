# 성능 모니터링 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 AT-CMP 프로젝트의 성능 모니터링 시스템 설정 및 사용 방법을 설명합니다. Core Web Vitals와 커스텀 성능 메트릭을 수집하여 사용자 경험을 개선합니다.

---

## 🎯 모니터링 목표

### Core Web Vitals 목표

- **LCP (Largest Contentful Paint)**: 2.5초 이하
- **FID (First Input Delay)**: 100ms 이하
- **CLS (Cumulative Layout Shift)**: 0.1 이하
- **TTFB (Time to First Byte)**: 200ms 이하

---

## 🔧 설정 방법

### 1. Web Vitals 통합

**자동 수집**:
- `web/src/app/providers.tsx`에서 자동으로 Web Vitals 측정 시작
- 프로덕션 환경에서 Sentry로 자동 전송

**수동 측정**:
```typescript
import { reportWebVitals } from "@/lib/performance/web-vitals";

// 클라이언트 컴포넌트에서
useEffect(() => {
  if (typeof window !== "undefined") {
    reportWebVitals();
  }
}, []);
```

### 2. Sentry Performance Monitoring

**설정 파일**: `web/sentry.client.config.ts`

**현재 설정**:
- `tracesSampleRate`: 프로덕션 20%, 개발 5%
- `enableTracing`: 활성화
- `browserTracingIntegration`: 활성화 (INP, Long Task 수집)

**성능 모니터링 활성화 확인**:
```typescript
// Sentry 설정 확인
console.log("Sentry Tracing:", Sentry.getClient()?.getOptions().enableTracing);
```

### 3. Vercel Analytics

**자동 활성화**:
- Vercel에 배포하면 자동으로 Web Vitals 수집
- Vercel Dashboard → Analytics 탭에서 확인 가능

**수동 활성화** (필요 시):
```typescript
// next.config.ts
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // Vercel Analytics 자동 활성화됨
};
```

---

## 📊 성능 메트릭 수집

### Core Web Vitals

**자동 수집**:
- LCP: 가장 큰 콘텐츠 렌더링 시간
- FID: 첫 사용자 입력 지연 시간
- CLS: 누적 레이아웃 이동
- TTFB: 첫 바이트까지의 시간

**수집 위치**:
- Sentry Performance Dashboard
- Vercel Analytics Dashboard
- 브라우저 콘솔 (개발 모드)

### 커스텀 성능 메트릭

**API 응답 시간**:
```typescript
import { measureApiPerformance } from "@/lib/performance/api-performance";

export async function GET(request: Request) {
  return measureApiPerformance("/api/clients", "GET", async () => {
    // API 로직
    return NextResponse.json(data);
  });
}
```

**데이터베이스 쿼리 시간**:
```typescript
import { measureQueryPerformance } from "@/lib/performance/api-performance";

const data = await measureQueryPerformance("getClients", async () => {
  return await supabase.from("clients").select("*");
});
```

### 성능 메트릭 수집기

**사용 방법**:
```typescript
import { performanceCollector } from "@/lib/performance/web-vitals";

// 메트릭 기록
performanceCollector.record("page_load_time", 1500);

// 통계 조회
const stats = performanceCollector.getStats("page_load_time");
console.log("평균:", stats.avg, "ms");
```

---

## 📈 성능 대시보드

### Sentry Performance Dashboard

**접근 방법**:
1. Sentry Dashboard → Performance 탭
2. Web Vitals 메트릭 확인
3. 느린 트랜잭션 분석

**확인 가능한 메트릭**:
- Core Web Vitals (LCP, FID, CLS, TTFB)
- 페이지 로딩 시간
- API 응답 시간
- 느린 쿼리

### Vercel Analytics Dashboard

**접근 방법**:
1. Vercel Dashboard → 프로젝트 → Analytics 탭
2. Web Vitals 차트 확인
3. 페이지별 성능 분석

**확인 가능한 메트릭**:
- Core Web Vitals 트렌드
- 페이지별 성능 비교
- 사용자별 성능 데이터

---

## 🚨 성능 알림 설정

### Sentry 알림 설정

**성능 저하 알림**:
1. Sentry Dashboard → Settings → Alerts
2. New Alert Rule 생성
3. 조건 설정:
   - Metric: `web_vitals.lcp`
   - Threshold: `> 2500ms`
   - Action: Slack/Email 알림

**알림 규칙 예시**:
- LCP가 2.5초 초과 시 알림
- FID가 100ms 초과 시 알림
- CLS가 0.1 초과 시 알림

### 커스텀 알림

**느린 API 알림**:
```typescript
// api-performance.ts에서 자동 처리
if (duration > 500) {
  console.warn(`[Slow API] ${method} ${endpoint}: ${duration}ms`);
  // Sentry에 전송 가능
}
```

---

## 📊 성능 리포트

### 주간 성능 리포트

**생성 방법**:
1. Sentry Dashboard → Performance → Reports
2. 주간 리포트 생성
3. 팀에 공유

**포함 내용**:
- Core Web Vitals 평균값
- 성능 트렌드
- 개선이 필요한 페이지
- 성능 회귀 감지

### 성능 개선 우선순위

**우선순위 설정 기준**:
1. **P0**: Core Web Vitals 목표 미달
2. **P1**: 느린 API 엔드포인트 (>500ms)
3. **P2**: 느린 페이지 로딩 (>3초)
4. **P3**: 성능 최적화 기회

---

## 🔍 성능 분석 방법

### 1. Sentry Performance 분석

**트랜잭션 분석**:
1. Sentry Dashboard → Performance → Transactions
2. 느린 트랜잭션 선택
3. 상세 분석:
   - 타임라인 확인
   - 느린 단계 식별
   - 데이터베이스 쿼리 분석

### 2. Vercel Analytics 분석

**페이지별 성능 분석**:
1. Vercel Dashboard → Analytics → Pages
2. 페이지별 Web Vitals 확인
3. 성능 저하 페이지 식별

### 3. Chrome DevTools 분석

**Performance 탭 사용**:
1. Chrome DevTools → Performance 탭
2. 레코딩 시작
3. 페이지 로드 또는 상호작용
4. 레코딩 중지 후 분석

---

## ✅ 체크리스트

### 초기 설정
- [ ] Web Vitals 통합 완료
- [ ] Sentry Performance Monitoring 활성화
- [ ] Vercel Analytics 확인
- [ ] 성능 메트릭 수집 확인

### 정기 확인
- [ ] 주간 성능 리포트 검토
- [ ] Core Web Vitals 목표 달성 확인
- [ ] 느린 페이지 식별 및 개선
- [ ] 성능 회귀 감지

---

## 📚 참고 자료

- [Web Vitals 공식 문서](https://web.dev/vitals/)
- [Sentry Performance 문서](https://docs.sentry.io/product/performance/)
- [Vercel Analytics 문서](https://vercel.com/docs/analytics)
- [성능 벤치마크 기준](./performance-benchmark.md)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 2025-02-03

