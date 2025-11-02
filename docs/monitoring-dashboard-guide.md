# 모니터링 대시보드 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 AT-CMP 프로젝트의 모니터링 대시보드 구성 및 접근 방법을 설명합니다. 여러 도구의 대시보드를 통합하여 시스템 상태를 한눈에 확인할 수 있습니다.

---

## 🎯 대시보드 목표

1. **실시간 시스템 상태 확인**
2. **에러 및 성능 문제 조기 발견**
3. **팀원 간 정보 공유**
4. **트렌드 분석 및 개선**

---

## 📊 모니터링 대시보드 목록

### 1. Sentry 대시보드

**접근 URL**: [Sentry Dashboard](https://sentry.io/)

**주요 기능**:
- 에러 모니터링 및 추적
- 성능 모니터링 (Performance)
- Web Vitals 추적
- 사용자 영향 분석
- 릴리스 추적

**대시보드 구성**:
- **Issues**: 발생한 에러 목록 및 상세 정보
- **Performance**: 성능 메트릭 및 느린 트랜잭션
- **Releases**: 배포 히스토리 및 영향 분석
- **Alerts**: 알림 규칙 및 이벤트

**주요 메트릭**:
- 에러 발생률
- 에러 해결 시간
- 평균 응답 시간
- Core Web Vitals (LCP, FID, CLS)

---

### 2. Vercel Analytics 대시보드

**접근 URL**: Vercel Dashboard → 프로젝트 → Analytics

**주요 기능**:
- 페이지 뷰 통계
- Core Web Vitals 추적
- 사용자 지리적 분포
- 성능 트렌드 분석

**대시보드 구성**:
- **Overview**: 전체 통계 요약
- **Web Vitals**: Core Web Vitals 상세 분석
- **Pages**: 페이지별 성능 분석
- **Visitors**: 사용자 통계

**주요 메트릭**:
- 페이지 뷰 수
- 고유 방문자 수
- 평균 세션 시간
- Core Web Vitals 점수

---

### 3. Supabase 대시보드

**접근 URL**: [Supabase Dashboard](https://supabase.com/dashboard)

**주요 기능**:
- 데이터베이스 상태 모니터링
- 쿼리 성능 분석
- API 사용량 추적
- 스토리지 사용량

**대시보드 구성**:
- **Database**: 데이터베이스 상태 및 쿼리
- **API**: API 엔드포인트 사용량
- **Storage**: 파일 스토리지 사용량
- **Logs**: 애플리케이션 로그

**주요 메트릭**:
- 데이터베이스 연결 수
- 쿼리 응답 시간
- API 요청 수
- 스토리지 사용량

---

### 4. GitHub Actions 대시보드

**접근 URL**: GitHub 저장소 → Actions 탭

**주요 기능**:
- CI/CD 파이프라인 상태
- 배포 히스토리
- 테스트 결과
- 빌드 상태

**대시보드 구성**:
- **Workflows**: 모든 워크플로우 실행 내역
- **Deployments**: 배포 상태 및 히스토리
- **Artifacts**: 빌드 아티팩트 및 리포트

**주요 메트릭**:
- 워크플로우 성공률
- 평균 실행 시간
- 배포 빈도
- 테스트 커버리지

---

## 🔔 알림 설정

### Sentry 알림 설정

#### 1. 에러 알림 규칙

**설정 방법**:
1. Sentry Dashboard → Settings → Alerts
2. New Alert Rule 클릭
3. 조건 설정:
   - **Alert Type**: Issue Alert
   - **Trigger**: New Issue, Issue Frequency
   - **Action**: Slack 또는 Email 알림

**권장 알림 규칙**:
- **치명적 에러 (P0)**: 즉시 알림
  - 조건: 에러 레벨 = fatal
  - 알림: Slack #alerts 채널
- **자주 발생하는 에러**: 1시간에 10회 이상 발생
  - 조건: 에러 발생 횟수 > 10회/시간
  - 알림: Slack #alerts 채널
- **새로운 에러 타입**: 새 에러 발생 시
  - 조건: New Issue
  - 알림: Slack #alerts 채널

#### 2. 성능 알림 규칙

**설정 방법**:
1. Sentry Dashboard → Settings → Alerts
2. New Alert Rule 클릭
3. 조건 설정:
   - **Alert Type**: Performance Alert
   - **Metric**: Core Web Vitals
   - **Threshold**: 목표값 초과

**권장 알림 규칙**:
- **LCP 성능 저하**: LCP > 2.5초
  - 조건: LCP 평균 > 2500ms
  - 알림: Slack #performance 채널
- **FID 성능 저하**: FID > 100ms
  - 조건: FID 평균 > 100ms
  - 알림: Slack #performance 채널
- **느린 API**: API 응답 시간 > 500ms
  - 조건: API 평균 응답 시간 > 500ms
  - 알림: Slack #performance 채널

### Vercel 알림 설정

**설정 방법**:
1. Vercel Dashboard → 프로젝트 → Settings → Notifications
2. 알림 설정:
   - 배포 성공/실패 알림
   - 도메인 만료 알림
   - 사용량 한도 알림

**알림 채널**:
- Email 알림
- Slack 통합 (선택사항)

### GitHub 알림 설정

**설정 방법**:
1. GitHub 저장소 → Settings → Notifications
2. 알림 설정:
   - 워크플로우 실패 알림
   - 배포 실패 알림
   - 보안 알림

**알림 채널**:
- Email 알림
- GitHub Mobile 알림

---

## 👥 접근 권한 설정

### Sentry 접근 권한

**역할별 권한**:
- **Owner**: 모든 기능 접근 가능
- **Admin**: 대시보드 및 알림 설정 접근 가능
- **Member**: 대시보드 조회만 가능

**설정 방법**:
1. Sentry Dashboard → Settings → Members
2. 팀원 초대 및 역할 할당

### Vercel 접근 권한

**역할별 권한**:
- **Owner**: 모든 기능 접근 가능
- **Admin**: 배포 및 설정 접근 가능
- **Member**: 대시보드 조회만 가능

**설정 방법**:
1. Vercel Dashboard → Team Settings → Members
2. 팀원 초대 및 역할 할당

### Supabase 접근 권한

**역할별 권한**:
- **Owner**: 모든 기능 접근 가능
- **Admin**: 데이터베이스 및 설정 접근 가능
- **Member**: 대시보드 조회만 가능

**설정 방법**:
1. Supabase Dashboard → Settings → Team
2. 팀원 초대 및 역할 할당

---

## 📈 통합 대시보드 구성 (선택사항)

### Notion 대시보드

**구성 요소**:
- Sentry 에러 요약
- Vercel 성능 요약
- GitHub Actions 상태
- 주간 성능 리포트

**업데이트 주기**:
- 일일 자동 업데이트 (스크립트 사용)
- 주간 수동 리뷰

### 커스텀 대시보드

**구성 요소**:
- 실시간 시스템 상태
- 핵심 메트릭 요약
- 에러 트렌드 차트
- 성능 트렌드 차트

**구현 방법**:
- Sentry API 사용
- Vercel Analytics API 사용
- 커스텀 대시보드 구축

---

## 🔍 대시보드 사용 가이드

### 일일 체크리스트

**아침 체크 (매일 09:00)**:
- [ ] Sentry Issues 확인 (새로운 에러 없음)
- [ ] Vercel Analytics 확인 (성능 지표 정상)
- [ ] GitHub Actions 확인 (모든 워크플로우 성공)

### 주간 체크리스트

**주간 리뷰 (매주 월요일)**:
- [ ] 주간 에러 리포트 검토
- [ ] 성능 트렌드 분석
- [ ] 배포 히스토리 확인
- [ ] 개선 사항 식별

### 배포 전 체크리스트

**배포 전 확인**:
- [ ] Sentry에 새로운 에러 없음
- [ ] Vercel Analytics 성능 지표 정상
- [ ] GitHub Actions 모든 테스트 통과

---

## 🚨 알림 대응 절차

### 에러 알림 수신 시

1. **즉시 확인**:
   - Sentry Dashboard에서 에러 상세 확인
   - 에러 발생 빈도 및 영향 범위 확인

2. **우선순위 결정**:
   - P0 (치명적): 즉시 수정
   - P1 (높음): 24시간 내 수정
   - P2 (중간): 1주일 내 수정
   - P3 (낮음): 계획적으로 수정

3. **대응 조치**:
   - 에러 원인 분석
   - 수정 작업 시작
   - 롤백 검토 (필요 시)

### 성능 알림 수신 시

1. **성능 분석**:
   - Vercel Analytics에서 성능 메트릭 확인
   - Sentry Performance에서 느린 트랜잭션 확인

2. **원인 파악**:
   - 느린 API 엔드포인트 식별
   - 느린 데이터베이스 쿼리 식별
   - 번들 크기 확인

3. **개선 조치**:
   - 코드 최적화
   - 쿼리 최적화
   - 캐싱 전략 개선

---

## 📊 리포트 생성

### 주간 모니터링 리포트

**포함 내용**:
- 에러 발생 현황
- 성능 지표 요약
- 배포 현황
- 개선 사항

**생성 방법**:
- Sentry Dashboard → Reports
- 수동 리포트 생성 또는 자동화 스크립트

### 월간 성능 리포트

**포함 내용**:
- Core Web Vitals 트렌드
- 에러 해결 시간
- 사용자 만족도 지표

**생성 방법**:
- 각 대시보드에서 데이터 수집
- Excel 또는 Google Sheets로 정리

---

## ✅ 체크리스트

### 초기 설정
- [ ] Sentry 대시보드 접근 권한 설정
- [ ] Vercel Analytics 확인
- [ ] Supabase 대시보드 접근 권한 설정
- [ ] GitHub Actions 대시보드 확인

### 알림 설정
- [ ] Sentry 에러 알림 규칙 설정
- [ ] Sentry 성능 알림 규칙 설정
- [ ] Vercel 알림 설정
- [ ] GitHub 알림 설정

### 정기 확인
- [ ] 일일 대시보드 체크
- [ ] 주간 리포트 생성
- [ ] 알림 대응 절차 준수

---

## 📚 참고 자료

- [Sentry 알림 설정 가이드](https://docs.sentry.io/product/alerts/)
- [Vercel Analytics 문서](https://vercel.com/docs/analytics)
- [Supabase 모니터링 가이드](https://supabase.com/docs/guides/platform/metrics)
- [성능 모니터링 가이드](./performance-monitoring-guide.md)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 2025-02-03

