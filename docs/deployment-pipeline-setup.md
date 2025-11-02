# 배포 파이프라인 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

이 문서는 GitHub Actions를 사용한 자동 배포 파이프라인 설정 가이드입니다.

---

## 1. 사전 준비

### 1.1 필요한 계정 및 권한

- GitHub 저장소 관리자 권한
- Vercel 계정 및 프로젝트 접근 권한

### 1.2 Vercel 프로젝트 생성

1. **Vercel Dashboard** 접속: https://vercel.com/dashboard
2. **Add New Project** 클릭
3. GitHub 저장소 연결
4. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web`
   - **Build Command**: `pnpm build` (자동 감지)
   - **Output Directory**: `.next` (자동 감지)
5. **Deploy** 클릭

---

## 2. GitHub Secrets 설정

### 2.1 Vercel API 토큰 생성

1. **Vercel Dashboard** 접속
2. **Settings** → **Tokens** 메뉴로 이동
3. **Create Token** 클릭
4. 토큰 이름: `github-actions-deploy`
5. Expiration: `No expiration` (또는 원하는 기간)
6. Scope: `Full Account` 선택
7. **Create Token** 클릭
8. **토큰 복사** (한 번만 표시되므로 안전하게 보관)

### 2.2 Vercel 조직 및 프로젝트 ID 확인

1. **Vercel Dashboard** 접속
2. **Settings** → **General** 메뉴로 이동
3. **Organization ID** 확인 (예: `team_xxx`)
4. 프로젝트 → **Settings** → **General** 메뉴로 이동
5. **Project ID** 확인 (예: `prj_xxx`)

### 2.3 GitHub Secrets 추가

1. **GitHub 저장소** 접속
2. **Settings** → **Secrets and variables** → **Actions** 메뉴로 이동
3. **New repository secret** 클릭
4. 다음 Secrets 추가:

   | Secret 이름 | 값 | 설명 |
   |------------|-----|------|
   | `VERCEL_TOKEN` | Vercel API 토큰 | 위에서 생성한 토큰 |
   | `VERCEL_ORG_ID` | 조직 ID | Vercel Settings에서 확인 |
   | `VERCEL_PROJECT_ID` | 프로젝트 ID | 프로젝트 Settings에서 확인 |
   | `DEPLOYMENT_APPROVERS` | GitHub 사용자명 (선택) | 승인자 목록 (쉼표로 구분) |

**예시**:
```
VERCEL_TOKEN=vercel_xxxxxxxxxxxxx
VERCEL_ORG_ID=team_xxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx
DEPLOYMENT_APPROVERS=user1,user2
```

---

## 3. GitHub Environments 설정

### 3.1 Production 환경 생성

1. **GitHub 저장소** 접속
2. **Settings** → **Environments** 메뉴로 이동
3. **New environment** 클릭
4. Environment name: `production` 입력
5. **Configure environment** 클릭

### 3.2 환경 보호 규칙 설정

**Required reviewers**:
- 최소 승인자 수: `1` (또는 원하는 수)
- 승인자 지정 (선택사항): 특정 사용자 지정

**Deployment branches**:
- **Protected branches only**: 선택
- 브랜치: `main` 선택

**Wait timer**:
- `0` (즉시 배포)

**Save protection rules** 클릭

---

## 4. 워크플로우 파일 확인

배포 파이프라인은 다음 워크플로우 파일로 구성됩니다:

- `.github/workflows/deploy-staging.yml`: Staging 배포
- `.github/workflows/deploy-production.yml`: Production 배포
- `.github/workflows/rollback.yml`: 롤백 워크플로우

각 파일은 이미 생성되어 있으므로, Secrets만 설정하면 바로 사용할 수 있습니다.

---

## 5. 배포 테스트

### 5.1 Staging 배포 테스트

1. `develop` 브랜치로 전환
2. 변경사항 커밋 및 푸시:
   ```bash
   git checkout develop
   git add .
   git commit -m "test: Staging 배포 테스트"
   git push origin develop
   ```

3. **GitHub Actions** 탭에서 워크플로우 실행 확인
4. 배포 완료 후 PR에 배포 URL 코멘트 확인

### 5.2 Production 배포 테스트

1. `main` 브랜치로 전환
2. 변경사항 커밋 및 푸시:
   ```bash
   git checkout main
   git add .
   git commit -m "test: Production 배포 테스트"
   git push origin main
   ```

3. **GitHub Actions** 탭에서 워크플로우 실행 확인
4. **승인 대기** 상태 확인
5. **Review deployments** 클릭 → 승인
6. 배포 완료 확인

---

## 6. 롤백 워크플로우 사용

### 6.1 수동 롤백 실행

1. **GitHub Actions** 탭 접속
2. **Rollback Deployment** 워크플로우 선택
3. **Run workflow** 클릭
4. 환경 선택 (`staging` 또는 `production`)
5. 배포 URL 입력 (선택사항)
6. **Run workflow** 클릭

### 6.2 롤백 이슈 확인

롤백 워크플로우 실행 후 자동으로 생성된 이슈를 확인하여 롤백 절차를 따릅니다.

---

## 7. 문제 해결

### 7.1 배포 실패

**문제**: Vercel 배포 실패

**해결 방법**:
1. GitHub Actions 로그 확인
2. Vercel 토큰 유효성 확인
3. Vercel 프로젝트 ID 확인
4. 환경 변수 설정 확인

### 7.2 승인 프로세스 동작 안 함

**문제**: Production 배포 시 승인 대기 안 함

**해결 방법**:
1. GitHub Environments 설정 확인
2. `production` 환경이 생성되었는지 확인
3. Required reviewers 설정 확인
4. 워크플로우 파일의 `environment` 설정 확인

### 7.3 배포 URL이 표시되지 않음

**문제**: PR에 배포 URL 코멘트가 없음

**해결 방법**:
1. PR이 `develop` 브랜치에서 생성되었는지 확인
2. GitHub Actions 로그에서 배포 단계 확인
3. Vercel 토큰 권한 확인

---

## 8. 참고 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Vercel CLI 문서](https://vercel.com/docs/cli)
- [배포 프로세스 가이드](./deployment-process.md)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

