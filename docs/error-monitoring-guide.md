# 에러 모니터링 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 AT-CMP 프로젝트의 에러 모니터링 설정 방법을 설명합니다. Sentry를 활용하여 에러를 추적하고 목표 에러율을 달성하기 위한 가이드입니다.

---

## 🎯 모니터링 목표

- **실시간 에러 추적**
- **에러율 목표 달성 (< 0.5%)**
- **에러 조기 감지**
- **자동 알림 발송**

---

## 🔧 Sentry 에러 모니터링 설정

### 현재 설정

**클라이언트 설정**: `web/sentry.client.config.ts`

```typescript
Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  tracesSampleRate: appEnv === "production" ? 0.2 : 0.05,
  replaysSessionSampleRate: appEnv === "production" ? 0.05 : 0,
  replaysOnErrorSampleRate: 1.0,
  enableTracing: true,
  integrations: [
    Sentry.browserTracingIntegration({
      enableInp: true,
      enableLongTask: true,
    }),
  ],
});
```

**서버 설정**: `web/sentry.server.config.ts`

```typescript
Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  tracesSampleRate: appEnv === "production" ? 0.2 : 0.05,
});
```

### 자동 수집 항목

**프론트엔드**:
- JavaScript 에러
- React 에러 경계 에러
- 미처리 Promise rejection
- 네트워크 에러

**백엔드**:
- API 에러 (5xx, 4xx)
- 서버 측 예외
- 데이터베이스 에러

### 에러 분류

**자동 분류**:
- Sentry가 자동으로 에러 유형 분류
- 스택 트레이스 분석
- 에러 발생 컨텍스트 수집

**수동 분류**:
```typescript
Sentry.captureException(error, {
  level: "error",
  tags: {
    error_type: "api_error",
    priority: "p1",
  },
});
```

---

## 📊 에러율 측정

### 전체 에러율

**측정 방법**:
1. Sentry Dashboard → Issues → Statistics
2. 에러 발생 횟수 확인
3. 전체 요청 수 대비 에러율 계산

**계산식**:
```
전체 에러율 = (Sentry 에러 수 / 전체 요청 수) × 100
```

### API 에러율

**측정 방법**:
1. Sentry Dashboard → Performance → Transactions
2. 필터: `status:>=400`
3. 에러율 계산

**계산식**:
```
API 에러율 = (HTTP 4xx/5xx 수 / 전체 API 요청 수) × 100
```

### 프론트엔드 에러율

**측정 방법**:
1. Sentry Dashboard → Issues
2. 필터: `environment:client`
3. 에러율 계산

**계산식**:
```
프론트엔드 에러율 = (JavaScript 에러 수 / 페이지 뷰 수) × 100
```

---

## 🚨 에러 알림 설정

### Sentry 알림 설정

**설정 방법**:
1. Sentry Dashboard → Settings → Alerts
2. New Alert Rule 클릭
3. 조건 설정:
   - Alert Type: Issue Alert
   - Trigger: New Issue 또는 Issue Frequency
   - Threshold: 에러 발생 횟수 또는 에러율
4. Actions: Slack #alerts 채널

**알림 규칙 예시**:

#### 1. 새로운 에러 타입 알림

**조건**:
- Trigger: New Issue
- Action: 즉시 알림

**알림 예시**:
```
🔔 [New Error] 새로운 에러 타입 발견

에러: {error_message}
프로젝트: AT-CMP
환경: {environment}
링크: {sentry_url}
```

#### 2. 에러 발생 빈도 알림

**조건**:
- Trigger: Issue Frequency
- Threshold: 1시간에 10회 이상
- Action: Slack #alerts 채널

**알림 예시**:
```
⚠️ [Error Frequency] 에러 발생 빈도 증가

에러: {error_message}
발생 횟수: 15회 (1시간)
프로젝트: AT-CMP
링크: {sentry_url}
```

#### 3. 에러율 임계값 알림

**조건**:
- Trigger: Error Rate
- Threshold: > 0.5%
- Action: Slack #alerts 채널

**알림 예시**:
```
🚨 [Error Rate] 에러율 임계값 초과

현재 에러율: 0.6% (목표: 0.5%)
에러 발생 횟수: 60 (1시간)
프로젝트: AT-CMP
링크: {sentry_url}
```

### Slack 통합 설정

**설정 방법**:
1. Sentry Dashboard → Settings → Integrations
2. Slack 통합 선택
3. 워크스페이스 연결
4. 알림 채널 설정:
   - `#alerts`: 에러 알림
   - `#performance`: 성능 관련 알림

---

## 📈 에러율 트렌드 추적

### 일일 트렌드

**확인 방법**:
1. Sentry Dashboard → Issues → Trends
2. 일일 에러 발생 횟수 확인
3. 에러율 트렌드 확인

**목표**:
- 일일 에러율 < 0.5% 유지
- 트렌드가 상승하지 않도록 관리

### 주간 트렌드

**확인 방법**:
1. Sentry Dashboard → Issues → Trends
2. 주간 에러 발생 횟수 확인
3. 주간 리포트 생성

**목표**:
- 주간 평균 에러율 < 0.5% 유지
- 개선이 필요한 에러 타입 식별

---

## 🔍 에러 분석

### 에러 상세 분석

**Sentry Dashboard**:
1. 에러 선택
2. 상세 정보 확인:
   - 스택 트레이스
   - 발생 컨텍스트
   - 사용자 영향 범위
   - 발생 빈도

**분석 항목**:
- 에러 발생 원인
- 영향 받는 사용자 수
- 재현 가능 여부
- 우선순위 결정

### 에러 해결 우선순위

**우선순위 설정 기준**:
1. **P0**: 치명적 에러 (즉시 수정)
2. **P1**: 높은 에러 (24시간 내 수정)
3. **P2**: 중간 에러 (1주일 내 수정)
4. **P3**: 낮은 에러 (계획적으로 수정)

---

## ✅ 체크리스트

### 초기 설정
- [ ] Sentry 에러 모니터링 확인
- [ ] 에러율 측정 설정 확인
- [ ] 알림 규칙 설정 확인
- [ ] Slack 통합 설정 확인

### 정기 확인
- [ ] 일일 에러율 확인
- [ ] 주간 에러 리포트 검토
- [ ] 에러 해결 프로세스 준수
- [ ] 목표 달성 여부 확인

---

## 📚 참고 자료

- [에러율 목표 및 모니터링 가이드](./error-rate-targets.md)
- [알림 설정 가이드](./alert-configuration.md)
- [Sentry 설정 파일](../web/sentry.client.config.ts)
- [Sentry 에러 모니터링 문서](https://docs.sentry.io/product/issues/)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 2025-02-03

