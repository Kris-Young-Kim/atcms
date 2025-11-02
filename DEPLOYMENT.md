# 배포 가이드

**프로젝트 코드**: ATCMP-2026  
**마지막 업데이트**: 2025-11-01

---

## 📋 빠른 시작

AT-CMP 프로젝트는 **Vercel**을 사용하여 배포됩니다.

### 배포 환경

| 환경 | 브랜치 | URL | 설명 |
|------|--------|-----|------|
| **Development** | 로컬 | `http://localhost:3000` | 로컬 개발 환경 |
| **Staging** | `develop` | 자동 배포 | 통합 테스트 환경 |
| **Production** | `main` | 프로덕션 URL | 실제 서비스 환경 |

### 빠른 배포

```bash
# Staging 배포 (develop 브랜치 push 시 자동)
git checkout develop
git push origin develop

# Production 배포 (main 브랜치 push 시 자동, 승인 필요)
git checkout main
git push origin main
```

---

## 🚀 배포 방법

### 자동 배포 (권장)

프로젝트는 **GitHub Actions**를 사용한 자동 배포 파이프라인을 사용합니다.

- **Staging**: `develop` 브랜치 push 시 자동 배포
- **Production**: `main` 브랜치 push 시 자동 배포 (수동 승인 필요)

자세한 내용은 [배포 프로세스 가이드](./docs/deployment-process.md)를 참고하세요.

### 수동 배포

Vercel CLI를 사용한 수동 배포:

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
cd web
vercel --prod  # Production 배포
vercel          # Preview 배포
```

---

## 📚 상세 문서

- **[배포 프로세스 가이드](./docs/deployment-process.md)**: 전체 배포 프로세스, 체크리스트, 롤백 절차
- **[배포 파이프라인 설정 가이드](./docs/deployment-pipeline-setup.md)**: GitHub Actions 파이프라인 설정 방법
- **[환경 변수 설정](./web/ENV_SETUP.md)**: 환경 변수 설정 가이드

---

## ✅ 배포 전 체크리스트

- [ ] ESLint 통과 (`pnpm lint`)
- [ ] TypeScript 타입 체크 통과 (`pnpm type-check`)
- [ ] 테스트 통과 (`pnpm test:ci`)
- [ ] 테스트 커버리지 70% 이상
- [ ] 빌드 성공 (`pnpm build`)
- [ ] 보안 취약점 검사 통과 (`pnpm audit`)

---

## 🔧 문제 해결

### 배포 실패

1. GitHub Actions 로그 확인
2. 빌드 로그 확인
3. 환경 변수 설정 확인

자세한 문제 해결 방법은 [배포 프로세스 가이드](./docs/deployment-process.md#11-문제-해결)를 참고하세요.

---

## 📞 문의

배포 관련 문의는 GitHub Issues를 통해 제출해주세요.

