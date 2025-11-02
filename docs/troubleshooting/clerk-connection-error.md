# Clerk 연결 오류 해결 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27

---

## 🔴 문제 증상

1. **Clerk 경고 메시지**:
   ```
   Clerk: Clerk has been loaded with development keys. 
   Development instances have strict usage limits and should not be used 
   when deploying your application to production.
   ```

2. **404 에러**: 페이지를 찾을 수 없음

---

## 🔍 원인 분석

### 1. Vercel 환경 변수 미설정 또는 잘못 설정

**가능한 원인**:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`가 Vercel에 설정되지 않음
- Production 환경에 Development 키(`pk_test_...`) 사용
- 환경 변수가 잘못된 환경(Production/Preview/Development)에 설정됨

### 2. 환경 변수 형식 오류

**가능한 원인**:
- 키 값에 공백 포함
- 따옴표 포함
- 키 형식 오류 (`pk_test_...` 또는 `pk_live_...` 형식이 아님)

### 3. 배포 후 환경 변수 미적용

**가능한 원인**:
- 환경 변수 추가 후 재배포하지 않음
- 빌드 캐시 문제

---

## ✅ 해결 방법

### 방법 1: Vercel 환경 변수 확인 및 설정

#### 1단계: Vercel Dashboard 접속

1. **Vercel Dashboard** 접속: https://vercel.com/dashboard
2. 프로젝트 선택 (`atcmp` 또는 프로젝트 이름)
3. **Settings** 탭 클릭
4. **Environment Variables** 메뉴 클릭

#### 2단계: Clerk 환경 변수 확인

**필수 환경 변수 확인**:

| 환경 변수 | 값 형식 | Production | Preview |
|-----------|--------|------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` 또는 `pk_test_...` | ✅ `pk_live_...` | ✅ `pk_test_...` |
| `CLERK_SECRET_KEY` | `sk_live_...` 또는 `sk_test_...` | ✅ `sk_live_...` | ✅ `sk_test_...` |

**확인 사항**:
- [ ] 환경 변수가 설정되어 있는지 확인
- [ ] Production 환경에는 **Live 키** (`pk_live_...`, `sk_live_...`) 사용
- [ ] Preview 환경에는 **Test 키** (`pk_test_...`, `sk_test_...`) 사용
- [ ] 값에 공백이나 따옴표가 없는지 확인

#### 3단계: Clerk 키 확인 및 생성

**Clerk Dashboard에서 키 확인**:

1. **Clerk Dashboard** 접속: https://dashboard.clerk.com
2. 프로젝트 선택
3. **API Keys** 메뉴로 이동

**Production용 Live 키 확인**:
- **Publishable Key**: `pk_live_...` 형식
- **Secret Key**: `sk_live_...` 형식

**Live 키가 없는 경우**:
1. Clerk Dashboard에서 **Deployments** 메뉴로 이동
2. **Production** 환경 생성
3. Live 키 생성

#### 4단계: Vercel 환경 변수 설정/업데이트

**각 환경 변수 추가 절차**:

1. **Key 입력**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
2. **Value 입력**: Clerk Dashboard에서 복사한 키 값
   - Production: `pk_live_...` 형식
   - Preview: `pk_test_...` 형식
3. **Environment 선택**:
   - ✅ **Production**: 프로덕션 환경 (`main` 브랜치)
   - ✅ **Preview**: 프리뷰 환경 (PR, 브랜치별 배포)
4. **Add** 버튼 클릭

**동일한 절차로 `CLERK_SECRET_KEY` 추가**

#### 5단계: 재배포

**자동 재배포**:
- 환경 변수를 추가/수정하면 Vercel이 자동으로 새 배포를 시작합니다
- 배포 상태는 Vercel Dashboard의 **Deployments** 탭에서 확인 가능

**수동 재배포** (필요시):
```bash
# 빈 커밋으로 재배포 트리거
git commit --allow-empty -m "trigger: 재배포"
git push origin develop  # 또는 main
```

---

### 방법 2: 환경 변수 형식 확인

#### 확인 사항

1. **키 형식 확인**:
   - ✅ 올바른 형식: `pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ❌ 잘못된 형식: `"pk_live_..."` (따옴표 포함)
   - ❌ 잘못된 형식: `pk_live_... ` (공백 포함)

2. **키 값 복사 시 주의**:
   - Clerk Dashboard에서 키를 복사할 때 앞뒤 공백 제거
   - 따옴표 없이 값만 복사

3. **환경 변수 확인 방법**:
   ```bash
   # Vercel CLI로 환경 변수 확인 (로컬에서)
   vercel env ls
   ```

---

### 방법 3: 빌드 로그 확인

#### Vercel 배포 로그 확인

1. **Vercel Dashboard** → **Deployments**
2. 최신 배포 클릭
3. **Build Logs** 확인

**확인 사항**:
- 환경 변수가 제대로 로드되는지 확인
- 빌드 에러가 없는지 확인
- Clerk 초기화 관련 에러가 없는지 확인

---

### 방법 4: 로컬 환경 변수 확인 (개발 환경)

#### 로컬 개발 환경에서 확인

1. **`.env.local` 파일 확인**:
   ```bash
   # web/.env.local 파일 위치 확인
   cat web/.env.local
   ```

2. **환경 변수 형식 확인**:
   ```bash
   # 올바른 형식 (따옴표 없음, 공백 없음)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **개발 서버 재시작**:
   ```bash
   cd web
   pnpm dev
   ```

---

## 🔧 추가 문제 해결

### 문제 1: 404 에러

**원인**:
- Clerk 인증 미들웨어가 잘못된 경로로 리디렉션
- 환경 변수 미설정으로 인한 초기화 실패

**해결**:
1. Vercel 환경 변수 확인 및 설정 (위 방법 1 참조)
2. 재배포
3. 배포 URL 확인 (Vercel Dashboard → Deployments)

---

### 문제 2: Development 키 사용 경고

**원인**:
- Production 환경에 Test 키 (`pk_test_...`) 사용

**해결**:
1. Clerk Dashboard에서 Live 키 생성
2. Vercel Production 환경에 Live 키 설정
3. 재배포

**주의사항**:
- ⚠️ Production 환경에서는 반드시 **Live 키** 사용
- ⚠️ Test 키는 Development 및 Preview 환경에서만 사용

---

### 문제 3: 환경 변수가 적용되지 않음

**원인**:
- 환경 변수 추가 후 재배포하지 않음
- 빌드 캐시 문제

**해결**:
1. Vercel Dashboard에서 환경 변수 재확인
2. 새 배포 트리거:
   ```bash
   git commit --allow-empty -m "trigger: 환경 변수 재배포"
   git push origin develop
   ```
3. Vercel Dashboard에서 수동 재배포 (Settings → Deployments → Redeploy)

---

## 📋 체크리스트

### Vercel 환경 변수 설정 체크리스트

#### Production 환경 (`main` 브랜치)

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 설정됨 (`pk_live_...` 형식)
- [ ] `CLERK_SECRET_KEY` 설정됨 (`sk_live_...` 형식)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 설정됨
- [ ] `NEXT_PUBLIC_APP_ENV` = `production`

#### Preview 환경 (`develop` 브랜치 및 PR)

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 설정됨 (`pk_test_...` 형식)
- [ ] `CLERK_SECRET_KEY` 설정됨 (`sk_test_...` 형식)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 설정됨
- [ ] `NEXT_PUBLIC_APP_ENV` = `staging`

---

## 🔗 관련 문서

- [Vercel Secrets 관리 가이드](./docs/vercel-secrets-guide.md)
- [환경 변수 설정](./web/ENV_SETUP.md)
- [Clerk 공식 문서](https://clerk.com/docs/deployments/overview)

---

## 📞 추가 지원

문제가 계속되면 다음을 확인하세요:

1. **Vercel 배포 로그**: Vercel Dashboard → Deployments → Build Logs
2. **Clerk Dashboard**: https://dashboard.clerk.com → API Keys
3. **GitHub Actions**: GitHub 저장소 → Actions (배포 워크플로우 로그)

---

**마지막 업데이트**: 2025-01-27

