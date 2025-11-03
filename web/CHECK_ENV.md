# 환경 변수 확인 가이드

## 문제 해결 체크리스트

### 1. .env.local 파일 위치 확인
- ✅ **올바른 위치**: `web/.env.local` (web 디렉토리 안)
- ❌ **잘못된 위치**: 루트 디렉토리 (`AT-CMP/.env.local`)

### 2. 파일 이름 확인
- ✅ **올바른 이름**: `.env.local`
- ❌ **잘못된 이름**: `.env`, `.env.development`, `env.local` 등

### 3. 파일 형식 확인
```bash
# ✅ 올바른 형식 (따옴표 없음)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_실제키값

# ❌ 잘못된 형식
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_실제키값"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_실제키값
```

### 4. 개발 서버 재시작
환경 변수를 변경했다면 **반드시 개발 서버를 재시작**해야 합니다:
```bash
# 서버 중지 (Ctrl+C)
# 그 다음 다시 시작
cd web
pnpm dev
```

### 5. 환경 변수 확인 방법
개발 서버를 실행한 후 브라우저 콘솔에서:
```javascript
// 브라우저 콘솔에서 실행
console.log(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
```

또는 코드에서:
```typescript
// providers.tsx에서 이미 사용 중
console.log('Clerk Key:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
```

### 6. Next.js 환경 변수 로드 순서
Next.js는 다음 순서로 환경 변수를 로드합니다:
1. `.env.production.local` (프로덕션)
2. `.env.local` (모든 환경, `.gitignore`에 포함)
3. `.env.production`, `.env.development` (환경별)
4. `.env` (기본)

## 문제 해결 단계

1. **파일 위치 확인**
   ```bash
   # web 디렉토리에서
   cd web
   dir .env.local
   ```

2. **파일 내용 확인**
   ```bash
   # PowerShell에서
   Get-Content web\.env.local
   ```

3. **형식 확인**
   - 공백이 없는지
   - 따옴표가 없는지
   - 주석이 제대로 처리되었는지 (#으로 시작하는 줄)

4. **개발 서버 재시작**
   ```bash
   # 기존 서버 중지 후
   cd web
   pnpm dev
   ```

## Vercel 배포 시
Vercel에서는 `.env.local` 파일이 아닌 **대시보드의 Environment Variables**를 사용합니다:
1. Vercel Dashboard → 프로젝트 → Settings → Environment Variables
2. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 추가
3. Production, Preview, Development 환경에 모두 설정

