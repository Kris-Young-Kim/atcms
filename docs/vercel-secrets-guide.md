# Vercel Secrets 관리 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 Vercel 환경 변수 및 Secrets 관리 가이드입니다. 이 문서는 Vercel Dashboard에서 환경 변수를 안전하게 설정하고 관리하는 방법을 설명합니다.

---

## 🎯 목표

1. **보안 강화**: 환경 변수를 안전하게 관리
2. **환경 분리**: Production, Preview, Development 환경 분리
3. **접근 제어**: 적절한 권한 관리
4. **자동화**: CI/CD 파이프라인과 통합

---

## 🔐 필수 환경 변수 목록

### 클라이언트 환경 변수 (브라우저 노출 가능)

| 환경 변수 | 필수 | 설명 | 예시 |
|-----------|------|------|------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk 공개 키 | `pk_test_...` 또는 `pk_live_...` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 공개 키 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_APP_ENV` | ✅ | 애플리케이션 환경 | `development`, `staging`, `production` |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | Sentry 모니터링 DSN (선택) | `https://xxx@sentry.io/xxx` |

### 서버 환경 변수 (서버 전용, 절대 브라우저 노출 금지)

| 환경 변수 | 필수 | 설명 | 예시 |
|-----------|------|------|------|
| `CLERK_SECRET_KEY` | ✅ | Clerk 시크릿 키 | `sk_test_...` 또는 `sk_live_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase Service Role Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SENTRY_DSN` | ❌ | Sentry 서버 DSN (선택) | `https://xxx@sentry.io/xxx` |
| `SENTRY_AUTH_TOKEN` | ❌ | Sentry 인증 토큰 (선택) | `xxx` |

---

## 🚀 Vercel 환경 변수 설정 방법

### 1. Vercel Dashboard 접속

1. **Vercel Dashboard** 접속: https://vercel.com/dashboard
2. 프로젝트 선택 (`atcmp` 또는 프로젝트 이름)
3. **Settings** 탭 클릭
4. **Environment Variables** 메뉴 클릭

### 2. 환경 변수 추가

**각 환경 변수 추가 절차:**

1. **Key 입력**: 환경 변수 이름 (예: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
2. **Value 입력**: 환경 변수 값
3. **Environment 선택**: 
   - ✅ **Production**: 프로덕션 환경 (`main` 브랜치)
   - ✅ **Preview**: 프리뷰 환경 (PR, 브랜치별 배포)
   - ✅ **Development**: 개발 환경 (Vercel CLI 로컬 개발)
4. **Add** 버튼 클릭

**주의사항:**
- 각 환경 변수는 환경별로 별도로 추가해야 합니다
- 같은 키를 여러 환경에 추가할 수 있습니다
- 값은 환경별로 다를 수 있습니다 (예: Production은 `pk_live_...`, Preview는 `pk_test_...`)

### 3. 환경별 설정 권장사항

#### Production 환경 (`main` 브랜치)

**권장 설정:**
- `NEXT_PUBLIC_APP_ENV`: `production`
- `CLERK_SECRET_KEY`: Live 키 사용 (`sk_live_...`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Live 키 사용 (`pk_live_...`)
- `SKIP_ENV_VALIDATION`: 설정하지 않음 (또는 `false`)

#### Preview 환경 (PR, 브랜치별 배포)

**권장 설정:**
- `NEXT_PUBLIC_APP_ENV`: `staging`
- `CLERK_SECRET_KEY`: Test 키 사용 (`sk_test_...`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Test 키 사용 (`pk_test_...`)
- `SKIP_ENV_VALIDATION`: `true` (선택사항)

#### Development 환경 (Vercel CLI 로컬 개발)

**권장 설정:**
- `NEXT_PUBLIC_APP_ENV`: `development`
- `CLERK_SECRET_KEY`: Test 키 사용 (`sk_test_...`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Test 키 사용 (`pk_test_...`)
- `SKIP_ENV_VALIDATION`: `true`

**참고**: 로컬 개발은 `.env.local` 파일을 사용하는 것이 일반적입니다.

---

## 📋 환경 변수 설정 체크리스트

### Production 환경

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Live 키)
- [ ] `CLERK_SECRET_KEY` (Live 키)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_ENV` = `production`
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (선택사항)
- [ ] `SENTRY_DSN` (선택사항)
- [ ] `SENTRY_AUTH_TOKEN` (선택사항)

### Preview 환경

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Test 키)
- [ ] `CLERK_SECRET_KEY` (Test 키)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_ENV` = `staging`
- [ ] `SKIP_ENV_VALIDATION` = `true` (선택사항)

### Development 환경

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Test 키)
- [ ] `CLERK_SECRET_KEY` (Test 키)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_ENV` = `development`
- [ ] `SKIP_ENV_VALIDATION` = `true`

---

## 🔄 환경 변수 업데이트 및 순환

### 환경 변수 업데이트 절차

1. **Vercel Dashboard** 접속
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 업데이트할 환경 변수 찾기
4. 환경 변수 옆 **⋯** 메뉴 클릭
5. **Edit** 선택
6. 새 값 입력
7. **Save** 클릭
8. **배포 트리거**: 새 배포가 자동으로 시작됩니다

### 키 순환 정책

**권장 순환 주기:**
- **Service Role Key**: 분기별 1회 이상
- **Clerk Secret Key**: 분기별 1회 이상
- **Supabase Anon Key**: 연간 1회 이상

**순환 절차:**

1. **새 키 생성**:
   - Supabase Dashboard에서 새 Service Role Key 생성
   - Clerk Dashboard에서 새 Secret Key 생성

2. **Vercel에 새 키 추가**:
   - Vercel Dashboard에서 환경 변수 업데이트
   - 새 값 입력

3. **배포 및 테스트**:
   - Vercel이 자동으로 재배포
   - 애플리케이션 정상 동작 확인

4. **구 키 비활성화**:
   - 24시간 후 Supabase/Clerk Dashboard에서 구 키 비활성화

---

## 🔒 보안 모범 사례

### 1. 환경 변수 보호

**✅ 권장사항:**
- Vercel Dashboard에서만 환경 변수 관리
- 코드에 환경 변수 하드코딩 금지
- `.env.local` 파일을 Git에 커밋하지 않음
- 팀 공유 시 비밀번호 관리 도구 사용

**❌ 금지사항:**
- 환경 변수를 코드에 직접 작성
- 환경 변수를 GitHub에 커밋
- 환경 변수를 채팅이나 이메일로 공유
- Service Role Key를 브라우저에 노출

### 2. 접근 제어

**권한 관리:**
- Vercel 팀 멤버에게만 환경 변수 접근 권한 부여
- Production 환경 변수는 관리자만 수정 가능하도록 설정
- 환경 변수 변경 이력 추적 (Vercel 로그)

### 3. 환경 분리

**환경별 분리:**
- Production 환경 변수는 Production에만 설정
- Preview 환경 변수는 Preview에만 설정
- Test 키와 Live 키를 명확히 구분

---

## 🧪 환경 변수 검증

### 배포 전 검증

**자동 검증:**
- Vercel 빌드 시 환경 변수 자동 검증
- 필수 환경 변수 누락 시 빌드 실패
- 환경 변수 형식 검증 (`env.ts`)

**수동 검증:**
```bash
# 로컬에서 빌드 테스트
cd web
pnpm build

# 환경 변수 타입 체크
pnpm type-check
```

### 배포 후 검증

**확인 사항:**
- [ ] 애플리케이션 정상 로드
- [ ] 로그인 기능 정상 동작
- [ ] 데이터베이스 연결 정상
- [ ] API 호출 정상
- [ ] Sentry 모니터링 정상 (설정된 경우)

---

## 🔍 문제 해결

### 환경 변수가 적용되지 않는 경우

**확인 사항:**
1. 환경 변수가 올바른 환경에 설정되었는지 확인
2. 배포 후 환경 변수가 업데이트되었는지 확인
3. 환경 변수 이름이 정확한지 확인 (대소문자 구분)
4. 값에 공백이나 특수문자가 없는지 확인

**해결 방법:**
- Vercel Dashboard에서 환경 변수 재확인
- 새 배포 트리거 (환경 변수 업데이트 시 자동 재배포)
- 빌드 로그 확인 (`https://vercel.com/[project]/deployments`)

### 빌드 실패: "환경 변수가 설정되지 않았습니다"

**원인:**
- 필수 환경 변수가 누락됨
- 환경 변수 이름 오타
- 환경 변수가 잘못된 환경에 설정됨

**해결 방법:**
1. `web/src/config/env.ts`에서 필수 환경 변수 확인
2. Vercel Dashboard에서 환경 변수 확인
3. 누락된 환경 변수 추가
4. 재배포

### Clerk 인증 실패

**확인 사항:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`가 올바른 형식인지 확인 (`pk_test_...` 또는 `pk_live_...`)
- `CLERK_SECRET_KEY`가 올바른 형식인지 확인 (`sk_test_...` 또는 `sk_live_...`)
- Production 환경에서는 Live 키를 사용하는지 확인
- Clerk Dashboard에서 키가 활성화되어 있는지 확인

---

## 📊 환경 변수 관리 체크리스트

### 초기 설정
- [ ] 모든 필수 환경 변수 추가
- [ ] 환경별로 올바른 값 설정
- [ ] 빌드 및 배포 테스트

### 정기 점검 (월 1회)
- [ ] 환경 변수 목록 확인
- [ ] 사용하지 않는 환경 변수 제거
- [ ] 키 순환 필요성 검토

### 키 순환 시
- [ ] 새 키 생성
- [ ] Vercel 환경 변수 업데이트
- [ ] 배포 및 테스트
- [ ] 구 키 비활성화 (24시간 후)

### 보안 감사 시
- [ ] 환경 변수 접근 권한 확인
- [ ] 환경 변수 로그 확인
- [ ] 보안 정책 준수 확인

---

## 🔗 관련 문서

- [환경 변수 설정](../web/ENV_SETUP.md)
- [보안 체크리스트](./security-checklist.md)
- [암호화 전략](./encryption-strategy.md)
- [배포 가이드](../DEPLOYMENT.md)

---

## 📚 참고 자료

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Clerk Environment Variables](https://clerk.com/docs/quickstarts/nextjs#environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

