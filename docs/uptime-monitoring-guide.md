# 가동률 모니터링 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 AT-CMP 프로젝트의 가동률 모니터링 설정 방법을 설명합니다. 외부 모니터링 서비스를 활용하여 시스템의 가용성을 실시간으로 추적합니다.

---

## 🎯 모니터링 목표

- **실시간 가동률 추적**
- **다운타임 조기 감지**
- **자동 알림 발송**
- **가동률 리포트 생성**

---

## 🔧 헬스 체크 엔드포인트 설정

### 현재 상태

**엔드포인트**: `/api/health`

**응답 형식**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "uptime": "12345.67 seconds",
  "startedAt": "2025-01-27T08:30:00.000Z"
}
```

**확인 방법**:
```bash
curl https://your-domain.com/api/health
```

---

## 📊 외부 모니터링 서비스 설정

### 1. UptimeRobot 설정 (권장)

**특징**:
- 무료 플랜: 50개 모니터, 5분 체크 주기
- Email/Slack 알림 지원
- 대시보드 제공

**설정 방법**:
1. **계정 생성**:
   - [UptimeRobot](https://uptimerobot.com/) 접속
   - 무료 계정 생성

2. **모니터 추가**:
   - Dashboard → Add New Monitor
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `AT-CMP Production`
   - URL: `https://your-domain.com/api/health`
   - Monitoring Interval: `5 minutes`
   - Alert Contacts: Email 및 Slack 설정

3. **알림 설정**:
   - Alert When: `Down` 선택
   - Alert Contacts: Email, Slack 추가

**Slack 통합**:
1. UptimeRobot → My Settings → Alert Contacts
2. Add Alert Contact → Slack 선택
3. Slack Webhook URL 입력 (Slack App에서 생성)

---

### 2. StatusCake 설정

**특징**:
- 무료 플랜: 10개 테스트, 5분 체크 주기
- 다양한 알림 옵션
- 상세 리포트 제공

**설정 방법**:
1. **계정 생성**:
   - [StatusCake](https://www.statuscake.com/) 접속
   - 무료 계정 생성

2. **테스트 추가**:
   - Tests → Add New Test
   - Test Type: `HTTP(S)`
   - Website Name: `AT-CMP Production`
   - Website URL: `https://your-domain.com/api/health`
   - Check Rate: `5 minutes`
   - Alert Settings: Email, Slack 설정

---

### 3. Pingdom 설정 (유료)

**특징**:
- 더 자세한 분석
- 글로벌 모니터링
- API 지원

**설정 방법**:
1. **계정 생성**:
   - [Pingdom](https://www.pingdom.com/) 접속
   - 계정 생성

2. **업타임 체크 추가**:
   - Add New Check
   - Check Type: `HTTP(S)`
   - Name: `AT-CMP Production`
   - URL: `https://your-domain.com/api/health`
   - Check Interval: `5 minutes`
   - Alert Settings: Email, Slack 설정

---

## 🔔 알림 설정

### Email 알림

**설정 방법**:
1. 모니터링 서비스 → Alert Settings
2. Email 주소 추가
3. 알림 조건 설정:
   - 다운타임 발생 시
   - 복구 시
   - 주간 리포트

### Slack 알림

**Slack Webhook URL 생성**:
1. Slack → Apps → Incoming Webhooks
2. Add to Slack 클릭
3. 채널 선택: `#alerts`
4. Webhook URL 복사

**모니터링 서비스에 추가**:
1. 모니터링 서비스 → Alert Settings
2. Slack Webhook URL 입력
3. 알림 메시지 커스터마이징

**알림 메시지 예시**:
```
🚨 [AT-CMP] 다운타임 발생

상태: Down
시간: 2025-01-27 12:00:00 KST
URL: https://your-domain.com/api/health
```

---

## 📈 GitHub Actions를 통한 모니터링

### 주기적 헬스 체크 워크플로우

**파일**: `.github/workflows/uptime-check.yml`

**설정 내용**:
```yaml
name: Uptime Check

on:
  schedule:
    - cron: '*/5 * * * *'  # 5분마다 실행
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check Health Endpoint
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/api/health)
          if [ "$response" != "200" ]; then
            echo "Health check failed: $response"
            exit 1
          fi
```

**알림 설정**:
- 실패 시 Slack 알림 발송
- 상태를 이슈로 기록

---

## 📊 대시보드 구성

### 통합 대시보드

**구성 요소**:
- 실시간 가동률 상태
- 다운타임 발생 내역
- 평균 응답 시간
- 월간 가동률 통계

**도구 선택**:
- **Notion**: 대시보드 페이지 생성
- **Google Sheets**: 스프레드시트로 데이터 수집
- **Grafana**: 고급 대시보드 (선택사항)

---

## 📋 가동률 측정 기준

### 측정 주기

- **외부 모니터링**: 5분마다 체크
- **GitHub Actions**: 5분마다 체크 (선택사항)
- **Vercel Analytics**: 자동 모니터링

### 정상 상태 판정

**성공 조건**:
- HTTP 상태 코드: `200 OK`
- 응답 시간: < 2초
- 응답 본문에 `"status": "ok"` 포함

**실패 조건**:
- HTTP 상태 코드: `5xx` 또는 타임아웃
- 응답 시간: > 5초
- 연결 실패

---

## 🚨 다운타임 대응 절차

### 1. 다운타임 감지 시

**즉시 확인** (5분 내):
- 모니터링 서비스에서 상태 확인
- Vercel Dashboard 확인
- 헬스 체크 엔드포인트 직접 확인

**원인 파악**:
- Vercel 로그 확인
- Supabase 상태 확인
- 외부 서비스 (Clerk, Sentry) 상태 확인

### 2. 대응 조치

**자동 복구 대기**:
- Vercel 자동 재시작 대기 (5분)

**수동 개입**:
- 자동 복구 실패 시 롤백 검토
- 팀에 상황 공유
- 긴급 수정 작업 시작

### 3. 사후 조치

**다운타임 리포트 작성**:
- 발생 시간 및 지속 시간
- 원인 분석
- 대응 조치 내역
- 예방 조치 계획

---

## ✅ 체크리스트

### 초기 설정
- [ ] 헬스 체크 엔드포인트 확인 (`/api/health`)
- [ ] 외부 모니터링 서비스 계정 생성
- [ ] 모니터 추가 (프로덕션, 스테이징)
- [ ] 알림 설정 (Email, Slack)
- [ ] 대시보드 구성

### 정기 확인
- [ ] 일일 가동률 확인
- [ ] 알림 동작 확인
- [ ] 월간 가동률 리포트 생성
- [ ] 다운타임 발생 시 대응 절차 준수

---

## 📚 참고 자료

- [UptimeRobot 문서](https://uptimerobot.com/api/)
- [StatusCake 문서](https://www.statuscake.com/api/)
- [가동률 목표 및 SLA](./uptime-sla.md)
- [헬스 체크 엔드포인트](../web/src/app/api/health/route.ts)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 2025-02-03

