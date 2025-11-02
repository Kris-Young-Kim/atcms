# 성능 벤치마크 기준 설정

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 AT-CMP 프로젝트의 성능 벤치마크 기준을 정의합니다. 애플리케이션의 성능 목표와 측정 방법을 명확히 합니다.

---

## 🎯 성능 목표

### Core Web Vitals

**LCP (Largest Contentful Paint)**:
- 목표: **2.5초 이하**
- 허용 범위: 2.5초 ~ 4.0초
- 개선 필요: 4.0초 초과

**FID (First Input Delay)**:
- 목표: **100ms 이하**
- 허용 범위: 100ms ~ 300ms
- 개선 필요: 300ms 초과

**CLS (Cumulative Layout Shift)**:
- 목표: **0.1 이하**
- 허용 범위: 0.1 ~ 0.25
- 개선 필요: 0.25 초과

### 페이지 로딩 성능

**TTFB (Time to First Byte)**:
- 목표: **200ms 이하**
- 허용 범위: 200ms ~ 500ms
- 개선 필요: 500ms 초과

**FCP (First Contentful Paint)**:
- 목표: **1.8초 이하**
- 허용 범위: 1.8초 ~ 3.0초
- 개선 필요: 3.0초 초과

**TTI (Time to Interactive)**:
- 목표: **3.8초 이하**
- 허용 범위: 3.8초 ~ 7.3초
- 개선 필요: 7.3초 초과

### API 응답 시간

**기본 API 엔드포인트**:
- 목표: **200ms 이하**
- 허용 범위: 200ms ~ 500ms
- 개선 필요: 500ms 초과

**데이터베이스 쿼리**:
- 목표: **100ms 이하**
- 허용 범위: 100ms ~ 300ms
- 개선 필요: 300ms 초과

**파일 업로드**:
- 목표: **2초 이하** (1MB 파일 기준)
- 허용 범위: 2초 ~ 5초
- 개선 필요: 5초 초과

---

## 📊 측정 방법

### 1. Lighthouse CI

**설정 파일**: `.lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/dashboard",
        "http://localhost:3000/clients",
        "http://localhost:3000/equipment"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 1800}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### 2. Web Vitals 측정

**설정 파일**: `web/src/lib/performance/web-vitals.ts`

```typescript
import { onCLS, onFID, onLCP } from 'web-vitals';

export function reportWebVitals() {
  onCLS(console.log);
  onFID(console.log);
  onLCP(console.log);
}
```

### 3. API 성능 측정

**미들웨어**: `web/src/lib/performance/api-performance.ts`

```typescript
export async function measureApiPerformance(
  endpoint: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const start = performance.now();
  const response = await handler();
  const duration = performance.now() - start;

  // 성능 로그 기록
  console.log(`[API Performance] ${endpoint}: ${duration}ms`);

  // 느린 요청 알림 (500ms 초과)
  if (duration > 500) {
    console.warn(`[Slow API] ${endpoint}: ${duration}ms`);
  }

  return response;
}
```

---

## 🔍 벤치마크 테스트

### 1. 페이지 로딩 테스트

**테스트 파일**: `web/src/__tests__/performance/page-load.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('페이지 로딩 성능', () => {
  test('대시보드 페이지는 3초 이내에 로드되어야 함', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });
});
```

### 2. API 응답 시간 테스트

**테스트 파일**: `web/src/__tests__/performance/api-response.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('API 응답 시간', () => {
  test('GET /api/clients는 500ms 이내에 응답해야 함', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/clients');
    const responseTime = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(500);
  });
});
```

---

## 📈 성능 모니터링

### 1. Vercel Analytics

Vercel 배포 시 자동으로 Web Vitals를 측정합니다:
- Real User Monitoring (RUM)
- Core Web Vitals 추적
- 페이지별 성능 분석

### 2. Sentry Performance Monitoring

**설정 파일**: `web/src/lib/sentry.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0, // 성능 모니터링 활성화
  environment: process.env.NODE_ENV,
});
```

### 3. 로그 분석

**성능 로그 형식**:
```
[PERF] GET /api/clients - 234ms
[PERF] POST /api/clients - 456ms
[SLOW] GET /api/dashboard/stats - 789ms (>500ms)
```

---

## ✅ 성능 체크리스트

### 개발 시
- [ ] 페이지 로딩 시간 3초 이내
- [ ] API 응답 시간 500ms 이내
- [ ] 이미지 최적화 (WebP, lazy loading)
- [ ] 코드 스플리팅 적용
- [ ] 불필요한 리렌더링 방지

### 배포 전
- [ ] Lighthouse 성능 점수 90점 이상
- [ ] Core Web Vitals 목표 달성
- [ ] 번들 크기 최적화
- [ ] 데이터베이스 쿼리 최적화
- [ ] CDN 설정 확인

### 배포 후
- [ ] Vercel Analytics 확인
- [ ] Sentry 성능 모니터링 확인
- [ ] 실제 사용자 성능 측정
- [ ] 느린 페이지 식별 및 개선

---

## 🚀 성능 개선 전략

### 1. 코드 최적화
- React.memo 사용
- useMemo, useCallback 활용
- 동적 import 사용

### 2. 데이터베이스 최적화
- 인덱스 추가
- 쿼리 최적화
- 연결 풀링

### 3. 네트워크 최적화
- 이미지 최적화
- 코드 스플리팅
- CDN 활용

### 4. 캐싱 전략
- API 응답 캐싱
- 정적 자산 캐싱
- 브라우저 캐싱

---

## 📚 참고 자료

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Sentry Performance](https://docs.sentry.io/product/performance/)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 월 1회 성능 리포트 검토

