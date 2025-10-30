# AT-Care 인증 및 역할 관리

Clerk 기반 인증 시스템과 Supabase RLS 연동 방법을 설명합니다.

## 역할 정의

AT-Care는 다음 5가지 역할을 지원합니다:

### 1. Admin (관리자)
- **권한**: 시스템 전체 관리
- **접근**: 모든 테이블 CRUD
- **사용 사례**: 시스템 관리자, 센터장

### 2. Leader (팀장)
- **권한**: 팀 관리 및 케이스 승인
- **접근**: 대상자, 서비스 기록, 기기 대여 전체 CRUD
- **사용 사례**: 팀장, 수퍼바이저

### 3. Specialist (전문가)
- **권한**: 상담 및 평가 수행
- **접근**: 대상자 CRUD, 서비스 기록 CRUD (본인 작성만 수정)
- **사용 사례**: 작업치료사, 물리치료사, 특수교육사

### 4. SocialWorker (사회복지사)
- **권한**: 케이스 조회 및 의뢰
- **접근**: 대상자 읽기 전용, 서비스 기록 읽기 전용
- **사용 사례**: 사회복지사, 케이스 워커

### 5. Technician (기술자)
- **권한**: 기기 관리 및 맞춤 제작
- **접근**: 기기 재고 CRUD, 맞춤 제작 CRUD (대상자 정보 접근 불가)
- **사용 사례**: 보조기기 기술자, 제작 담당자

---

## Clerk 설정

### 1. Clerk Dashboard 설정

1. [Clerk Dashboard](https://dashboard.clerk.com) 접속
2. 프로젝트 선택 → **User & Authentication** → **Roles**
3. 다음 역할 추가:
   - `admin`
   - `leader`
   - `specialist`
   - `socialWorker`
   - `technician`

### 2. 조직(Organization) 설정

AT-Care는 조직 기반 접근 제어를 사용합니다.

```typescript
// 조직 구조 예시
Organization: "서울재활센터"
├─ Members:
│  ├─ user1@example.com (role: admin)
│  ├─ user2@example.com (role: leader)
│  ├─ user3@example.com (role: specialist)
│  ├─ user4@example.com (role: socialWorker)
│  └─ user5@example.com (role: technician)
```

### 3. JWT 토큰에 역할 포함

Clerk Dashboard → **JWT Templates** → **Supabase** 템플릿 생성:

```json
{
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "{{user.public_metadata.role}}",
  "org_id": "{{org.id}}",
  "org_role": "{{org.role}}"
}
```

**중요**: 사용자 생성 시 `publicMetadata.role` 필드를 설정해야 합니다.

---

## Supabase RLS 연동

### 1. JWT Claims 설정

Supabase Dashboard → **Authentication** → **Settings** → **JWT Settings**

Clerk의 JWKS URL을 등록:
```
https://clerk.your-app.com/.well-known/jwks.json
```

### 2. RLS 정책 패턴

모든 RLS 정책은 JWT에서 역할을 읽어 권한을 확인합니다:

```sql
-- Admin 전체 접근 예시
CREATE POLICY "Admin full access on table_name"
  ON table_name
  FOR ALL
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
  );

-- Specialist 읽기 예시
CREATE POLICY "Specialist read access on table_name"
  ON table_name
  FOR SELECT
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text IN ('admin', 'leader', 'specialist')
  );
```

### 3. 테이블별 RLS 정책

| 테이블           | Admin | Leader | Specialist | SocialWorker | Technician |
| ---------------- | ----- | ------ | ---------- | ------------ | ---------- |
| clients          | CRUD  | CRUD   | CRUD       | R            | -          |
| service_records  | CRUD  | CRUD   | CRUD*      | R            | -          |
| equipment        | CRUD  | CRUD   | R          | -            | CRUD       |
| rentals          | CRUD  | CRUD   | CRUD       | R            | CRUD       |
| custom_requests  | CRUD  | CRUD   | R          | -            | CRUD       |
| audit_logs       | R     | -      | -          | -            | -          |

*Specialist는 본인이 작성한 기록만 수정 가능

---

## Next.js 코드 예시

### 1. 서버 컴포넌트에서 역할 확인

```typescript
// app/clients/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ClientsPage() {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  const userRole = sessionClaims?.metadata?.role as string;
  
  // Technician은 접근 불가
  if (userRole === 'technician') {
    redirect('/dashboard');
  }
  
  return <ClientsList userRole={userRole} />;
}
```

### 2. API Route에서 역할 확인

```typescript
// app/api/clients/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userRole = sessionClaims?.metadata?.role as string;
  
  // 쓰기 권한 체크
  if (!['admin', 'leader', 'specialist'].includes(userRole)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    );
  }
  
  // 허용된 역할만 진행
  // ...
}
```

### 3. 클라이언트 컴포넌트에서 역할 확인

```typescript
'use client';

import { useUser } from '@clerk/nextjs';

export function ClientActions() {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role as string;
  
  return (
    <div>
      {/* Admin/Leader/Specialist만 수정 버튼 표시 */}
      {['admin', 'leader', 'specialist'].includes(userRole) && (
        <button>수정</button>
      )}
      
      {/* Admin/Leader만 삭제 버튼 표시 */}
      {['admin', 'leader'].includes(userRole) && (
        <button>삭제</button>
      )}
    </div>
  );
}
```

---

## Protected Route HOC

모든 보호된 페이지에서 사용할 HOC 패턴:

```typescript
// components/auth/ProtectedRoute.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/dashboard',
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (isLoaded && isSignedIn && requiredRole) {
      const userRole = user?.publicMetadata?.role as string;
      if (!requiredRole.includes(userRole)) {
        router.push(redirectTo);
      }
    }
  }, [isLoaded, isSignedIn, user, requiredRole, redirectTo, router]);

  if (!isLoaded || !isSignedIn) {
    return <div>Loading...</div>;
  }

  const userRole = user?.publicMetadata?.role as string;
  if (requiredRole && !requiredRole.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}
```

사용 예시:

```typescript
// app/clients/new/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ClientForm } from '@/components/clients/ClientForm';

export default function NewClientPage() {
  return (
    <ProtectedRoute requiredRole={['admin', 'leader', 'specialist']}>
      <ClientForm />
    </ProtectedRoute>
  );
}
```

---

## 보안 체크리스트

- [ ] Clerk Dashboard에 5개 역할 모두 등록
- [ ] JWT 템플릿에 `role` 필드 포함
- [ ] Supabase JWT Claims에 Clerk JWKS URL 등록
- [ ] 모든 테이블에 RLS 정책 적용
- [ ] API Route에서 역할 검증
- [ ] 클라이언트 UI에서 역할별 조건부 렌더링
- [ ] Protected Route HOC 구현 및 적용
- [ ] 각 역할로 실제 로그인해서 권한 테스트

---

## 문제 해결

### "RLS 정책이 적용되지 않아요"

1. Supabase에서 RLS가 활성화되었는지 확인:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. JWT에 role 필드가 포함되어 있는지 확인 (Clerk Dashboard → JWT Templates)

3. Supabase에서 JWT를 올바르게 파싱하는지 확인:
   ```sql
   SELECT current_setting('request.jwt.claims', true)::json;
   ```

### "Clerk에서 역할이 설정되지 않아요"

1. User의 `publicMetadata`에 role 설정:
   ```typescript
   await clerkClient.users.updateUserMetadata(userId, {
     publicMetadata: {
       role: 'specialist'
     }
   });
   ```

2. Organization Role과 혼동하지 마세요:
   - Organization Role: `org:admin`, `org:member` (Clerk 기본)
   - Custom Role: `publicMetadata.role` (직접 설정)

---

## 참고 자료

- [Clerk Roles Documentation](https://clerk.com/docs/organizations/roles-permissions)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Clerk Integration](https://clerk.com/docs/quickstarts/nextjs)

---

_작성일: 2025-10-30_
_최종 수정: 2025-10-30_

