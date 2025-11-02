# 개발 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 개발 환경 설정부터 테스트까지 전 과정을 다루는 종합 개발 가이드입니다.

---

## 🚀 빠른 시작

### 1. 사전 준비

**필수 요구사항:**
- Node.js 20 이상
- pnpm 10.19.0 이상
- Git

**pnpm 설치:**

```bash
npm install -g pnpm
```

### 2. 저장소 클론

```bash
git clone https://github.com/Kris-Young-Kim/atcms.git
cd atcms/web
```

### 3. 의존성 설치

```bash
pnpm install
```

### 4. 환경 변수 설정

```bash
# .env.local 파일 생성
cp env.template .env.local
```

`.env.local` 파일을 열어 필요한 값들을 입력하세요. 자세한 내용은 [환경 변수 설정](./web/ENV_SETUP.md)을 참고하세요.

### 5. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000`에 접속하세요.

---

## 🛠️ 개발 환경 설정

### 프로젝트 구조

```
web/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/      # React 컴포넌트
│   ├── lib/             # 유틸리티 및 라이브러리
│   ├── config/          # 설정 파일
│   └── middleware.ts    # Next.js 미들웨어
├── public/              # 정적 파일
├── supabase/            # Supabase 마이그레이션
└── package.json         # 의존성 관리
```

### 주요 디렉토리 설명

- **`src/app/`**: Next.js App Router 기반 페이지 및 API Routes
- **`src/components/`**: 재사용 가능한 React 컴포넌트
- **`src/lib/`**: 유틸리티 함수, 유효성 검증, 로깅 등
- **`src/config/`**: 환경 변수 등 설정 파일

---

## 💻 개발 명령어

### 기본 명령어

```bash
# 개발 서버 실행 (http://localhost:3000)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 타입 체크
pnpm type-check

# 린팅 (ESLint)
pnpm lint

# 코드 포맷팅 (Prettier)
pnpm format

# 포맷팅 검사
pnpm format:check
```

### 테스트 명령어

```bash
# 개발 모드 (watch 모드)
pnpm test

# CI 모드 (커버리지 포함)
pnpm test:ci
```

### 보안 명령어

```bash
# 의존성 취약점 검사
pnpm audit

# 취약점 자동 수정
pnpm audit:fix

# 취약점 보고서 생성
pnpm audit:report
```

---

## 📝 코딩 스타일 및 규칙

### 들여쓰기 및 라인 길이

- **들여쓰기**: 2스페이스
- **최대 라인 길이**: 100자
- **Prettier 및 ESLint**로 자동 강제

### 파일 명명 규칙

- **컴포넌트**: PascalCase (예: `ClientForm.tsx`)
- **유틸리티**: camelCase (예: `debounce.ts`)
- **테스트**: `*.test.ts` 또는 `*.spec.ts`
- **상수**: UPPER_SNAKE_CASE

### TypeScript 규칙

- **엄격 모드**: `strict: true` 사용
- **타입 추론**: 가능한 경우 타입 추론 사용
- **명시적 타입**: 복잡한 타입은 명시적으로 정의

### React 컴포넌트 규칙

- **함수 컴포넌트**: 함수 선언 또는 화살표 함수 사용
- **Props**: `readonly` 키워드 사용
- **Hooks**: 커스텀 훅은 `use` 접두사 사용

**예시:**

```typescript
interface ClientFormProps {
  readonly clientId?: string;
  readonly onSubmit: (data: ClientFormData) => void;
}

export function ClientForm({ clientId, onSubmit }: ClientFormProps) {
  // ...
}
```

### API Route 규칙

- **인증 확인**: 모든 API Route에서 `auth()` 호출
- **권한 확인**: 역할 기반 접근 제어 구현
- **입력 검증**: Zod 스키마로 검증
- **감사 로깅**: 모든 CRUD 작업에 `auditLogger` 사용

**예시:**

```typescript
export async function POST(request: Request) {
  // 1. 인증 확인
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. 권한 확인
  const userRole = (sessionClaims?.metadata as { role?: string })?.role;
  if (!allowedRoles.includes(userRole || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. 입력 검증
  const body = await request.json();
  const validationResult = schema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  // 4. 비즈니스 로직
  // ...

  // 5. 감사 로깅
  auditLogger.info("resource_created", { actorId: userId, metadata: {...} });
}
```

---

## 🧪 테스트

### 테스트 환경

- **프레임워크**: Jest
- **테스트 라이브러리**: React Testing Library
- **커버리지 목표**: 70% 이상

### 테스트 작성 가이드

자세한 내용은 [테스트 가이드](./docs/testing-guide.md)를 참고하세요.

**AAA 패턴 (Arrange-Act-Assert):**

```typescript
describe("clientSchema", () => {
  it("이름이 없으면 실패해야 함", () => {
    // Arrange: 테스트 데이터 준비
    const invalidData = {};
    
    // Act: 함수 실행
    const result = clientSchema.safeParse(invalidData);
    
    // Assert: 결과 검증
    expect(result.success).toBe(false);
  });
});
```

### 테스트 실행

```bash
# 개발 모드 (watch 모드)
pnpm test

# CI 모드 (커버리지 포함)
pnpm test:ci
```

---

## 🔍 디버깅

### 로컬 개발

1. **브라우저 개발자 도구**: React DevTools, Network 탭 활용
2. **콘솔 로그**: `console.log`, `console.error` 활용
3. **Next.js 디버그 모드**: `NODE_OPTIONS='--inspect' pnpm dev`

### API 디버깅

- **API Route**: `console.log`로 요청/응답 로깅
- **Supabase**: Supabase Dashboard의 Logs 탭 확인
- **감사 로그**: `audit_logs` 테이블에서 작업 추적

### 일반적인 문제 해결

**문제**: 환경 변수 오류

```bash
# 환경 변수 확인
pnpm type-check

# .env.local 파일 확인
cat .env.local
```

**문제**: 타입 오류

```bash
# 타입 체크 실행
pnpm type-check

# 타입 정의 확인
cat src/types/*.ts
```

**문제**: 빌드 실패

```bash
# 캐시 삭제 후 재빌드
rm -rf .next
pnpm build
```

---

## 📦 의존성 관리

### 패키지 추가

```bash
# 프로덕션 의존성
pnpm add <package-name>

# 개발 의존성
pnpm add -D <package-name>
```

### 패키지 업데이트

```bash
# 모든 패키지 업데이트 확인
pnpm outdated

# 특정 패키지 업데이트
pnpm update <package-name>
```

### 보안 검사

```bash
# 취약점 검사
pnpm audit

# 취약점 수정
pnpm audit:fix
```

---

## 🗄️ 데이터베이스 관리

### 마이그레이션 적용

**Supabase Dashboard 사용 (권장):**

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 → **SQL Editor** 메뉴
3. `supabase/migrations/` 디렉토리의 마이그레이션 파일 실행
4. 순서대로 실행 (파일명의 날짜 순)

**Supabase CLI 사용:**

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 링크 (최초 1회)
supabase link --project-ref <your-project-id>

# 마이그레이션 적용
supabase db push
```

### 마이그레이션 파일 생성

```bash
# 새 마이그레이션 파일 생성
# 형식: YYYYMMDD_description.sql
```

**예시**: `20251101_add_new_column.sql`

---

## 🔐 환경 변수 관리

### 개발 환경

`.env.local` 파일 사용:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
CLERK_SECRET_KEY=...
```

### 프로덕션 환경

Vercel Dashboard의 Environment Variables 사용.

자세한 내용은 [환경 변수 설정 가이드](./web/ENV_SETUP.md)를 참고하세요.

---

## 📚 주요 라이브러리 및 도구

### 핵심 라이브러리

- **Next.js 16**: React 프레임워크
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링
- **Clerk**: 인증
- **Supabase**: 백엔드 및 데이터베이스
- **Zod**: 스키마 검증

### 개발 도구

- **ESLint**: 코드 린팅
- **Prettier**: 코드 포맷팅
- **Jest**: 테스트 프레임워크
- **React Testing Library**: 컴포넌트 테스트

---

## 🔄 Git 워크플로우

### 브랜치 전략

프로젝트는 **Git Flow** 전략을 사용합니다:

- `main`: 프로덕션 배포용 브랜치
- `develop`: 개발 통합 브랜치
- `feature/ATCMP-XXX-xxx`: 기능 개발 브랜치
- `bugfix/ATCMP-XXX-xxx`: 버그 수정 브랜치

자세한 내용은 [Git Flow 가이드](./docs/git-flow-guide.md)를 참고하세요.

### 커밋 메시지 규칙

커밋 메시지는 다음 형식을 따릅니다:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**타입:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스 또는 보조 도구 변경

자세한 내용은 [커밋 메시지 가이드](./docs/commit-message-guide.md)를 참고하세요.

---

## 🚢 배포 전 체크리스트

배포 전 다음 항목을 확인하세요:

- [ ] ESLint 통과 (`pnpm lint`)
- [ ] TypeScript 타입 체크 통과 (`pnpm type-check`)
- [ ] Prettier 포맷팅 검사 통과 (`pnpm format:check`)
- [ ] 테스트 통과 (`pnpm test:ci`)
- [ ] 테스트 커버리지 70% 이상
- [ ] 빌드 성공 (`pnpm build`)
- [ ] 보안 취약점 검사 통과 (`pnpm audit`)
- [ ] 환경 변수 설정 확인 (프로덕션)

자세한 내용은 [배포 가이드](./DEPLOYMENT.md)를 참고하세요.

---

## 📖 추가 자료

### 프로젝트 문서

- [시스템 아키텍처](./ARCHITECTURE.md)
- [API 문서](./API_DOCS.md)
- [데이터베이스 스키마](./DATABASE_SCHEMA.md)
- [배포 가이드](./DEPLOYMENT.md)
- [테스트 가이드](./docs/testing-guide.md)
- [E2E 테스트 전략](./docs/e2e-testing-strategy.md)

### 외부 문서

- [Next.js 문서](https://nextjs.org/docs)
- [TypeScript 문서](https://www.typescriptlang.org/docs)
- [Clerk 문서](https://clerk.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Zod 문서](https://zod.dev)

---

## ❓ 자주 묻는 질문

### Q: 개발 서버가 시작되지 않아요

**A:** 환경 변수가 설정되었는지 확인하세요:

```bash
# 환경 변수 확인
cat .env.local

# 타입 체크로 검증
pnpm type-check
```

### Q: 타입 오류가 발생해요

**A:** TypeScript 컴파일러를 실행하여 오류를 확인하세요:

```bash
pnpm type-check
```

### Q: 테스트가 실패해요

**A:** 테스트 환경이 올바르게 설정되었는지 확인하세요:

```bash
# Jest 설정 확인
cat jest.config.js

# 테스트 환경 재설정
rm -rf node_modules
pnpm install
```

### Q: API 요청이 실패해요

**A:** 다음을 확인하세요:

1. 환경 변수가 올바르게 설정되었는지
2. Supabase 프로젝트가 활성화되어 있는지
3. Clerk 인증이 올바르게 설정되었는지
4. 브라우저 콘솔의 에러 메시지 확인

---

## 🤝 도움 받기

문제가 발생하거나 질문이 있으면:

1. [GitHub Issues](https://github.com/Kris-Young-Kim/atcms/issues)에 이슈 생성
2. 프로젝트 관리자에게 문의
3. 팀 슬랙 채널에서 질문

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

