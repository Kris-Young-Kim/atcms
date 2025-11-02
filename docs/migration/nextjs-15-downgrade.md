# Next.js 15 다운그레이드 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27

---

## ✅ 완료된 작업

### 1. package.json 업데이트

다음 패키지 버전을 변경했습니다:

- **Next.js**: `16.0.1` → `^15.1.3`
- **React**: `19.2.0` → `^18.3.1`
- **React DOM**: `19.2.0` → `^18.3.1`
- **@types/react**: `^19` → `^18`
- **@types/react-dom**: `^19` → `^18`
- **eslint-config-next**: `16.0.1` → `^15.1.3`

### 2. next.config.ts 업데이트

- Turbopack 설정 제거 (Next.js 15에는 없음)
- Sentry 주석 업데이트

### 3. Supabase Server Client 수정

Next.js 15의 `cookies()` API에 맞게 수정:
- `async` 키워드 제거 (Next.js 15는 동기 API)
- `cookies()` 호출 방식 변경

---

## 📋 다음 단계

### 1. 패키지 재설치

```bash
cd web
pnpm install
```

### 2. 빌드 캐시 삭제

```bash
# Windows
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Mac/Linux
rm -rf .next
```

### 3. 개발 서버 실행

```bash
cd web
pnpm dev
```

---

## 🔍 확인 사항

### Next.js 15 주요 변경점

1. **React 18 사용**: React 19 대신 React 18 사용
2. **Turbopack 없음**: 기본 번들러는 Webpack
3. **Cookies API**: Next.js 15에서는 동기 API (Next.js 16은 async)

### 호환성 확인

- [x] Clerk 5.4.1: Next.js 15와 호환
- [x] Supabase SSR 0.5.1: Next.js 15와 호환
- [x] React 18: Next.js 15와 호환

---

## 🚨 잠재적 문제

### 1. React 19 → React 18 다운그레이드

**영향받을 수 있는 부분**:
- React 19 전용 API 사용 시
- TypeScript 타입 호환성

**해결 방법**:
- 타입 에러 발생 시 React 18 API로 수정
- `@types/react` 및 `@types/react-dom` 버전 확인

### 2. Next.js 15 Cookies API

**변경 사항**:
- Next.js 15: `cookies()`는 동기 함수
- Next.js 16: `cookies()`는 async 함수

**이미 수정됨**: `web/src/lib/supabase/server.ts`

---

## 📝 추가 수정 필요 사항

### 1. React 19 → React 18 호환성

코드에서 React 19 전용 기능을 사용하는 경우 확인:
- `useFormStatus` (React 19)
- `useFormState` (React 19)
- `useOptimistic` (React 19)

### 2. TypeScript 타입 에러

```bash
cd web
pnpm type-check
```

타입 에러 발생 시 React 18 타입에 맞게 수정 필요.

---

## ✅ 테스트

### 1. 개발 서버 테스트

```bash
cd web
pnpm dev
```

**확인 사항**:
- [ ] 서버가 정상적으로 시작되는지
- [ ] 브라우저에서 페이지가 로드되는지
- [ ] Clerk 인증이 작동하는지
- [ ] Supabase 연결이 정상인지

### 2. 빌드 테스트

```bash
cd web
pnpm build
```

**확인 사항**:
- [ ] 빌드가 성공하는지
- [ ] 타입 에러가 없는지
- [ ] 경고가 없는지

---

## 🔗 참고 자료

- [Next.js 15 업그레이드 가이드](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [Next.js 15 릴리즈 노트](https://nextjs.org/blog/next-15)
- [React 18 문서](https://react.dev/blog/2022/03/29/react-v18)

---

**마지막 업데이트**: 2025-01-27

