# 성능 측정 도구 통합 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 AT-CMP 프로젝트의 성능 측정 도구 통합 방법을 설명합니다. Lighthouse CI, 성능 벤치마크, 그리고 다양한 모니터링 도구들을 통합하여 성능을 자동으로 측정하고 추적합니다.

---

## 🎯 통합 목표

1. **자동 성능 측정**
2. **성능 회귀 조기 발견**
3. **통합 성능 대시보드**
4. **성능 리포트 자동 생성**

---

## 🔧 통합된 도구

### 1. Lighthouse CI

**설정 파일**: `web/.lighthouserc.json`

**기능**:
- Core Web Vitals 측정
- 성능 점수 측정 (Performance, Accessibility, Best Practices, SEO)
- 성능 회귀 감지
- 자동 리포트 생성

**CI/CD 통합**:
- GitHub Actions 워크플로우: `.github/workflows/performance-tests.yml`
- PR 시 자동 실행
- 주간 스케줄 실행 (매주 일요일)

**사용 방법**:
```bash
# 로컬 실행
cd web
npm install -g @lhci/cli@latest
lhci autorun --config=.lighthouserc.json

# CI에서 자동 실행됨
```

### 2. Web Vitals 측정

**설정 파일**: `web/src/lib/performance/web-vitals.ts`

**기능**:
- Core Web Vitals 실시간 측정
- Sentry로 자동 전송 (프로덕션)
- 성능 메트릭 수집

**통합**:
- `web/src/app/providers.tsx`에서 자동 초기화
- 브라우저에서 자동 측정

### 3. API 성능 측정

**설정 파일**: `web/src/lib/performance/api-performance.ts`

**기능**:
- API 응답 시간 측정
- 느린 요청 경고 (>500ms)
- Sentry로 자동 전송 (프로덕션)

**사용 방법**:
```typescript
import { measureApiPerformance } from "@/lib/performance/api-performance";

export async function GET(request: Request) {
  return measureApiPerformance("/api/clients", "GET", async () => {
    // API 로직
    return NextResponse.json(data);
  });
}
```

### 4. Sentry Performance Monitoring

**설정 파일**: `web/sentry.client.config.ts`, `web/sentry.server.config.ts`

**기능**:
- 성능 트랜잭션 추적
- 느린 트랜잭션 감지
- 성능 대시보드 제공

**통합**:
- 자동으로 성능 데이터 수집
- Sentry Dashboard에서 확인 가능

### 5. Vercel Analytics

**설정**:
- Vercel에 배포하면 자동 활성화
- 별도 설정 불필요

**기능**:
- Real User Monitoring (RUM)
- Core Web Vitals 추적
- 페이지별 성능 분석

---

## 📊 통합 성능 대시보드

### 구성 요소

1. **Lighthouse CI 결과**:
   - 성능 점수 (Performance, Accessibility, Best Practices, SEO)
   - Core Web Vitals 메트릭
   - 성능 트렌드

2. **Sentry Performance**:
   - 느린 트랜잭션 목록
   - 성능 분포 분석
   - 사용자 영향 범위

3. **Vercel Analytics**:
   - 실제 사용자 성능 데이터
   - 페이지별 성능 분석
   - 지리적 분포

### 대시보드 접근 방법

**Sentry Dashboard**:
1. Sentry Dashboard → Performance
2. 성능 트랜잭션 확인
3. 느린 트랜잭션 분석

**Vercel Dashboard**:
1. Vercel Dashboard → 프로젝트 → Analytics
2. Performance 탭 확인
3. 페이지별 성능 확인

**GitHub Actions**:
1. GitHub 저장소 → Actions → Performance Tests
2. 실행 결과 확인
3. 아티팩트 다운로드

---

## 🚀 CI/CD 통합

### GitHub Actions 워크플로우

**파일**: `.github/workflows/performance-tests.yml`

**실행 트리거**:
- `push` to `main` or `develop`
- `pull_request` to `main` or `develop`
- 주간 스케줄 (매주 일요일)
- 수동 실행 (`workflow_dispatch`)

**작업 단계**:
1. **Lighthouse CI**: 성능 점수 측정
2. **Performance Benchmark**: 성능 벤치마크 실행
3. **Performance Report**: 통합 리포트 생성

**결과**:
- Lighthouse 결과 아티팩트 업로드
- 성능 벤치마크 결과 아티팩트 업로드
- PR에 성능 리포트 자동 코멘트

---

## 📈 성능 리포트

### 자동 생성 리포트

**포함 내용**:
- Lighthouse CI 결과
- 성능 벤치마크 결과
- 성능 트렌드 분석
- 개선 사항 및 권장사항

**생성 주기**:
- PR마다 생성
- 주간 자동 생성 (매주 일요일)

**확인 방법**:
1. GitHub Actions → Performance Tests → 실행 결과
2. 아티팩트 다운로드
3. PR 코멘트 확인

### 수동 리포트 생성

**Sentry 리포트**:
1. Sentry Dashboard → Performance → Reports
2. 리포트 생성
3. 팀에 공유

**Vercel 리포트**:
1. Vercel Dashboard → Analytics → Export
2. 데이터 다운로드
3. Excel 또는 Google Sheets로 분석

---

## 🔍 성능 회귀 감지

### 자동 감지

**Lighthouse CI**:
- 성능 점수 임계값 미달 시 실패
- Core Web Vitals 목표 미달 시 실패
- CI에서 자동으로 감지

**Sentry**:
- 성능 트렌드 분석
- 느린 트랜잭션 자동 감지
- 알림 발송

**Vercel Analytics**:
- 성능 트렌드 확인
- 성능 저하 페이지 식별

### 대응 절차

1. **성능 회귀 발견**:
   - CI 실패 확인
   - Sentry 알림 확인
   - 성능 리포트 검토

2. **원인 분석**:
   - 변경사항 확인
   - 성능 병목 지점 식별
   - 영향 범위 파악

3. **개선 조치**:
   - 코드 최적화
   - 쿼리 최적화
   - 캐싱 전략 개선

---

## ✅ 체크리스트

### 초기 설정
- [ ] Lighthouse CI 설정 확인
- [ ] GitHub Actions 워크플로우 확인
- [ ] Sentry Performance Monitoring 확인
- [ ] Vercel Analytics 확인
- [ ] 성능 벤치마크 설정 확인

### 정기 확인
- [ ] 주간 성능 리포트 검토
- [ ] 성능 회귀 확인
- [ ] 성능 목표 달성 여부 확인
- [ ] 개선 사항 식별 및 적용

---

## 📚 참고 자료

- [성능 벤치마크 기준](./performance-benchmark.md)
- [성능 모니터링 가이드](./performance-monitoring-guide.md)
- [Lighthouse CI 문서](https://github.com/GoogleChrome/lighthouse-ci)
- [Sentry Performance 문서](https://docs.sentry.io/product/performance/)
- [Vercel Analytics 문서](https://vercel.com/docs/analytics)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 2025-02-03

