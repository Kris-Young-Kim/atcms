# 응답 시간 목표 및 모니터링 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 AT-CMP 프로젝트의 응답 시간 목표 및 모니터링 방법을 정의합니다. 사용자 경험을 개선하기 위해 응답 시간을 측정하고 목표를 설정합니다.

---

## 🎯 응답 시간 목표

### 전체 목표

- **평균 응답 시간**: < 2초
- **95%ile 응답 시간**: < 3초
- **99%ile 응답 시간**: < 5초

### 페이지별 목표

| 페이지 | 목표 (초) | 95%ile (초) | 99%ile (초) |
|--------|----------|-------------|-------------|
| 홈페이지 | < 1.5 | < 2.5 | < 4 |
| 로그인 페이지 | < 1.0 | < 2.0 | < 3 |
| 대시보드 | < 2.0 | < 3.0 | < 5 |
| 대상자 목록 | < 2.0 | < 3.0 | < 5 |
| 대상자 상세 | < 1.5 | < 2.5 | < 4 |
| 기기 목록 | < 2.0 | < 3.0 | < 5 |

### API 엔드포인트별 목표

| 엔드포인트 | 목표 (ms) | 95%ile (ms) | 99%ile (ms) |
|-----------|----------|-------------|-------------|
| GET /api/health | < 100 | < 200 | < 500 |
| GET /api/clients | < 500 | < 1000 | < 2000 |
| POST /api/clients | < 800 | < 1500 | < 3000 |
| GET /api/clients/[id] | < 300 | < 600 | < 1200 |
| PUT /api/clients/[id] | < 600 | < 1200 | < 2500 |
| GET /api/equipment | < 500 | < 1000 | < 2000 |
| POST /api/equipment | < 800 | < 1500 | < 3000 |
| POST /api/rentals | < 1000 | < 2000 | < 4000 |

---

## 📊 응답 시간 측정

### 측정 범위

**포함 항목**:
- 페이지 로딩 시간 (TTFB, FCP, LCP)
- API 응답 시간
- 데이터베이스 쿼리 시간
- 네트워크 요청 시간

**측정 도구**:
- Sentry Performance Monitoring
- Vercel Analytics
- 브라우저 DevTools
- 커스텀 성능 추적

### 페이지 로딩 시간 측정

**Core Web Vitals**:
- **TTFB (Time to First Byte)**: < 200ms
- **FCP (First Contentful Paint)**: < 1.8초
- **LCP (Largest Contentful Paint)**: < 2.5초

**측정 방법**:
```typescript
// 자동 측정 (web-vitals.ts에서 처리)
import { reportWebVitals } from "@/lib/performance/web-vitals";

// 브라우저에서 자동으로 측정됨
```

### API 응답 시간 측정

**측정 방법**:
```typescript
import { measureApiPerformance } from "@/lib/performance/api-performance";

export async function GET(request: Request) {
  return measureApiPerformance("/api/clients", "GET", async () => {
    // API 로직
    return NextResponse.json(data);
  });
}
```

**자동 로깅**:
- 모든 API 호출 자동 측정
- Sentry로 전송 (프로덕션 환경)
- 느린 요청 (>500ms) 경고

### 데이터베이스 쿼리 시간 측정

**측정 방법**:
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

## 📈 응답 시간 모니터링

### Sentry Performance Monitoring

**설정 상태**:
- `tracesSampleRate`: 프로덕션 20%, 개발 5%
- `enableTracing`: 활성화
- `browserTracingIntegration`: 활성화

**확인 방법**:
1. Sentry Dashboard → Performance → Transactions
2. 느린 트랜잭션 확인
3. 상세 분석 및 최적화

### Vercel Analytics

**자동 수집**:
- 페이지 로딩 시간
- API 응답 시간
- Core Web Vitals

**확인 방법**:
1. Vercel Dashboard → Analytics → Performance
2. 페이지별 성능 확인
3. 트렌드 분석

### 커스텀 모니터링

**성능 메트릭 수집기**:
```typescript
import { performanceCollector } from "@/lib/performance/web-vitals";

// 메트릭 기록
performanceCollector.record("page_load_time", 1500);

// 통계 조회
const stats = performanceCollector.getStats("page_load_time");
console.log("평균:", stats.avg, "ms");
```

---

## 🚨 느린 응답 알림

### 알림 임계값

**페이지 로딩 시간**:
- 평균 > 2초: 경고 알림
- 평균 > 3초: 긴급 알림

**API 응답 시간**:
- 평균 > 500ms: 경고 알림
- 평균 > 1000ms: 긴급 알림

**데이터베이스 쿼리**:
- 평균 > 300ms: 경고 알림
- 평균 > 500ms: 긴급 알림

### Sentry 알림 설정

**설정 방법**:
1. Sentry Dashboard → Settings → Alerts
2. New Alert Rule 클릭
3. 조건 설정:
   - Metric: `api.performance`
   - Threshold: `> 500ms`
   - Time Window: `1 hour`
4. Actions: Slack #performance 채널

**알림 예시**:
```
⚠️ [Performance] 느린 API 응답 시간

엔드포인트: GET /api/clients
평균 응답 시간: 750ms (목표: 500ms)
기간: 1시간
링크: {sentry_url}
```

---

## 📊 응답 시간 리포트

### 일일 리포트

**포함 내용**:
- 평균 응답 시간
- 느린 요청 목록 (Top 10)
- 성능 트렌드

**생성 방법**:
1. Sentry Dashboard → Performance → Reports
2. 일일 리포트 생성
3. 팀에 공유

### 주간 리포트

**포함 내용**:
- 주간 평균 응답 시간
- 목표 달성 여부
- 개선이 필요한 엔드포인트
- 성능 최적화 우선순위

**생성 방법**:
1. Sentry Dashboard → Performance → Reports
2. 주간 리포트 생성
3. 팀 회의에서 리뷰

---

## 🔧 성능 최적화 우선순위

### P0 (긴급)

**조건**:
- 평균 응답 시간 > 5초
- 95%ile 응답 시간 > 10초

**대응 조치**:
- 즉시 최적화 작업 시작
- 긴급 회의 소집
- 롤백 검토 (필요 시)

### P1 (높음)

**조건**:
- 평균 응답 시간 > 3초
- 95%ile 응답 시간 > 5초

**대응 조치**:
- 1주일 내 최적화 작업
- 성능 분석 및 개선 계획

### P2 (중간)

**조건**:
- 평균 응답 시간 > 2초
- 95%ile 응답 시간 > 3초

**대응 조치**:
- 계획적으로 최적화
- 다음 스프린트에 포함

### P3 (낮음)

**조건**:
- 평균 응답 시간 < 2초
- 최적화 기회 식별

**대응 조치**:
- 여유 시간에 최적화
- 기술 부채로 추적

---

## ✅ 체크리스트

### 초기 설정
- [ ] 응답 시간 측정 설정 확인
- [ ] API 성능 추적 통합 확인
- [ ] 페이지 로딩 시간 측정 확인
- [ ] Sentry Performance Monitoring 확인
- [ ] Vercel Analytics 확인

### 정기 확인
- [ ] 일일 응답 시간 확인
- [ ] 주간 성능 리포트 검토
- [ ] 느린 요청 분석 및 최적화
- [ ] 목표 달성 여부 확인

---

## 📚 참고 자료

- [성능 모니터링 가이드](./performance-monitoring-guide.md)
- [API 성능 측정 유틸리티](../web/src/lib/performance/api-performance.ts)
- [Web Vitals 측정 유틸리티](../web/src/lib/performance/web-vitals.ts)
- [Sentry Performance 문서](https://docs.sentry.io/product/performance/)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 2025-02-03

