# Vercel 배포 환경 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 Vercel 배포 환경 설정 가이드입니다. 이 문서는 Vercel 프로젝트 설정, 환경 분리, 배포 설정, 모니터링 설정 방법을 설명합니다.

---

## 🎯 목표

1. **환경 분리**: Production, Preview, Development 환경 명확히 분리
2. **자동 배포**: GitHub 연동을 통한 자동 배포 설정
3. **배포 최적화**: 빌드 설정 및 성능 최적화
4. **모니터링**: 배포 상태 및 로그 모니터링 설정

---

## 🚀 Vercel 프로젝트 초기 설정

### 1. 프로젝트 연결

**GitHub 저장소 연결:**

1. **Vercel Dashboard** 접속: https://vercel.com/dashboard
2. **Add New Project** 클릭
3. GitHub 저장소 선택 (`Kris-Young-Kim/atcmp`)
4. **Import** 클릭

**프로젝트 설정:**

- **Project Name**: `atcmp` (또는 원하는 이름)
- **Framework Preset**: Next.js (자동 감지)
- **Root Directory**: `web` (프로젝트 루트가 `web` 디렉터리인 경우)
- **Build Command**: `pnpm build` (자동 감지)
- **Output Directory**: `.next` (자동 감지)
- **Install Command**: `pnpm install` (자동 감지)

### 2. 환경 변수 설정

**초기 환경 변수 설정:**

1. 프로젝트 설정 화면에서 **Environment Variables** 섹션으로 이동
2. 필수 환경 변수 추가 (자세한 내용은 [Vercel Secrets 가이드](./vercel-secrets-guide.md) 참고)

**필수 환경 변수:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_ENV`

### 3. 배포 설정

**Settings → General:**

- **Production Branch**: `main` (기본값)
- **Preview Deployments**: `Enabled` (기본값)
- **Auto-assign Custom Domains**: `Enabled` (선택사항)

**Settings → Git:**

- **Production Branch**: `main`
- **Preview Deployments**: `Enabled`
- **Ignored Build Step**: 설정하지 않음 (모든 배포 실행)

---

## 🌍 환경 분리 설정

### 1. 환경별 브랜치 설정

**Production 환경 (`main` 브랜치):**

- **배포 트리거**: `main` 브랜치에 push 또는 merge
- **환경 변수**: Production 환경 변수 사용
- **도메인**: 프로덕션 도메인 (예: `atcmp.vercel.app`)
- **배포 승인**: GitHub Environments에서 수동 승인 설정 가능

**Preview 환경 (모든 브랜치 및 PR):**

- **배포 트리거**: 
  - 모든 브랜치에 push 시 자동 배포
  - Pull Request 생성 시 자동 배포
- **환경 변수**: Preview 환경 변수 사용
- **도메인**: `atcmp-<branch-name>-<username>.vercel.app`
- **배포 승인**: 불필요 (자동 배포)

**Development 환경:**

- **배포 트리거**: 로컬 개발 (`pnpm dev`)
- **환경 변수**: `.env.local` 파일 사용
- **도메인**: `http://localhost:3000`

### 2. 환경 변수 분리

**환경별 환경 변수 설정:**

자세한 내용은 [Vercel Secrets 가이드](./vercel-secrets-guide.md)를 참고하세요.

**요약:**
- Production: Live 키 사용 (`pk_live_...`, `sk_live_...`)
- Preview: Test 키 사용 (`pk_test_...`, `sk_test_...`)
- Development: `.env.local` 파일 사용

---

## ⚙️ 빌드 설정

### 1. Next.js 설정 확인

**`web/next.config.ts` 확인:**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  experimental: {
    optimizePackageImports: ["@clerk/nextjs", "@supabase/supabase-js"],
  },
};

export default nextConfig;
```

**설정 내용:**
- ✅ React Strict Mode 활성화
- ✅ Turbopack 사용 (Next.js 16 기본)
- ✅ 패키지 최적화 활성화

### 2. Vercel 빌드 설정

**Settings → General → Build & Development Settings:**

- **Build Command**: `pnpm build` (또는 `cd web && pnpm build`)
- **Output Directory**: `.next` (또는 `web/.next`)
- **Install Command**: `pnpm install` (또는 `cd web && pnpm install`)
- **Development Command**: `pnpm dev` (로컬 개발용)

**Root Directory 설정 (필요시):**

- 프로젝트 루트가 `web` 디렉터리인 경우:
  - **Root Directory**: `web`
  - 빌드 명령어는 자동으로 `web` 디렉터리에서 실행됨

### 3. Node.js 버전 설정

**Settings → General → Node.js Version:**

- **권장 버전**: `20.x` (LTS)
- Vercel이 자동으로 감지하지만, 명시적으로 설정 가능

---

## 🔄 자동 배포 설정

### 1. GitHub 연동

**자동 연동:**

- Vercel에 GitHub 저장소를 연결하면 자동으로 연동됩니다
- Push, Pull Request 이벤트에 자동으로 배포가 트리거됩니다

**배포 트리거:**

- **Production**: `main` 브랜치에 push 또는 merge
- **Preview**: 다른 브랜치에 push 또는 PR 생성

### 2. GitHub Actions와 통합

**현재 설정:**

- GitHub Actions 워크플로우가 별도로 설정되어 있습니다
- `.github/workflows/deploy-staging.yml`: Staging 배포
- `.github/workflows/deploy-production.yml`: Production 배포

**Vercel 자동 배포와의 관계:**

- Vercel 자동 배포는 기본적으로 활성화됩니다
- GitHub Actions는 추가 검증 및 승인 프로세스에 사용됩니다
- 두 가지를 병행하여 사용할 수 있습니다

### 3. 배포 알림 설정

**Settings → Notifications:**

- **Deployment Notifications**: 활성화
- **Email Notifications**: 배포 성공/실패 알림 받기
- **Slack Integration**: Slack 워크스페이스 연동 (선택사항)

---

## 🛡️ 보안 설정

### 1. 배포 보호

**Settings → Git → Deployment Protection:**

- **Production Branch Protection**: 활성화 (GitHub Environments 사용)
- **Deployment Approval**: Production 배포 시 승인 필요

**GitHub Environments 설정:**

자세한 내용은 [배포 파이프라인 설정 가이드](./deployment-pipeline-setup.md)를 참고하세요.

### 2. 환경 변수 보호

**보안 모범 사례:**

- ✅ 환경 변수는 Vercel Dashboard에서만 관리
- ✅ 코드에 환경 변수 하드코딩 금지
- ✅ Service Role Key는 서버 전용으로만 사용
- ✅ 환경별로 다른 키 사용 (Production: Live, Preview: Test)

자세한 내용은 [Vercel Secrets 가이드](./vercel-secrets-guide.md)를 참고하세요.

---

## 📊 모니터링 및 로그

### 1. 배포 상태 확인

**Vercel Dashboard:**

- **Deployments** 탭: 모든 배포 목록 확인
- **배포 상태**: Building, Ready, Error 등
- **배포 시간**: 배포 시작 및 완료 시간
- **배포 로그**: 빌드 로그 및 배포 로그 확인

### 2. 배포 로그 확인

**로그 확인 방법:**

1. Vercel Dashboard → 프로젝트 선택
2. **Deployments** 탭
3. 배포 선택 → **Build Logs** 또는 **Runtime Logs** 확인

**로그 종류:**

- **Build Logs**: 빌드 과정의 로그
- **Runtime Logs**: 런타임 실행 로그
- **Function Logs**: Serverless Functions 로그

### 3. 성능 모니터링

**Analytics (Vercel Pro 플랜 이상):**

- **Web Vitals**: Core Web Vitals 측정
- **Real User Monitoring**: 실제 사용자 성능 데이터
- **Error Tracking**: 에러 추적

**현재 설정:**

- Sentry 통합 준비됨 (Next.js 16 지원 대기 중)
- Analytics는 Vercel Pro 플랜 필요

---

## 🔧 최적화 설정

### 1. 빌드 최적화

**설정 확인:**

- ✅ Next.js 16 Turbopack 사용
- ✅ 패키지 최적화 활성화 (`optimizePackageImports`)
- ✅ React Strict Mode 활성화

**추가 최적화 옵션:**

- **Edge Functions**: API Routes를 Edge로 배포 (선택사항)
- **Image Optimization**: Next.js Image 최적화 사용
- **Static Generation**: 가능한 페이지는 정적 생성

### 2. 캐싱 설정

**Vercel 자동 캐싱:**

- Vercel이 자동으로 최적화합니다
- Edge Network를 통한 전역 캐싱
- CDN을 통한 정적 자산 제공

**추가 설정:**

- `next.config.ts`에서 캐싱 헤더 설정 가능
- API Routes에서 캐싱 헤더 설정 가능

---

## 🌐 도메인 설정

### 1. 기본 도메인

**Vercel 기본 도메인:**

- **Production**: `atcmp.vercel.app`
- **Preview**: `atcmp-<branch-name>-<username>.vercel.app`

### 2. 커스텀 도메인 추가

**절차:**

1. **Settings** → **Domains**
2. **Add Domain** 클릭
3. 도메인 입력 (예: `atcmp.example.com`)
4. DNS 설정 안내에 따라 DNS 레코드 추가
5. SSL 인증서 자동 발급 대기 (일반적으로 몇 분 소요)

**DNS 설정:**

- **A Record**: `@` → Vercel IP 주소
- **CNAME Record**: `www` → `cname.vercel-dns.com`

**SSL 인증서:**

- Vercel이 자동으로 Let's Encrypt 인증서 발급
- 자동 갱신
- HTTPS 강제 설정

자세한 내용은 향후 `docs/domain-ssl-guide.md` 참고 예정.

---

## 📋 배포 환경 설정 체크리스트

### 초기 설정
- [ ] Vercel 프로젝트 생성 및 GitHub 연결
- [ ] 필수 환경 변수 설정 (Production, Preview, Development)
- [ ] 빌드 설정 확인
- [ ] 배포 테스트 (Preview 배포)

### Production 설정
- [ ] Production 브랜치 설정 (`main`)
- [ ] Production 환경 변수 설정
- [ ] 배포 보호 설정 (승인 필요)
- [ ] 커스텀 도메인 설정 (필요시)

### 모니터링 설정
- [ ] 배포 알림 설정
- [ ] 로그 확인 방법 확인
- [ ] 성능 모니터링 설정 (선택사항)

### 정기 점검 (월 1회)
- [ ] 배포 상태 확인
- [ ] 환경 변수 검토
- [ ] 빌드 성능 확인
- [ ] 도메인 및 SSL 인증서 상태 확인

---

## 🔍 문제 해결

### 빌드 실패

**확인 사항:**
1. 빌드 로그 확인 (Vercel Dashboard → Deployments → Build Logs)
2. 환경 변수 설정 확인
3. Node.js 버전 확인
4. 의존성 설치 확인

**일반적인 원인:**
- 환경 변수 누락
- TypeScript 타입 오류
- 의존성 버전 충돌
- 빌드 메모리 부족

### 배포 실패

**확인 사항:**
1. 배포 로그 확인
2. 런타임 로그 확인
3. 환경 변수 확인
4. GitHub Actions 로그 확인 (해당되는 경우)

**일반적인 원인:**
- 환경 변수 오류
- API 연결 실패
- 데이터베이스 연결 실패
- 권한 오류

### 환경 변수 적용 안 됨

**확인 사항:**
1. 환경 변수가 올바른 환경에 설정되었는지 확인
2. 환경 변수 이름 확인 (대소문자 구분)
3. 배포 후 재배포 트리거
4. 런타임 로그 확인

자세한 내용은 [Vercel Secrets 가이드](./vercel-secrets-guide.md#문제-해결)를 참고하세요.

---

## 🔗 관련 문서

- [배포 가이드](../DEPLOYMENT.md)
- [배포 프로세스 가이드](./deployment-process.md)
- [배포 파이프라인 설정 가이드](./deployment-pipeline-setup.md)
- [Vercel Secrets 가이드](./vercel-secrets-guide.md)
- [환경 변수 설정](../web/ENV_SETUP.md)

---

## 📚 참고 자료

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Domains](https://vercel.com/docs/concepts/projects/domains)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

