# 알림 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 AT-CMP 프로젝트의 알림 설정 방법을 설명합니다. 에러, 성능 문제, 배포 상태 등을 실시간으로 모니터링하고 알림을 받을 수 있습니다.

---

## 🎯 알림 목표

1. **실시간 문제 감지**
2. **빠른 대응 시간 확보**
3. **팀원 간 정보 공유**
4. **시스템 안정성 향상**

---

## 🔔 Sentry 알림 설정

### 1. 에러 알림 규칙

#### 치명적 에러 알림 (P0)

**설정 방법**:
1. Sentry Dashboard → Settings → Alerts
2. New Alert Rule 클릭
3. 설정:
   - **Alert Name**: `Critical Errors (P0)`
   - **Conditions**:
     - Issue Level = `fatal`
     - 또는 Issue Level = `error` AND Tags contains `critical=true`
   - **Actions**:
     - Slack: `#alerts` 채널
     - Email: 팀 이메일 주소
   - **Frequency**: 즉시 알림

**알림 내용**:
```
🚨 [Critical] 새로운 치명적 에러 발생

에러: {error_message}
프로젝트: AT-CMP
환경: {environment}
발생 횟수: {count}
링크: {sentry_url}
```

#### 자주 발생하는 에러 알림

**설정 방법**:
1. Sentry Dashboard → Settings → Alerts
2. New Alert Rule 클릭
3. 설정:
   - **Alert Name**: `Frequent Errors`
   - **Conditions**:
     - Issue occurs more than 10 times in 1 hour
   - **Actions**:
     - Slack: `#alerts` 채널
   - **Frequency**: 1시간마다

#### 새로운 에러 타입 알림

**설정 방법**:
1. Sentry Dashboard → Settings → Alerts
2. New Alert Rule 클릭
3. 설정:
   - **Alert Name**: `New Error Types`
   - **Conditions**:
     - A new issue is created
   - **Actions**:
     - Slack: `#alerts` 채널
   - **Frequency**: 즉시 알림

### 2. 성능 알림 규칙

#### LCP 성능 저하 알림

**설정 방법**:
1. Sentry Dashboard → Settings → Alerts
2. New Alert Rule 클릭
3. 설정:
   - **Alert Name**: `Poor LCP Performance`
   - **Conditions**:
     - Metric: `web_vitals.lcp`
     - Threshold: `> 2500ms`
     - Time Window: `1 hour`
   - **Actions**:
     - Slack: `#performance` 채널
   - **Frequency**: 1시간마다

#### FID 성능 저하 알림

**설정 방법**:
1. Sentry Dashboard → Settings → Alerts
2. New Alert Rule 클릭
3. 설정:
   - **Alert Name**: `Poor FID Performance`
   - **Conditions**:
     - Metric: `web_vitals.fid`
     - Threshold: `> 100ms`
     - Time Window: `1 hour`
   - **Actions**:
     - Slack: `#performance` 채널
   - **Frequency**: 1시간마다

#### 느린 API 알림

**설정 방법**:
1. Sentry Dashboard → Settings → Alerts
2. New Alert Rule 클릭
3. 설정:
   - **Alert Name**: `Slow API Endpoints`
   - **Conditions**:
     - Metric: `api.performance`
     - Threshold: `> 500ms`
     - Time Window: `1 hour`
   - **Actions**:
     - Slack: `#performance` 채널
   - **Frequency**: 1시간마다

### 3. Slack 통합 설정

**설정 방법**:
1. Sentry Dashboard → Settings → Integrations
2. Slack 통합 선택
3. 워크스페이스 연결
4. 알림 채널 설정:
   - `#alerts`: 에러 알림
   - `#performance`: 성능 알림
   - `#deployments`: 배포 알림 (선택사항)

**Slack 워크스페이스 설정**:
- 채널 생성:
  - `#alerts`: 에러 및 중요 알림
  - `#performance`: 성능 관련 알림
  - `#deployments`: 배포 알림 (선택사항)

---

## 📧 Email 알림 설정

### Sentry Email 알림

**설정 방법**:
1. Sentry Dashboard → Settings → Notifications
2. Email 알림 설정:
   - 알림 수신 이메일 주소 입력
   - 알림 빈도 설정 (즉시, 요약)

**알림 종류**:
- Issue 발생 알림
- Issue 해결 알림
- 주간 요약 리포트

### GitHub Email 알림

**설정 방법**:
1. GitHub 저장소 → Settings → Notifications
2. 알림 설정:
   - 워크플로우 실패 알림
   - 배포 실패 알림
   - 보안 알림

---

## 🚀 배포 알림 설정

### GitHub Actions 배포 알림

**현재 설정**:
- 배포 성공/실패 시 콘솔 로그 출력
- 향후 Slack 통합 가능

**Slack 통합 (향후 구현)**:
```yaml
# .github/workflows/deploy-production.yml에 추가
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Production 배포 완료'
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Vercel 배포 알림

**설정 방법**:
1. Vercel Dashboard → 프로젝트 → Settings → Notifications
2. 알림 설정:
   - 배포 성공 알림
   - 배포 실패 알림
   - 도메인 만료 알림

**알림 채널**:
- Email 알림
- Slack 통합 (선택사항)

---

## 📊 알림 우선순위

### P0 (긴급)

**알림 채널**: Slack #alerts, Email
**대응 시간**: 즉시
**예시**:
- 치명적 에러 발생
- 프로덕션 장애
- 보안 취약점 발견

### P1 (높음)

**알림 채널**: Slack #alerts
**대응 시간**: 24시간 내
**예시**:
- 자주 발생하는 에러
- 성능 저하
- 배포 실패

### P2 (중간)

**알림 채널**: Slack #alerts (요약)
**대응 시간**: 1주일 내
**예시**:
- 새로운 에러 타입
- 성능 경고
- 배포 경고

### P3 (낮음)

**알림 채널**: 주간 리포트
**대응 시간**: 계획적으로
**예시**:
- 성능 최적화 기회
- 기술 부채

---

## 🔧 알림 규칙 템플릿

### Sentry 알림 규칙 템플릿

```yaml
# .sentry/alerts.yml (향후 구현)
alerts:
  - name: Critical Errors
    conditions:
      - level: fatal
    actions:
      - type: slack
        channel: alerts
      - type: email
    frequency: immediate

  - name: Performance Degradation
    conditions:
      - metric: web_vitals.lcp
        threshold: 2500
    actions:
      - type: slack
        channel: performance
    frequency: hourly
```

---

## ✅ 알림 설정 체크리스트

### 초기 설정
- [ ] Sentry 에러 알림 규칙 설정
- [ ] Sentry 성능 알림 규칙 설정
- [ ] Slack 통합 설정
- [ ] Email 알림 설정
- [ ] Vercel 알림 설정
- [ ] GitHub 알림 설정

### 정기 검토
- [ ] 알림 규칙 효과성 검토 (월간)
- [ ] 알림 빈도 조정 (필요 시)
- [ ] 알림 채널 최적화 (필요 시)

---

## 🚨 알림 대응 절차

### 에러 알림 수신 시

1. **즉시 확인** (5분 내):
   - Sentry Dashboard에서 에러 상세 확인
   - 영향 범위 확인
   - 재현 가능 여부 확인

2. **우선순위 결정**:
   - P0: 즉시 수정 또는 롤백
   - P1: 24시간 내 수정
   - P2: 1주일 내 수정

3. **대응 조치**:
   - 에러 원인 분석
   - 수정 작업 시작
   - 팀에 상황 공유

### 성능 알림 수신 시

1. **성능 분석** (30분 내):
   - Vercel Analytics 확인
   - Sentry Performance 확인
   - 느린 트랜잭션 식별

2. **원인 파악**:
   - API 성능 분석
   - 데이터베이스 쿼리 분석
   - 번들 크기 확인

3. **개선 조치**:
   - 코드 최적화
   - 쿼리 최적화
   - 캐싱 전략 개선

---

## 📚 참고 자료

- [Sentry 알림 설정](https://docs.sentry.io/product/alerts/)
- [Slack 통합 가이드](https://docs.sentry.io/product/integrations/notification-incidents/slack/)
- [모니터링 대시보드 가이드](./monitoring-dashboard-guide.md)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 2025-02-03

