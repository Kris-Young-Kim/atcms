# 프로덕션 배포 승인 프로세스 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 프로덕션 배포 승인 프로세스와 자동화된 배포 전/후 검증 시스템을 설명합니다.

---

## 🔄 배포 프로세스 개요

### 전체 플로우

```
main 브랜치 push
  ↓
배포 전 검증 (Pre-deployment Checks)
  ├─ ESLint & Type Check
  ├─ 보안 취약점 검사
  ├─ 테스트 실행
  ├─ 빌드 성공 확인
  └─ 번들 크기 확인
  ↓
수동 승인 대기 (Approve Deployment)
  ├─ GitHub Environments 승인
  └─ 승인자 확인
  ↓
프로덕션 배포
  ├─ Vercel Production 배포
  └─ 배포 URL 생성
  ↓
배포 후 검증 (Post-deployment Verification)
  ├─ 헬스 체크
  ├─ 핵심 엔드포인트 확인
  └─ 에러율 확인
  ↓
배포 완료
```

---

## 📋 배포 전 검증 (Pre-deployment Checks)

### 검증 항목

1. **코드 품질**
   - ✅ ESLint 통과
   - ✅ TypeScript 타입 체크 통과
   - ✅ 테스트 통과 (커버리지 70% 이상)
   - ✅ 빌드 성공

2. **보안**
   - ✅ 보안 취약점 검사 통과 (`pnpm audit`)
   - ✅ 환경 변수 하드코딩 검사

3. **성능**
   - ✅ 번들 크기 확인
   - ✅ 빌드 시간 확인

### 검증 실패 시

검증이 실패하면 배포가 중단됩니다:
- 보안 취약점 발견 시: 배포 차단
- 테스트 실패 시: 배포 차단
- 빌드 실패 시: 배포 차단

---

## ✅ 승인 프로세스

### GitHub Environments 설정

1. **환경 생성**:
   - GitHub 저장소 → Settings → Environments
   - "New environment" 클릭
   - Environment name: `production` 입력

2. **Required reviewers 설정**:
   - 최소 승인자 수: 1명 이상
   - 승인자 지정 (선택사항)

3. **Deployment branches 설정**:
   - Protected branches: `main`만 선택

### 승인 요청

배포 전 검증이 통과하면 자동으로 승인 요청이 생성됩니다:

**승인 요청 내용**:
- 브랜치 정보
- 커밋 정보
- 커밋 메시지
- 작성자 정보
- 배포 전 체크리스트 결과

**승인 전 확인사항**:
- [ ] 변경사항 검토 완료
- [ ] 핵심 기능 테스트 완료
- [ ] 환경 변수 확인 완료
- [ ] 롤백 계획 확인 완료

### 승인 방법

1. GitHub Actions 워크플로우 실행 페이지로 이동
2. "Approve Deployment" 단계 클릭
3. 승인 버튼 클릭
4. 배포 자동 진행

---

## 🚀 배포 프로세스

### 배포 단계

1. **빌드**
   - 프로덕션 환경 변수 사용
   - 최적화된 빌드 생성

2. **Vercel 배포**
   - Production 환경으로 배포
   - 배포 URL 생성

3. **배포 후 검증**
   - 헬스 체크 (HTTP 200 응답 확인)
   - 핵심 엔드포인트 확인
   - 에러율 확인

### 배포 실패 시

배포가 실패하면:
1. 배포 로그 확인
2. 문제 해결
3. 재배포 또는 롤백

---

## 📊 배포 후 검증

### 자동 검증 항목

1. **헬스 체크**
   - `/api/health` 엔드포인트 응답 확인
   - HTTP 200 응답 확인

2. **핵심 엔드포인트**
   - API 엔드포인트 접근 확인
   - 인증이 필요한 경우 401 응답도 성공으로 간주

3. **에러율 확인**
   - Sentry 에러율 확인 (향후 구현)
   - 임계값 초과 시 경고

### 수동 검증 체크리스트

배포 후 수동으로 확인해야 할 항목:

- [ ] 홈페이지 로드 확인
- [ ] 로그인 페이지 접근 확인
- [ ] 대시보드 접근 확인
- [ ] 핵심 기능 동작 확인
- [ ] Sentry 에러 모니터링 확인
- [ ] 성능 지표 확인 (Core Web Vitals)

---

## 📝 배포 요약

배포 완료 후 자동으로 생성되는 배포 요약:

**포함 정보**:
- 배포 URL
- 환경 (Production)
- 브랜치
- 커밋 해시
- 배포 시간
- 배포 후 검증 결과
- 확인사항 체크리스트

**배포 요약 확인**:
- GitHub Actions 워크플로우 아티팩트
- PR 코멘트 (PR이 있는 경우)

---

## 🔧 설정 방법

### GitHub Secrets 설정

필요한 Secrets:
- `VERCEL_TOKEN`: Vercel 배포 토큰
- `VERCEL_ORG_ID`: Vercel 조직 ID
- `VERCEL_PROJECT_ID`: Vercel 프로젝트 ID
- `DEPLOYMENT_APPROVERS`: 승인자 목록 (선택사항)

설정 방법:
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. New repository secret 클릭
3. 각 Secret 추가

### GitHub Environments 설정

설정 방법:
1. GitHub 저장소 → Settings → Environments
2. New environment 클릭
3. Environment name: `production` 입력
4. Required reviewers 설정
5. Deployment branches 설정 (`main`만 선택)
6. Save protection rules 클릭

---

## 🚨 문제 해결

### 승인 요청이 생성되지 않는 경우

1. GitHub Environments 설정 확인
2. `pre-deployment-checks` 작업 완료 확인
3. 워크플로우 로그 확인

### 배포 후 검증 실패 시

1. 배포 URL 접근 확인
2. 헬스 체크 엔드포인트 확인 (`/api/health`)
3. 네트워크 문제 확인
4. Vercel 배포 상태 확인

### 배포 실패 시

1. 배포 로그 확인
2. 환경 변수 확인
3. 빌드 오류 확인
4. Vercel 설정 확인

---

## 📚 참고 자료

- [배포 프로세스 가이드](./deployment-process.md)
- [Vercel 배포 가이드](./vercel-deployment-guide.md)
- [롤백 가이드](./docs/deployment-process.md#6-롤백-절차)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 2025-02-03

