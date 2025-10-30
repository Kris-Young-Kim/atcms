# AT-Care Web (Next.js 16)

AT-Care MVP를 위한 Next.js 16 + TypeScript 기반 프런트엔드입니다. Clerk 인증, Supabase 연동,
감사 로그, Sentry 모니터링을 기본 제공하여 Phase 1 P0 백로그를 바로 구현할 수 있습니다.

## 1. 사전 준비

1. `pnpm`을 사용합니다. 설치되어 있지 않다면 `npm i -g pnpm`으로 설치하세요.
2. 루트의 `env.template`를 참고하여 `.env` 또는 `.env.local` 파일을 생성합니다.
   ```bash
   cd web
   copy env.template .env.local # Windows (PowerShell: Copy-Item env.template .env.local)
   ```
3. 필요한 값을 입력한 뒤 검증을 위해 `SKIP_ENV_VALIDATION=false`로 변경하세요(배포 전 필수).

## 2. 주요 환경 변수

| 변수                                    | 설명                                  |
| --------------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`     | Clerk 퍼블릭 키                       |
| `CLERK_SECRET_KEY`                      | Clerk 시크릿 키 (Server)              |
| `NEXT_PUBLIC_SUPABASE_URL`              | Supabase 프로젝트 URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`         | Supabase Public Anon Key              |
| `SUPABASE_SERVICE_ROLE_KEY`             | Supabase Service Role Key (서버 전용) |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` | Sentry 모니터링 DSN (옵션)            |

## 3. 스크립트

```bash
pnpm install   # 의존성 설치
pnpm dev       # 개발 서버 http://localhost:3000
pnpm lint      # ESLint (Core Web Vitals + Tailwind + Prettier)
pnpm type-check
pnpm format    # Prettier 2-space / 100자 규칙
```

> `pnpm run dev` 실행 전 환경 변수가 설정되어 있어야 Clerk, Supabase 초기화 오류를 피할 수 있습니다.

## 4. 아키텍처 개요

- `src/config/env.ts` : Zod 기반 환경 변수 검증 및 접근 헬퍼
- `src/lib/supabase/*` : 브라우저 / 서버 / 서비스 롤 클라이언트 분리
- `src/lib/logger/auditLogger.ts` : Sentry와 연동되는 감사 로그 유틸
- `src/app/providers.tsx` : ClerkProvider 포함 글로벌 Provider
- `sentry.*.config.ts` : 환경별 Sentry 초기화 설정

## 5. 개발 규칙

- 들여쓰기 2스페이스, 최대 라인 길이 100자 (Prettier + ESLint로 강제)
- 핵심 기능(등록, 수정, 상태 변경 등)에는 반드시 `auditLogger.info/error` 호출
- 모든 신규 API는 Zod 검증과 Supabase RLS 규칙을 준수
- 테스트는 Jest/RTL을 사용하며 최소 70% 커버리지를 목표로 합니다.

## 6. 다음 단계

1. `docs/mvp-scope.md`와 `docs/jira-p0-backlog.csv`에 정의된 P0 스토리를 JIRA에 등록
2. CMS-US-01, INF-US-01, INF-US-02 순으로 스프린트 1 작업 착수
3. `audit_logs` 테이블과 CI 파이프라인을 설정해 품질 게이트를 확보

---

문의 또는 협업이 필요하면 PM 및 개발 리더와 상의해 주세요. 즐거운 개발 되세요! 🚀
