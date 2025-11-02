# Phase 3: 프로젝트 표준 및 규칙 개발 계획

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

Phase 3는 프로젝트의 표준과 규칙을 수립하는 단계로, 코딩 표준, Git 규칙, 코드 리뷰 규칙, 테스트 규칙, 그리고 배포 규칙을 포함합니다. 현재 진행률은 100% (18/18)로 완료되었습니다. 이 문서는 완료된 작업을 정리하고 향후 유지보수 가이드를 제공합니다.

---

## 🎯 목표

1. **코딩 표준 문서화 및 적용**
2. **Git Flow 브랜치 전략 수립**
3. **코드 리뷰 규칙 구축**
4. **테스트 규칙 수립**
5. **배포 규칙 및 프로세스 구축**

---

## 📊 현재 상태

### 완료된 작업 ✅

- 명명 규칙 문서화 (kebab-case, camelCase, PascalCase, UPPER_SNAKE_CASE)
- TypeScript any 타입 금지 규칙 적용
- ESLint 규칙 커스터마이징 및 문서화
- 코드 포맷팅 자동화 설정 (Pre-commit hook)
- Git Flow 브랜치 전략 문서화
- 커밋 메시지 형식 가이드 작성
- Pre-commit hook 설정 (lint-staged)
- 커밋 템플릿 파일 생성
- Pull Request 템플릿 생성
- 코드 리뷰 체크리스트 작성
- 리뷰어 자동 할당 규칙 설정
- 리뷰 피드백 가이드라인 작성
- 테스트 파일 명명 규칙 문서화
- 테스트 커버리지 목표(70%) 설정 및 자동화
- 단위 테스트 가이드 작성
- 통합 테스트 가이드 작성
- E2E 테스트 전략 수립
- 배포 프로세스 문서화
- 스테이징 환경 자동 배포 파이프라인 설정
- 프로덕션 배포 승인 프로세스 수립
- 배포 후 롤백 계획 수립

### 진행률

- **진행률**: 18/18 (100%) ✅
- **완료된 작업**: 18개

---

## 📝 완료된 작업 상세

### 3.1 코딩 표준

#### 명명 규칙
- **문서**: `docs/coding-standards.md`
- **규칙**:
  - 파일/폴더: `kebab-case`
  - 변수/함수: `camelCase`
  - 컴포넌트/클래스: `PascalCase`
  - 상수: `UPPER_SNAKE_CASE`

#### TypeScript 규칙
- **ESLint 규칙**: `@typescript-eslint/no-explicit-any`
- **설정 파일**: `web/eslint.config.mjs`
- **효과**: 타입 안정성 향상

#### ESLint 커스터마이징
- **문서**: `docs/eslint-config-guide.md`
- **주요 규칙**:
  - Next.js 통합 규칙
  - Tailwind CSS 플러그인
  - Prettier 통합
  - TypeScript 엄격 규칙

#### 코드 포맷팅 자동화
- **도구**: Husky + lint-staged
- **설정 파일**: `.husky/pre-commit`
- **효과**: 커밋 전 자동 포맷팅 및 린팅

---

### 3.2 Git 규칙

#### Git Flow 브랜치 전략
- **문서**: `docs/git-flow-guide.md`
- **브랜치 구조**:
  - `main`: 프로덕션 배포용
  - `develop`: 개발 통합 브랜치
  - `feature/ATCMP-XXX-xxx`: 기능 개발
  - `bugfix/ATCMP-XXX-xxx`: 버그 수정
  - `hotfix/ATCMP-XXX-xxx`: 긴급 수정
  - `release/v1.0.0`: 릴리스 준비

#### 커밋 메시지 형식
- **문서**: `docs/commit-message-guide.md`
- **템플릿**: `.gitmessage`
- **형식**:
  ```
  <type>(<scope>): <subject>

  <body>

  <footer>
  ```
- **타입**: feat, fix, docs, style, refactor, test, chore

#### Pre-commit Hook
- **도구**: Husky + lint-staged
- **설정 파일**: `.husky/pre-commit`
- **검사 항목**:
  - ESLint 검사
  - Prettier 포맷팅
  - TypeScript 타입 체크

---

### 3.3 코드 리뷰 규칙

#### Pull Request 템플릿
- **템플릿 파일**: `.github/pull_request_template.md`
- **주요 섹션**:
  - 변경 사항 설명
  - 관련 이슈
  - 체크리스트
  - 스크린샷/데모

#### 코드 리뷰 체크리스트
- **문서**: `docs/code-review-checklist.md`
- **주요 항목**:
  - 기능 동작 확인
  - 코드 품질 확인
  - 테스트 커버리지 확인
  - 문서화 확인

#### 리뷰어 자동 할당
- **설정 파일**: `.github/CODEOWNERS`
- **규칙**:
  - 특정 경로별 코드 소유자 지정
  - 자동 리뷰어 할당

#### 리뷰 피드백 가이드라인
- **문서**: `docs/code-review-guidelines.md`
- **원칙**:
  - 건설적 피드백
  - 명확한 설명
  - 코드와 사람 분리

---

### 3.4 테스트 규칙

#### 테스트 파일 명명 규칙
- **규칙**: `*.test.ts` 또는 `*.spec.ts`
- **위치**: `__tests__/` 디렉토리 또는 파일 옆

#### 테스트 커버리지 목표
- **목표**: 70% 이상
- **설정 파일**: `web/jest.config.js`
- **검사 항목**:
  - Statements: 70%
  - Branches: 70%
  - Functions: 70%
  - Lines: 70%

#### 테스트 가이드
- **단위 테스트**: `docs/testing-guide.md`
- **통합 테스트**: `docs/testing-guide.md`
- **E2E 테스트**: `docs/e2e-testing-strategy.md`

---

### 3.5 배포 규칙

#### 배포 프로세스
- **문서**: `docs/deployment-process.md`
- **프로세스**:
  1. 개발 브랜치에서 작업
  2. develop 브랜치로 머지
  3. 자동 스테이징 배포
  4. 프로덕션 승인
  5. 프로덕션 배포

#### 스테이징 환경 자동 배포
- **워크플로우**: `.github/workflows/deploy-staging.yml`
- **트리거**: `develop` 브랜치 푸시
- **단계**:
  1. Lint 및 타입 체크
  2. 테스트 실행
  3. 빌드
  4. Vercel Preview 배포

#### 프로덕션 배포 승인 프로세스
- **워크플로우**: `.github/workflows/deploy-production.yml`
- **트리거**: `main` 브랜치 푸시
- **단계**:
  1. 사전 배포 검사
  2. 수동 승인 (GitHub Environments)
  3. 프로덕션 배포

#### 배포 후 롤백 계획
- **워크플로우**: `.github/workflows/rollback.yml`
- **프로세스**:
  1. 롤백 대상 선택
  2. 롤백 가이드 생성
  3. 롤백 이슈 생성

---

## 📋 유지보수 가이드

### 코딩 표준 업데이트

#### 규칙 변경 프로세스
1. 팀 회의에서 규칙 변경 논의
2. 규칙 변경 문서 작성
3. ESLint/Prettier 설정 업데이트
4. 기존 코드 자동 포맷팅 적용
5. CI/CD 테스트 통과 확인

### Git 규칙 업데이트

#### 브랜치 전략 변경
1. 브랜치 전략 변경 논의
2. `docs/git-flow-guide.md` 업데이트
3. 팀원 교육 및 공유

### 코드 리뷰 프로세스 개선

#### 주기적 리뷰
- **주기**: 분기별 (3개월)
- **항목**:
  - 리뷰 시간 측정
  - 리뷰 품질 평가
  - 프로세스 개선점 도출

### 테스트 규칙 업데이트

#### 커버리지 목표 변경
1. 커버리지 목표 변경 논의
2. `jest.config.js` 업데이트
3. 기존 테스트 커버리지 확인

### 배포 프로세스 개선

#### 배포 성공률 모니터링
- **지표**: 배포 성공률, 롤백 빈도
- **주기**: 월간 리뷰
- **개선**: 실패 원인 분석 및 프로세스 개선

---

## 📦 관련 파일

### 설정 파일
- `web/eslint.config.mjs` - ESLint 설정
- `web/.prettierrc.json` - Prettier 설정
- `.husky/pre-commit` - Pre-commit hook
- `.gitmessage` - 커밋 템플릿
- `.github/CODEOWNERS` - 코드 소유자
- `.github/pull_request_template.md` - PR 템플릿
- `.github/workflows/deploy-staging.yml` - 스테이징 배포
- `.github/workflows/deploy-production.yml` - 프로덕션 배포
- `.github/workflows/rollback.yml` - 롤백 워크플로우

### 문서
- `docs/coding-standards.md` - 코딩 표준
- `docs/eslint-config-guide.md` - ESLint 설정 가이드
- `docs/git-flow-guide.md` - Git Flow 가이드
- `docs/commit-message-guide.md` - 커밋 메시지 가이드
- `docs/code-review-checklist.md` - 코드 리뷰 체크리스트
- `docs/code-review-guidelines.md` - 코드 리뷰 가이드라인
- `docs/testing-guide.md` - 테스트 가이드
- `docs/e2e-testing-strategy.md` - E2E 테스트 전략
- `docs/deployment-process.md` - 배포 프로세스

---

## ✅ 완료 기준

### 모든 작업 완료 ✅
- [x] 명명 규칙 문서화
- [x] TypeScript any 타입 금지 규칙 적용
- [x] ESLint 규칙 커스터마이징 및 문서화
- [x] 코드 포맷팅 자동화 설정
- [x] Git Flow 브랜치 전략 문서화
- [x] 커밋 메시지 형식 가이드 작성
- [x] Pre-commit hook 설정
- [x] 커밋 템플릿 파일 생성
- [x] Pull Request 템플릿 생성
- [x] 코드 리뷰 체크리스트 작성
- [x] 리뷰어 자동 할당 규칙 설정
- [x] 리뷰 피드백 가이드라인 작성
- [x] 테스트 파일 명명 규칙 문서화
- [x] 테스트 커버리지 목표 설정 및 자동화
- [x] 단위 테스트 가이드 작성
- [x] 통합 테스트 가이드 작성
- [x] E2E 테스트 전략 수립
- [x] 배포 프로세스 문서화
- [x] 스테이징 환경 자동 배포 파이프라인 설정
- [x] 프로덕션 배포 승인 프로세스 수립
- [x] 배포 후 롤백 계획 수립

---

## 🎯 최종 목표

Phase 3 완료 시 달성한 목표:

1. ✅ **코딩 표준 문서화 및 적용 완료**
2. ✅ **Git Flow 브랜치 전략 수립 완료**
3. ✅ **코드 리뷰 규칙 구축 완료**
4. ✅ **테스트 규칙 수립 완료**
5. ✅ **배포 규칙 및 프로세스 구축 완료**

---

## 📚 참고 자료

- [코딩 표준 가이드](./docs/coding-standards.md)
- [Git Flow 가이드](./docs/git-flow-guide.md)
- [커밋 메시지 가이드](./docs/commit-message-guide.md)
- [코드 리뷰 체크리스트](./docs/code-review-checklist.md)
- [코드 리뷰 가이드라인](./docs/code-review-guidelines.md)
- [테스트 가이드](./docs/testing-guide.md)
- [E2E 테스트 전략](./docs/e2e-testing-strategy.md)
- [배포 프로세스](./docs/deployment-process.md)

---

**마지막 업데이트**: 2025-01-27  
**상태**: 완료 ✅

