# AT-CMP 배포 프로세스 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 배포 프로세스 가이드입니다. 이 문서는 배포 환경, 배포 전 체크리스트, 배포 절차, 배포 후 검증, 롤백 절차를 정의합니다.

---

## 1. 배포 환경

### 1.1 환경 구분

**3가지 배포 환경**:

| 환경 | 용도 | 브랜치 | URL | 설명 |
|------|------|--------|-----|------|
| **Development** | 로컬 개발 | 로컬 | `http://localhost:3000` | 개발자 로컬 환경 |
| **Staging** | 통합 테스트 | `develop` | `https://atcmp-staging.vercel.app` | 배포 전 검증 환경 |
| **Production** | 프로덕션 | `main` | `https://atcmp.vercel.app` | 실제 서비스 환경 |

### 1.2 환경별 특징

**Development**:
- 로컬 개발 서버 (`pnpm dev`)
- Hot Reload 활성화
- 환경 변수 검증 완화 (`SKIP_ENV_VALIDATION=true`)

**Staging**:
- `develop` 브랜치에 자동 배포
- 프로덕션과 동일한 환경 설정
- 통합 테스트 실행

**Production**:
- `main` 브랜치에만 배포
- 수동 승인 필요
- 프로덕션 환경 변수 사용

---

## 2. 배포 전 체크리스트

### 2.1 코드 품질 체크

- [ ] **ESLint 통과**: `pnpm lint` 실행 및 통과
- [ ] **TypeScript 타입 체크**: `pnpm type-check` 실행 및 통과
- [ ] **Prettier 포맷팅**: `pnpm format:check` 실행 및 통과
- [ ] **테스트 통과**: `pnpm test:ci` 실행 및 통과
- [ ] **테스트 커버리지**: 70% 이상 유지
- [ ] **빌드 성공**: `pnpm build` 실행 및 성공

### 2.2 보안 체크

- [ ] **의존성 취약점**: `pnpm audit` 실행 및 중간 이상 취약점 없음
- [ ] **환경 변수**: 하드코딩된 시크릿 키 없음
- [ ] **접근 제어**: 권한 검증 로직 확인
- [ ] **입력 검증**: 모든 사용자 입력에 Zod 검증 적용

### 2.3 문서화 체크

- [ ] **변경 사항 문서화**: 주요 변경사항 문서화 완료
- [ ] **API 변경**: API 변경 시 문서 업데이트
- [ ] **마이그레이션**: 데이터베이스 마이그레이션 필요 시 문서화

### 2.4 기능 체크

- [ ] **핵심 기능 테스트**: 주요 기능 동작 확인
- [ ] **에러 처리**: 에러 처리 로직 확인
- [ ] **로깅**: 감사 로그 적절히 기록되는지 확인

---

## 3. 배포 단계별 절차

### 3.1 Staging 배포 (develop 브랜치)

**자동 배포**:
- `develop` 브랜치에 PR이 머지되면 자동으로 배포됩니다.

**수동 배포** (필요시):

```bash
# 1. develop 브랜치로 전환
git checkout develop
git pull origin develop

# 2. 빌드 테스트
pnpm build

# 3. Vercel CLI로 배포 (선택사항)
vercel --prod=false
```

**배포 확인**:
- Vercel Dashboard에서 배포 상태 확인
- Staging URL 접속하여 동작 확인

### 3.2 Production 배포 (main 브랜치)

**절차**:

1. **develop 브랜치 최신화**:
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **릴리스 브랜치 생성**:
   ```bash
   git checkout -b release/v1.0.0
   ```

3. **버전 업데이트** (필요시):
   - `package.json` 버전 업데이트
   - `CHANGELOG.md` 업데이트

4. **최종 테스트**:
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test:ci
   pnpm build
   ```

5. **main 브랜치로 PR 생성**:
   - GitHub에서 `release/v1.0.0` → `main` PR 생성
   - 체크리스트 작성
   - 코드 리뷰 요청 (최소 2명 승인)

6. **승인 후 병합**:
   - 리뷰어 승인 후 병합
   - Vercel이 자동으로 Production 배포 시작

7. **배포 확인**:
   - Vercel Dashboard에서 배포 상태 확인
   - Production URL 접속하여 동작 확인

---

## 4. 배포 플로우 다이어그램

```
┌─────────────────┐
│  Feature Branch  │
│  (개발 작업)     │
└────────┬─────────┘
         │ PR 생성
         ▼
┌─────────────────┐
│   develop       │─── 자동 배포 ──► Staging 환경
│   (통합 테스트) │
└────────┬─────────┘
         │ Release 브랜치 생성
         ▼
┌─────────────────┐
│   release/vX.X  │
│   (최종 검증)   │
└────────┬─────────┘
         │ PR + 승인
         ▼
┌─────────────────┐
│      main       │─── 자동 배포 ──► Production 환경
│   (프로덕션)    │
└─────────────────┘
```

---

## 5. 배포 후 검증

### 5.1 자동 검증

**Vercel 배포 후 자동 실행**:
- 빌드 성공 확인
- 환경 변수 검증
- 기본 헬스 체크

### 5.2 수동 검증

**Production 배포 후 확인 사항**:

1. **기본 동작 확인**:
   - [ ] 홈페이지 로드 확인
   - [ ] 로그인 페이지 접근 확인
   - [ ] 대시보드 접근 확인

2. **핵심 기능 확인**:
   - [ ] 대상자 등록 기능
   - [ ] 검색/필터 기능
   - [ ] 대여 신청 기능
   - [ ] 반납 처리 기능

3. **에러 모니터링**:
   - [ ] Sentry 대시보드 확인 (에러 없음)
   - [ ] 로그 확인 (비정상 로그 없음)

4. **성능 확인**:
   - [ ] 페이지 로딩 시간 확인
   - [ ] API 응답 시간 확인

### 5.3 검증 체크리스트

**배포 후 30분 내 확인**:

- [ ] 주요 페이지 접근 가능
- [ ] 로그인/로그아웃 정상 동작
- [ ] 핵심 기능 정상 동작
- [ ] Sentry 에러 없음
- [ ] 성능 지표 정상

---

## 6. 롤백 절차

### 6.1 롤백 트리거 조건

다음 조건 중 하나라도 발생하면 롤백을 고려합니다:

- **치명적 오류**: 애플리케이션 완전 중단
- **데이터 손실**: 데이터베이스 오류로 인한 데이터 손실
- **보안 취약점**: 보안 문제 발견
- **성능 저하**: 심각한 성능 저하 (응답 시간 5초 이상)

### 6.2 롤백 절차

#### 방법 1: Vercel Dashboard에서 롤백

1. **Vercel Dashboard 접속**: https://vercel.com/dashboard
2. 프로젝트 선택 → **Deployments** 탭
3. 이전 배포 버전 선택
4. **⋯** 메뉴 클릭 → **Promote to Production** 선택

#### 방법 2: Git으로 롤백

1. **이전 커밋 확인**:
   ```bash
   git log --oneline
   ```

2. **이전 커밋으로 revert**:
   ```bash
   git checkout main
   git pull origin main
   git revert <배포_커밋_해시>
   git push origin main
   ```

3. **Vercel 자동 재배포**: Vercel이 자동으로 재배포합니다.

### 6.3 롤백 검증

**롤백 후 확인 사항**:

- [ ] 이전 버전으로 정상 동작 확인
- [ ] 데이터 정합성 확인
- [ ] 에러 모니터링 확인
- [ ] 롤백 사유 문서화

### 6.4 롤백 후 조치사항

1. **문제 분석**:
   - 롤백 원인 분석
   - 재발 방지 대책 수립

2. **이슈 등록**:
   - GitHub Issue 생성
   - 문제 상황 및 재현 방법 문서화

3. **수정 및 재배포**:
   - 문제 수정
   - 테스트 완료 후 재배포

---

## 7. 환경 변수 관리

### 7.1 환경 변수 설정

**Vercel Dashboard에서 설정**:

1. **Vercel Dashboard 접속**: https://vercel.com/dashboard
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 환경별로 환경 변수 추가

**필수 환경 변수**:

| 환경 변수 | Development | Staging | Production |
|-----------|------------|--------|------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | ✅ | ✅ |
| `CLERK_SECRET_KEY` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_APP_ENV` | `development` | `staging` | `production` |
| `SKIP_ENV_VALIDATION` | `true` | `false` | `false` |

### 7.2 환경 변수 보안

**주의사항**:
- ✅ Vercel Secrets 사용 (환경 변수 암호화)
- ✅ Service Role Key는 서버 전용 (브라우저 노출 금지)
- ❌ 환경 변수를 코드에 하드코딩하지 않음
- ❌ 환경 변수를 Git에 커밋하지 않음

---

## 8. CI/CD 파이프라인

### 8.1 현재 CI/CD 설정

**GitHub Actions**:
- **CI 워크플로우** (`.github/workflows/ci.yml`):
  - Lint 검사
  - TypeScript 타입 체크
  - 보안 취약점 검사
  - 테스트 실행
  - 빌드 확인

- **Staging 배포** (`.github/workflows/deploy-staging.yml`):
  - `develop` 브랜치 push 시 자동 실행
  - 배포 전 검증 (lint, type-check, test, build)
  - Vercel Preview 환경에 자동 배포
  - PR에 배포 URL 자동 코멘트

- **Production 배포** (`.github/workflows/deploy-production.yml`):
  - `main` 브랜치 push 시 실행
  - 배포 전 검증 (lint, type-check, security audit, test, build)
  - **수동 승인 필요** (GitHub Environments 사용)
  - Vercel Production 환경에 배포

- **롤백 워크플로우** (`.github/workflows/rollback.yml`):
  - 수동 실행만 가능
  - 롤백 가이드 자동 생성
  - 롤백 이슈 자동 생성

### 8.2 GitHub Secrets 설정

배포 파이프라인을 사용하려면 다음 GitHub Secrets를 설정해야 합니다:

**필수 Secrets**:
1. `VERCEL_TOKEN`: Vercel API 토큰
   - Vercel Dashboard → Settings → Tokens에서 생성
   - 토큰 이름: `github-actions-deploy`

2. `VERCEL_ORG_ID`: Vercel 조직 ID
   - Vercel Dashboard → Settings → General에서 확인

3. `VERCEL_PROJECT_ID`: Vercel 프로젝트 ID
   - Vercel Dashboard → 프로젝트 → Settings → General에서 확인

4. `DEPLOYMENT_APPROVERS`: 프로덕션 배포 승인자 (선택사항)
   - GitHub 사용자 이름을 쉼표로 구분
   - 예: `user1,user2,user3`

**설정 방법**:
1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. 각 Secret 추가

### 8.3 GitHub Environments 설정

프로덕션 배포 승인 프로세스를 사용하려면 GitHub Environments를 설정해야 합니다:

1. GitHub 저장소 → **Settings** → **Environments**
2. **New environment** 클릭
3. Environment name: `production` 입력
4. **Required reviewers** 설정:
   - 최소 승인자 수: 1명 이상
   - 승인자 지정 (선택사항)
5. **Deployment branches** 설정:
   - Protected branches: `main`만 선택
6. **Save protection rules** 클릭

### 8.4 배포 파이프라인 동작 방식

#### Staging 배포 플로우
```
develop 브랜치 push
  ↓
GitHub Actions 트리거
  ↓
Lint & Type Check
  ↓
Test 실행
  ↓
Build 실행
  ↓
Vercel Preview 배포
  ↓
PR에 배포 URL 코멘트
```

#### Production 배포 플로우
```
main 브랜치 push
  ↓
GitHub Actions 트리거
  ↓
배포 전 검증 (Pre-deployment Checks)
  ↓
수동 승인 대기 (Approve Deployment)
  ↓
승인 완료
  ↓
Vercel Production 배포
  ↓
배포 요약 생성
```

### 8.5 배포 로그 확인

**GitHub Actions 로그**:
- GitHub 저장소 → **Actions** 탭
- 각 워크플로우 실행 내역 확인
- 실패 시 로그에서 원인 확인

**Vercel 배포 로그**:
- Vercel Dashboard → 프로젝트 → **Deployments** 탭
- 각 배포의 상세 로그 확인

---

## 9. 모니터링 및 알림

### 9.1 모니터링 도구

**Sentry**:
- 에러 모니터링
- 성능 모니터링
- 사용자 피드백

**Vercel Analytics**:
- 페이지 뷰
- 성능 메트릭
- Core Web Vitals

### 9.2 알림 설정

**배포 알림**:
- Slack 채널에 배포 알림 전송
- 배포 성공/실패 알림

**에러 알림**:
- Sentry에서 치명적 에러 발생 시 알림
- 에러 발생 시 즉시 알림

---

## 10. 배포 체크리스트 템플릿

### 10.1 배포 전 체크리스트

```markdown
## 배포 전 체크리스트

### 코드 품질
- [ ] ESLint 통과 (`pnpm lint`)
- [ ] TypeScript 타입 체크 통과 (`pnpm type-check`)
- [ ] 테스트 통과 (`pnpm test:ci`)
- [ ] 테스트 커버리지 70% 이상
- [ ] 빌드 성공 (`pnpm build`)

### 보안
- [ ] 의존성 취약점 검사 통과 (`pnpm audit`)
- [ ] 환경 변수 하드코딩 없음
- [ ] 접근 제어 로직 확인

### 문서화
- [ ] 변경 사항 문서화 완료
- [ ] API 변경 사항 문서화 완료

### 기능
- [ ] 핵심 기능 동작 확인
- [ ] 에러 처리 확인
```

### 10.2 배포 후 체크리스트

```markdown
## 배포 후 체크리스트

### 기본 동작
- [ ] 홈페이지 로드 확인
- [ ] 로그인 페이지 접근 확인
- [ ] 대시보드 접근 확인

### 핵심 기능
- [ ] 대상자 등록 기능 확인
- [ ] 검색/필터 기능 확인
- [ ] 대여 신청 기능 확인

### 모니터링
- [ ] Sentry 에러 없음
- [ ] 로그 정상
- [ ] 성능 지표 정상
```

---

## 11. 문제 해결

### 11.1 배포 실패

**문제**: Vercel 배포 실패

**해결 방법**:
1. Vercel Dashboard에서 배포 로그 확인
2. 에러 메시지 확인
3. 로컬에서 빌드 테스트: `pnpm build`
4. 문제 수정 후 재배포

### 11.2 환경 변수 오류

**문제**: 환경 변수 관련 오류

**해결 방법**:
1. Vercel Dashboard에서 환경 변수 확인
2. 환경 변수 이름 및 값 확인
3. 필수 환경 변수 누락 확인
4. 환경 변수 형식 확인 (URL 형식 등)

### 11.3 빌드 타임아웃

**문제**: 빌드 시간 초과

**해결 방법**:
1. 빌드 최적화 (불필요한 의존성 제거)
2. 빌드 캐시 활용
3. Vercel 빌드 타임아웃 설정 확인

---

## 12. 참고 자료

- [Vercel 배포 가이드](https://vercel.com/docs/deployments/overview)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [프로젝트 환경 변수 설정](./ENV_SETUP.md)
- [프로젝트 보안 체크리스트](./security-checklist.md)
- [배포 파이프라인 설정 가이드](./deployment-pipeline-setup.md)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

