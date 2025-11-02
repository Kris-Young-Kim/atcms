# 응답 시간 모니터링 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 AT-CMP 프로젝트의 응답 시간 모니터링 설정 방법을 설명합니다. 실시간으로 응답 시간을 추적하고 목표를 달성하기 위한 가이드입니다.

---

## 🎯 모니터링 목표

- **실시간 응답 시간 추적**
- **느린 요청 조기 감지**
- **성능 트렌드 분석**
- **자동 알림 발송**

---

## 🔧 응답 시간 측정 설정

### 1. API 응답 시간 측정

**현재 설정**:
- `web/src/lib/performance/api-performance.ts`에서 자동 측정
- 모든 API 호출에 `measureApiPerformance` 적용

**적용 방법**:
```typescript
import { measureApiPerformance } from "@/lib/performance/api-performance";

export async function GET(request: Request) {
  return measureApiPerformance("/api/clients", "GET", async () => {
    // API 로직
    const data = await getClients();
    return NextResponse.json(data);
  });
}
```

**자동 로깅**:
- 모든 API 호출 자동 측정
- 느린 요청 (>500ms) 경고
- 프로덕션 환경에서 Sentry로 전송

### 2. 페이지 로딩 시간 측정

**현재 설정**:
- `web/src/lib/performance/web-vitals.ts`에서 자동 측정
- `web/src/app/providers.tsx`에서 자동 초기화

**측정 항목**:
- TTFB (Time to First Byte)
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

**자동 로깅**:
- 브라우저에서 자동 측정
- 프로덕션 환경에서 Sentry로 전송

### 3. 데이터베이스 쿼리 시간 측정

**현재 설정**:
- `web/src/lib/performance/api-performance.ts`의 `measureQueryPerformance` 사용

**적용 방법**:
```typescript
import { measureQueryPerformance } from "@/lib/performance/api-performance";

const data = await measureQueryPerformance("getClients", async () => {
  return await supabase.from("clients").select("*");
});
```

**자동 로깅**:
- 느린 쿼리 (>300ms) 경고
- 쿼리 통계 수집

---

## 📊 Sentry Performance Monitoring 설정

### 현재 설정 확인

**설정 파일**: `web/sentry.client.config.ts`

**설정 내용**:
```typescript
Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  tracesSampleRate: appEnv === "production" ? 0.2 : 0.05,
  enableTracing: true,
  integrations: [
    Sentry.browserTracingIntegration({
      enableInp: true,
      enableLongTask: true,
    }),
  ],
});
```

**확인 방법**:
1. Sentry Dashboard → Performance → Transactions
2. 느린 트랜잭션 확인
3. 상세 분석 및 최적화

### 성능 메트릭 확인

**API 응답 시간**:
1. Sentry Dashboard → Performance → Transactions
2. 필터: `transaction:api.*`
3. 평균 응답 시간 확인

**페이지 로딩 시간**:
1. Sentry Dashboard → Performance → Transactions
2. 필터: `transaction:page.*`
3. 평균 로딩 시간 확인

---

## 📈 Vercel Analytics 설정

### 자동 수집

**설정 상태**:
- Vercel에 배포하면 자동으로 성능 데이터 수집
- 별도 설정 불필요

**확인 방법**:
1. Vercel Dashboard → 프로젝트 → Analytics
2. Performance 탭 확인
3. 페이지별 성능 확인

### 성능 리포트

**일일 리포트**:
- 자동 생성 (Vercel Analytics)
- 페이지별 평균 응답 시간
- Core Web Vitals 추적

**주간 리포트**:
- 수동 생성 또는 자동화 스크립트
- 성능 트렌드 분석
- 개선 사항 식별

---

## 🚨 느린 응답 알림 설정

### Sentry 알림 설정

**설정 방법**:
1. Sentry Dashboard → Settings → Alerts
2. New Alert Rule 클릭
3. 조건 설정:
   - Alert Type: Performance Alert
   - Metric: `api.performance`
   - Threshold: `> 500ms`
   - Time Window: `1 hour`
4. Actions: Slack #performance 채널

**알림 규칙 예시**:
- 평균 API 응답 시간 > 500ms
- 평균 페이지 로딩 시간 > 2초
- 느린 데이터베이스 쿼리 > 300ms

### 커스텀 알림

**느린 요청 경고**:
```typescript
// api-performance.ts에서 자동 처리
if (duration > 500) {
  console.warn(`[Slow API] ${method} ${endpoint}: ${duration}ms`);
  // Sentry에 전송됨
}
```

---

## 📊 응답 시간 트렌드 추적

### 일일 트렌드

**확인 방법**:
1. Sentry Dashboard → Performance → Trends
2. 일일 평균 응답 시간 확인
3. 트렌드 분석

**목표**:
- 일일 평균 < 2초 유지
- 트렌드가 상승하지 않도록 관리

### 주간 트렌드

**확인 방법**:
1. Sentry Dashboard → Performance → Trends
2. 주간 평균 응답 시간 확인
3. 주간 리포트 생성

**목표**:
- 주간 평균 < 2초 유지
- 개선이 필요한 엔드포인트 식별

---

## 🔍 느린 요청 분석

### 분석 방법

1. **Sentry Performance 분석**:
   - 느린 트랜잭션 선택
   - 타임라인 확인
   - 느린 단계 식별

2. **Vercel Analytics 분석**:
   - 페이지별 성능 확인
   - 느린 페이지 식별

3. **브라우저 DevTools 분석**:
   - Network 탭 확인
   - Performance 탭 확인
   - 느린 리소스 식별

### 최적화 우선순위

**우선순위 설정 기준**:
1. **P0**: 평균 응답 시간 > 5초
2. **P1**: 평균 응답 시간 > 3초
3. **P2**: 평균 응답 시간 > 2초
4. **P3**: 최적화 기회

---

## ✅ 체크리스트

### 초기 설정
- [ ] API 성능 측정 통합 확인
- [ ] 페이지 로딩 시간 측정 확인
- [ ] Sentry Performance Monitoring 확인
- [ ] Vercel Analytics 확인
- [ ] 알림 설정 확인

### 정기 확인
- [ ] 일일 응답 시간 확인
- [ ] 주간 성능 리포트 검토
- [ ] 느린 요청 분석 및 최적화
- [ ] 목표 달성 여부 확인

---

## 📚 참고 자료

- [응답 시간 목표 및 모니터링 가이드](./response-time-targets.md)
- [성능 모니터링 가이드](./performance-monitoring-guide.md)
- [API 성능 측정 유틸리티](../web/src/lib/performance/api-performance.ts)
- [Sentry Performance 문서](https://docs.sentry.io/product/performance/)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 2025-02-03

