# Next.js 15 cookies() API 에러 해결 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27

---

## 🔴 에러 메시지

```
Error: Route "/" used `...headers()` or similar iteration. 
`headers()` should be awaited before using its value.
```

---

## 🔍 원인 분석

Next.js 15에서는 `cookies()`와 `headers()` 같은 동적 API가 **async** 함수입니다. 

**문제점**:
- `createSupabaseServerClient()` 함수가 호출될 때 `cookies()`가 즉시 실행됨
- Next.js 15에서는 `cookies()`를 `await` 없이 사용하면 에러 발생

---

## ✅ 해결 방법

### 방법 1: Supabase SSR 공식 문서 방식 사용

Supabase SSR 0.5.1은 Next.js 15를 지원합니다. 공식 문서에 따라 다음과 같이 수정해야 합니다:

```typescript
// 올바른 방식 (Next.js 15)
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
```

### 방법 2: 현재 방식 유지 (권장)

현재 구현은 올바르지만, Next.js 15에서는 `getAll()`과 `setAll()` 방식을 사용하는 것이 더 안정적입니다.

---

## 📝 수정 코드

`web/src/lib/supabase/server.ts` 파일을 다음처럼 수정하세요:

```typescript
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/config/env";

export async function createSupabaseServerClient() {
  const supabaseUrl = env.getClientEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = env.getClientEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
```

**변경 사항**:
1. 함수를 `async`로 변경
2. `cookies()`를 함수 시작 부분에서 한 번만 호출
3. `getAll()`과 `setAll()` 방식 사용
4. 모든 호출부에서 `await` 추가 필요

---

## 🔄 호출부 수정 필요

`createSupabaseServerClient()`를 호출하는 모든 곳에서 `await`를 추가해야 합니다:

```typescript
// 수정 전
const supabase = createSupabaseServerClient();

// 수정 후
const supabase = await createSupabaseServerClient();
```

**영향받는 파일**:
- 모든 API Route 파일 (`web/src/app/api/**/*.ts`)

---

## 📋 체크리스트

- [ ] `createSupabaseServerClient()` 함수를 `async`로 변경
- [ ] `cookies()`를 함수 시작 부분에서 한 번만 호출
- [ ] `getAll()`과 `setAll()` 방식으로 변경
- [ ] 모든 호출부에서 `await` 추가
- [ ] 개발 서버 재시작
- [ ] 에러 해결 확인

---

**마지막 업데이트**: 2025-01-27

