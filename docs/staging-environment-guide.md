# Staging 환경 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 Staging 환경 설정 및 최적화 가이드를 제공합니다. Staging 환경은 프로덕션 배포 전 최종 검증을 위한 환경입니다.

---

## 🎯 Staging 환경 목표

1. **프로덕션과 유사한 환경 제공**
2. **통합 테스트 실행**
3. **배포 전 검증**
4. **개발자 피드백 수집**

---

## 🔧 Vercel Preview 환경 설정

### 1. 환경 변수 설정

**Vercel Dashboard에서 설정**:
1. Vercel Dashboard → 프로젝트 → Settings → Environment Variables
2. Preview 환경에 다음 변수 설정:

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
SENTRY_ORG=xxx
SENTRY_PROJECT=xxx

# 기타
NODE_ENV=production
```

### 2. 빌드 설정

**Vercel Dashboard → Settings → General**:
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` (또는 `cd web && pnpm build`)
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

### 3. 환경 최적화

**성능 최적화**:
- 이미지 최적화 활성화
- 자동 압축 활성화
- Edge Network 활용

**보안 설정**:
- HTTPS 강제
- 보안 헤더 설정
- CORS 설정

---

## 🗄️ Staging 데이터베이스 설정

### 1. Supabase Project 설정

**Staging 전용 프로젝트 생성** (권장):
- Production과 분리된 Supabase 프로젝트 생성
- 테스트 데이터 사용
- 정기적인 데이터 리셋

**또는 프로덕션과 동일한 프로젝트 사용**:
- 스키마 분리 (schema: `staging`)
- 데이터 격리

### 2. 마이그레이션 관리

**마이그레이션 적용**:
```bash
# Staging 환경에 마이그레이션 적용
supabase db push --project-ref <staging-project-ref>
```

---

## 🧪 테스트 환경 설정

### 1. E2E 테스트 설정

**Staging 환경에서 E2E 테스트 실행**:
```bash
# .env.test 파일에 Staging URL 설정
E2E_BASE_URL=https://atcmp-staging.vercel.app

# E2E 테스트 실행
pnpm test:e2e
```

### 2. 통합 테스트

**자동화된 통합 테스트**:
- GitHub Actions에서 자동 실행
- 배포 후 자동 검증
- 핵심 기능 스모크 테스트

---

## 📊 모니터링 설정

### 1. Sentry 설정

**Staging 환경별 Sentry 프로젝트**:
- Staging 전용 Sentry 프로젝트 생성
- 환경 태그: `staging`
- 에러 알림 설정

### 2. 성능 모니터링

**Web Vitals 수집**:
- Core Web Vitals 자동 수집
- 성능 대시보드 확인
- 성능 회귀 감지

---

## 🔄 배포 프로세스

### 1. 자동 배포

**트리거 조건**:
- `develop` 브랜치에 push
- PR 머지 시 자동 배포

**배포 프로세스**:
1. 코드 체크아웃
2. 의존성 설치
3. Lint & Type Check
4. 테스트 실행
5. 빌드
6. Vercel Preview 배포
7. PR 코멘트에 배포 URL 추가

### 2. 수동 배포

**필요 시 수동 배포**:
```bash
# GitHub Actions에서 수동 실행
# Actions → Deploy to Staging → Run workflow
```

---

## ✅ Staging 환경 체크리스트

### 배포 전
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 연결 확인
- [ ] 빌드 성공 확인

### 배포 후
- [ ] 홈페이지 접근 확인
- [ ] 로그인 기능 확인
- [ ] 핵심 기능 테스트
- [ ] 에러 로그 확인
- [ ] 성능 지표 확인

---

## 🚨 문제 해결

### 배포 실패 시

1. **빌드 실패**:
   - 로그 확인
   - 환경 변수 확인
   - 의존성 확인

2. **런타임 에러**:
   - Sentry 로그 확인
   - 환경 변수 확인
   - 데이터베이스 연결 확인

3. **성능 문제**:
   - Vercel Analytics 확인
   - 느린 API 엔드포인트 확인
   - 데이터베이스 쿼리 확인

---

## 📚 참고 자료

- [Vercel Preview 환경 가이드](https://vercel.com/docs/concepts/deployments/environments)
- [배포 프로세스 가이드](./deployment-process.md)
- [Vercel 배포 가이드](./vercel-deployment-guide.md)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 2025-02-03

