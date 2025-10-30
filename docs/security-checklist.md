# AT-Care 보안 체크리스트

Sprint 1 개발 시 반드시 준수해야 할 보안 규칙입니다.

## 1. 데이터베이스 보안

### ✅ RLS (Row Level Security) 정책 필수

모든 테이블에 RLS 정책을 적용해야 합니다.

**체크리스트:**
- [ ] `clients` 테이블 RLS 활성화
- [ ] `service_records` 테이블 RLS 활성화
- [ ] `audit_logs` 테이블 RLS 활성화 (admin만 읽기)
- [ ] 역할별 접근 권한 매트릭스 문서화
- [ ] RLS 정책 테스트 (각 역할로 실제 쿼리 실행)

**예시 RLS 정책:**
```sql
-- clients 테이블: admin/leader/specialist는 모두 조회/수정, socialWorker는 조회만
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON clients
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Staff read access" ON clients
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('leader', 'specialist', 'socialWorker'));

CREATE POLICY "Staff update access" ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('leader', 'specialist'));
```

### ✅ Service Role Key 사용 제한

`SUPABASE_SERVICE_ROLE_KEY`는 RLS를 우회하므로 극히 제한적으로만 사용해야 합니다.

**허용되는 경우:**
- 시스템 자동화 작업 (배치, 스케줄러)
- 관리자 전용 백오피스 API

**금지되는 경우:**
- 일반 사용자 API에서 사용
- 브라우저 클라이언트에 노출

---

## 2. 입력 검증

### ✅ Zod를 사용한 검증 필수

모든 API 엔드포인트에서 입력 데이터를 Zod로 검증해야 합니다.

**체크리스트:**
- [ ] 대상자 등록 API: `clientSchema` 검증
- [ ] 상담 기록 API: `consultationSchema` 검증
- [ ] 기기 대여 API: `rentalSchema` 검증
- [ ] 에러 처리: 검증 실패 시 400 응답과 명확한 메시지

**예시:**
```typescript
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(2).max(100),
  contact_phone: z.string().regex(/^\d{2,3}-\d{3,4}-\d{4}$/).optional(),
  contact_email: z.string().email().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  
  try {
    const validated = clientSchema.parse(body);
    // 검증 통과 후 처리
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid input', details: error },
      { status: 400 }
    );
  }
}
```

---

## 3. XSS (Cross-Site Scripting) 방지

### ✅ 사용자 입력 이스케이프

React는 기본적으로 XSS를 방지하지만, `dangerouslySetInnerHTML` 사용 시 주의해야 합니다.

**체크리스트:**
- [ ] `dangerouslySetInnerHTML` 사용 금지 (불가피한 경우 DOMPurify 사용)
- [ ] URL 파라미터, 쿼리스트링 검증
- [ ] 외부 링크는 `rel="noopener noreferrer"` 추가

**금지 패턴:**
```typescript
// ❌ 절대 금지
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 안전한 방법
<div>{userInput}</div>

// ✅ HTML이 필요한 경우
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

---

## 4. 인증 및 권한

### ✅ Clerk 인증 필수

모든 보호된 페이지와 API는 Clerk 인증을 거쳐야 합니다.

**체크리스트:**
- [ ] Protected Route HOC 구현
- [ ] API Route에서 `auth()` 헬퍼로 사용자 확인
- [ ] 역할 기반 접근 제어 (RBAC) 적용
- [ ] 인증 실패 시 적절한 리디렉션

**예시:**
```typescript
// app/clients/new/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function NewClientPage() {
  return (
    <ProtectedRoute requiredRole={['admin', 'leader', 'specialist']}>
      <ClientForm />
    </ProtectedRoute>
  );
}

// app/api/clients/route.ts
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 역할 확인 로직...
}
```

---

## 5. 환경 변수 관리

### ✅ 민감 정보 보호

환경 변수는 절대 코드에 하드코딩하지 않습니다.

**체크리스트:**
- [ ] `.env.local` 파일이 `.gitignore`에 포함
- [ ] 브라우저 노출 변수는 `NEXT_PUBLIC_` 접두사만 사용
- [ ] Service Role Key는 서버 전용
- [ ] 프로덕션 환경 변수는 Vercel Dashboard에서 관리

**금지 패턴:**
```typescript
// ❌ 절대 금지 - 하드코딩
const apiKey = 'sk_live_abc123...';

// ❌ 절대 금지 - 브라우저 노출
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 클라이언트 컴포넌트에서

// ✅ 올바른 방법
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // 브라우저 OK
```

---

## 6. SQL 인젝션 방지

### ✅ Supabase ORM 사용

Raw SQL 대신 Supabase 클라이언트 메서드를 사용합니다.

**체크리스트:**
- [ ] `supabase.from()` API 사용
- [ ] Prepared Statement 사용 (Raw SQL 불가피한 경우)
- [ ] 사용자 입력을 SQL에 직접 삽입 금지

**안전한 패턴:**
```typescript
// ✅ 안전 - Supabase ORM
const { data } = await supabase
  .from('clients')
  .select('*')
  .eq('name', userName); // 자동 이스케이프

// ❌ 위험 - Raw SQL with string interpolation
const { data } = await supabase
  .rpc('custom_query', { query: `SELECT * FROM clients WHERE name='${userName}'` });
```

---

## 7. CORS 설정

### ✅ 허용된 출처만 접근

Next.js API Routes는 기본적으로 same-origin만 허용합니다.

**체크리스트:**
- [ ] API Routes에 CORS 설정 확인
- [ ] 프로덕션 도메인만 허용
- [ ] Credentials 전송 시 명시적 허용

---

## 8. 감사 로그

### ✅ 모든 민감 작업 로깅

보안 이벤트와 데이터 변경을 반드시 기록합니다.

**체크리스트:**
- [ ] 대상자 등록/수정/삭제 시 `auditLogger.info` 호출
- [ ] 인증 실패 시 `auditLogger.error` 호출
- [ ] 권한 오류 시 `auditLogger.error` 호출
- [ ] actor_id (Clerk userId) 포함

**예시:**
```typescript
auditLogger.info('client_created', {
  actorId: userId,
  metadata: { clientId: data.id, clientName: data.name },
  tags: { module: 'cms', action_type: 'create' },
});

auditLogger.error('unauthorized_access_attempt', {
  actorId: userId || 'anonymous',
  metadata: { requestedResource: '/api/clients', userRole: userRole },
  tags: { security: 'access_control' },
});
```

---

## 9. 에러 처리

### ✅ 민감 정보 노출 금지

에러 메시지에 시스템 내부 정보를 포함하지 않습니다.

**체크리스트:**
- [ ] 프로덕션에서 스택 트레이스 숨김
- [ ] 데이터베이스 에러를 일반 메시지로 변환
- [ ] 감사 로그에만 상세 정보 기록

**안전한 에러 처리:**
```typescript
try {
  // 데이터베이스 작업
} catch (error) {
  // ✅ 감사 로그에 상세 정보
  auditLogger.error('db_operation_failed', {
    error,
    metadata: { operation: 'insert', table: 'clients' },
  });
  
  // ✅ 사용자에게는 일반 메시지
  return NextResponse.json(
    { error: '요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.' },
    { status: 500 }
  );
}
```

---

## 10. 정기 점검

### ✅ 스프린트마다 보안 리뷰

- [ ] 스프린트 종료 시 이 체크리스트 전체 검토
- [ ] 신규 API는 코드 리뷰 시 보안 항목 필수 확인
- [ ] RLS 정책 테스트 자동화 (가능한 경우)
- [ ] 의존성 보안 업데이트 (`pnpm audit`)

---

## 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Clerk Security](https://clerk.com/docs/security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)

