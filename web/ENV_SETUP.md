# 환경 변수 설정 가이드

AT-Care 프로젝트를 실행하기 위한 환경 변수 설정 방법입니다.

## 필수 환경 변수

### 1. Clerk 인증

Clerk 대시보드에서 발급받을 수 있습니다: https://dashboard.clerk.com

```bash
# 브라우저에서 사용 (필수)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_여기에실제키입력

# 서버 전용 시크릿 키 (필수)
CLERK_SECRET_KEY=sk_test_여기에실제키입력
```

### 2. Supabase 데이터베이스

Supabase 대시보드에서 확인: https://supabase.com/dashboard

```bash
# Supabase 프로젝트 URL (필수, *.supabase.co 형식)
NEXT_PUBLIC_SUPABASE_URL=https://프로젝트아이디.supabase.co

# Public Anon Key (필수)
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에실제anon키입력

# Service Role Key - 서버 전용, 감사 로그 등 시스템 작업에 사용 (필수)
SUPABASE_SERVICE_ROLE_KEY=여기에실제service_role키입력
```

### 3. 애플리케이션 환경

```bash
# 환경 설정 (development | staging | production)
NEXT_PUBLIC_APP_ENV=development

# 개발 시 환경 변수 검증 완화 (개발에만 true)
SKIP_ENV_VALIDATION=true
```

## 설정 방법

### 로컬 개발 환경

1. **환경 변수 파일 생성**

```bash
# Windows
cd web
copy con .env.local
# 아래 내용 붙여넣기 후 Ctrl+Z Enter

# Mac/Linux
cd web
nano .env.local
```

2. **.env.local 파일 내용**

```bash
# 애플리케이션 환경
NEXT_PUBLIC_APP_ENV=development

# Clerk 인증
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_실제키
CLERK_SECRET_KEY=sk_test_실제키

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://실제프로젝트.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=실제anon키
SUPABASE_SERVICE_ROLE_KEY=실제service_role키

# 개발 환경 설정
SKIP_ENV_VALIDATION=true
```

3. **개발 서버 실행**

```bash
pnpm dev
```

환경 변수가 올바르게 설정되지 않으면 자동으로 오류가 표시됩니다.

### Vercel 배포 환경

1. **Vercel Dashboard** 접속: https://vercel.com/dashboard
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 위 필수 환경 변수를 **Production**, **Preview**, **Development** 환경에 각각 추가
4. **SKIP_ENV_VALIDATION**는 Production에서 **false** 또는 설정하지 않음

## 보안 주의사항

⚠️ **절대 커밋하지 마세요:**

- `.env.local` 파일은 `.gitignore`에 포함되어 있습니다.
- 환경 변수는 절대 코드에 하드코딩하지 마세요.
- Service Role Key는 서버 전용이므로 브라우저에 노출되면 안 됩니다.

✅ **안전한 관리 방법:**

- 로컬: `.env.local` 파일 사용
- 배포: Vercel 대시보드의 Environment Variables 기능 사용
- 팀 공유: 비밀번호 관리 도구(1Password, Bitwarden 등) 활용

## 검증 방법

환경 변수가 올바르게 설정되었는지 확인:

```bash
# 개발 서버 실행 시 자동 검증
pnpm dev

# 타입 체크
pnpm type-check

# 빌드 테스트
pnpm build
```

검증 실패 시 콘솔에 구체적인 오류 메시지가 표시됩니다.

## 문제 해결

### "필수 환경 변수가 설정되지 않았습니다" 오류

- `.env.local` 파일이 `web` 디렉터리에 있는지 확인
- 파일 이름이 정확한지 확인 (`.env.local`, `.env.example` 아님)
- 키 값에 따옴표가 없는지 확인

### Supabase URL 형식 오류

- URL이 `https://프로젝트.supabase.co` 형식인지 확인
- Vercel 도메인이 아닌 Supabase 도메인인지 확인

### Clerk 인증 실패

- Publishable Key가 `pk_test_` 또는 `pk_live_`로 시작하는지 확인
- Secret Key가 `sk_test_` 또는 `sk_live_`로 시작하는지 확인
- Clerk Dashboard에서 키가 활성화되어 있는지 확인

## 참고 자료

- Clerk 문서: https://clerk.com/docs
- Supabase 문서: https://supabase.com/docs
- Next.js 환경 변수: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
