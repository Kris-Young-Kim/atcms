# 환경 변수 코드 포함 금지 정책

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 환경 변수 보안 정책입니다. 이 문서는 환경 변수를 코드에 포함하지 않도록 하는 정책과 검증 방법을 정의합니다.

---

## 🎯 목표

1. **보안 강화**: API 키 및 시크릿이 코드에 노출되지 않도록 방지
2. **자동 검증**: CI/CD 파이프라인에서 자동으로 검증
3. **정책 준수**: 모든 개발자가 정책을 준수하도록 가이드 제공

---

## 🚫 금지 패턴

### 절대 금지되는 패턴

**❌ 하드코딩된 API 키:**
```typescript
// ❌ 절대 금지
const apiKey = 'sk_live_abc123...';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const clerkKey = 'pk_live_xyz789...';
```

**❌ 코드에 직접 작성:**
```typescript
// ❌ 절대 금지
const supabase = createClient(
  'https://myproject.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);
```

**❌ 환경 변수 파일 커밋:**
```bash
# ❌ 절대 금지 - .env 파일 커밋
git add .env.local
git commit -m "Add environment variables"
```

**❌ 주석이나 문서에 실제 키 포함:**
```typescript
// ❌ 절대 금지
// API Key: sk_live_abc123...
```

---

## ✅ 허용되는 패턴

### 올바른 환경 변수 사용

**✅ process.env 사용:**
```typescript
// ✅ 올바른 방법
const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
```

**✅ env.ts를 통한 접근:**
```typescript
// ✅ 올바른 방법
import { env } from '@/config/env';

const supabaseUrl = env.getClientEnv('NEXT_PUBLIC_SUPABASE_URL');
const serviceKey = env.getServerEnv('SUPABASE_SERVICE_ROLE_KEY');
```

**✅ 플레이스홀더 값 (개발용):**
```typescript
// ✅ 허용 - 플레이스홀더 값
if (key === 'pk_test_placeholder') {
  console.warn('키가 설정되지 않았습니다');
}
```

---

## 🔍 검증 방법

### 1. 코드베이스 검사

**수동 검사:**
```bash
# API 키 패턴 검색
grep -r "sk_live_\|sk_test_\|pk_live_\|pk_test_" web/src

# JWT 토큰 패턴 검색 (일반적으로 eyJ로 시작)
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" web/src

# Supabase URL 패턴 검색
grep -r "https://.*\.supabase\.co" web/src --exclude-dir=node_modules
```

**자동 검사:**
- GitHub Actions에서 자동 검사 실행
- Pull Request 시 자동 검증

### 2. .gitignore 확인

**필수 포함 항목:**
- `.env`
- `.env.local`
- `.env*.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`

**확인 방법:**
```bash
# .gitignore에 .env 파일이 포함되어 있는지 확인
grep -E "\.env" .gitignore web/.gitignore
```

### 3. Git 히스토리 검사

**과거 커밋 확인:**
```bash
# Git 히스토리에서 환경 변수 파일 검색
git log --all --full-history -- ".env*"

# Git 히스토리에서 API 키 패턴 검색
git log -p | grep -E "sk_live_|sk_test_|pk_live_|pk_test_"
```

**만약 발견된 경우:**
1. 환경 변수 파일이 커밋된 경우: 즉시 키 순환
2. 키가 노출된 경우: 키 무효화 및 새 키 생성
3. Git 히스토리에서 제거 (필요시)

---

## 🤖 자동화 검증

### GitHub Actions 워크플로우 추가

**`.github/workflows/env-secrets-check.yml` 생성:**

```yaml
name: Environment Variables Security Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  check-secrets:
    name: Check for hardcoded secrets
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Check for hardcoded API keys
        run: |
          echo "🔍 Checking for hardcoded API keys..."
          
          # Clerk 키 패턴 검색
          if grep -r "pk_live_\|sk_live_" web/src --exclude-dir=node_modules; then
            echo "❌ ERROR: Hardcoded Clerk keys found!"
            exit 1
          fi
          
          # Supabase 키 패턴 검색 (JWT 토큰)
          if grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" web/src --exclude-dir=node_modules --exclude="*.test.ts" --exclude="*.test.tsx"; then
            echo "❌ ERROR: Hardcoded Supabase keys found!"
            exit 1
          fi
          
          # 환경 변수 파일이 커밋되지 않았는지 확인
          if git ls-files | grep -E "\.env\.local|\.env$"; then
            echo "❌ ERROR: .env files found in repository!"
            exit 1
          fi
          
          echo "✅ No hardcoded secrets found"
      
      - name: Check .gitignore
        run: |
          echo "🔍 Checking .gitignore..."
          
          if ! grep -q "\.env" .gitignore web/.gitignore 2>/dev/null; then
            echo "⚠️  WARNING: .env files may not be ignored"
          else
            echo "✅ .env files are properly ignored"
          fi
```

### Pre-commit 훅 (선택사항)

**Husky 설정 추가:**

```bash
# .husky/pre-commit 파일 생성
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Checking for hardcoded secrets..."

# API 키 패턴 검색
if grep -r "sk_live_\|pk_live_" web/src --exclude-dir=node_modules; then
  echo "❌ ERROR: Hardcoded API keys found!"
  exit 1
fi

echo "✅ Pre-commit check passed"
```

---

## 📋 코드 리뷰 체크리스트

**Pull Request 리뷰 시 확인 사항:**

- [ ] 하드코딩된 API 키가 없음
- [ ] 환경 변수는 `process.env`를 통해서만 접근
- [ ] `.env` 파일이 변경사항에 포함되지 않음
- [ ] 주석이나 문서에 실제 키가 포함되지 않음
- [ ] 플레이스홀더 값만 사용 (예: `pk_test_placeholder`)

---

## 🔒 보안 사고 대응

### 환경 변수 노출 발견 시

**즉시 조치:**

1. **키 무효화**:
   - Supabase Dashboard에서 Service Role Key 재생성
   - Clerk Dashboard에서 Secret Key 재생성
   - 기존 키 즉시 비활성화

2. **Vercel 환경 변수 업데이트**:
   - Vercel Dashboard에서 새 키로 업데이트
   - 즉시 재배포

3. **Git 히스토리 확인**:
   - 노출된 커밋 확인
   - 필요시 Git 히스토리 정리 (BFG Repo-Cleaner 사용)

4. **보안 감사**:
   - 노출된 키로 인한 악용 여부 확인
   - 접근 로그 확인

**방지 조치:**

- 코드 리뷰 강화
- 자동 검증 활성화
- 정기 보안 감사

---

## 📚 가이드라인

### 개발자 가이드

**환경 변수 사용 시:**

1. ✅ 항상 `process.env` 또는 `env.ts`를 사용
2. ✅ 로컬 개발은 `.env.local` 파일 사용
3. ✅ 팀 공유는 비밀번호 관리 도구 사용
4. ✅ 배포는 Vercel Dashboard에서 설정

**환경 변수 추가 시:**

1. `web/src/config/env.ts`에 스키마 추가
2. `web/ENV_SETUP.md`에 문서화
3. Vercel Dashboard에 환경 변수 추가
4. 팀에 공지

### 코드 리뷰 가이드

**리뷰어 확인 사항:**

- [ ] 새로 추가된 코드에 하드코딩된 키가 없는지 확인
- [ ] 환경 변수 접근 방식이 올바른지 확인
- [ ] `.env` 파일이 변경사항에 포함되지 않았는지 확인

---

## 📋 정책 준수 체크리스트

### 초기 설정
- [ ] `.gitignore`에 `.env*` 파일 포함 확인
- [ ] GitHub Actions 워크플로우에 검증 추가
- [ ] 코드베이스 검사 실행
- [ ] Git 히스토리 검사 (필요시)

### 정기 점검 (월 1회)
- [ ] 코드베이스 검사 실행
- [ ] `.gitignore` 확인
- [ ] GitHub Actions 검증 동작 확인
- [ ] 코드 리뷰 체크리스트 준수 확인

### 새 환경 변수 추가 시
- [ ] 코드에 하드코딩하지 않음
- [ ] `env.ts`에 스키마 추가
- [ ] 문서 업데이트
- [ ] Vercel Dashboard에 설정

---

## 🔗 관련 문서

- [보안 체크리스트](./security-checklist.md)
- [Vercel Secrets 가이드](./vercel-secrets-guide.md)
- [환경 변수 설정](../web/ENV_SETUP.md)
- [코드 리뷰 가이드](./code-review-checklist.md)

---

## 📚 참고 자료

- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security/secret-scanning)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

