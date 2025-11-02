# AT-CMP 기여 가이드 (Contributing Guide)

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 🎯 기여 가이드 개요

AT-CMP 프로젝트에 기여해주셔서 감사합니다! 이 가이드는 프로젝트에 기여하는 방법을 안내합니다.

---

## 📋 시작하기 전에

### 필수 준비 사항

1. 프로젝트 저장소 포크 또는 클론
2. 개발 환경 설정 완료 ([web/README.md](../web/README.md) 참고)
3. 프로젝트 관리 시스템 문서 읽기 ([PROJECT_MANAGEMENT_SYSTEM.md](../PROJECT_MANAGEMENT_SYSTEM.md))
4. 코딩 스타일 가이드 확인 (아래 섹션 참고)

---

## 🌿 브랜치 전략 (Git Flow)

프로젝트는 **Git Flow** 전략을 사용합니다.

### 브랜치 구조

```
main (프로덕션)
  │
  ├── develop (개발 통합)
  │     │
  │     ├── feature/ATCMP-XXX-xxx (기능 개발)
  │     ├── bugfix/ATCMP-XXX-xxx (버그 수정)
  │     └── release/vX.X.X (릴리스 준비)
  │
  └── hotfix/ATCMP-XXX-xxx (긴급 수정)
```

### 브랜치 명명 규칙

- **기능 개발**: `feature/ATCMP-XXX-description`
  - 예: `feature/ATCMP-101-client-registration`
- **버그 수정**: `bugfix/ATCMP-XXX-description`
  - 예: `bugfix/ATCMP-201-api-error`
- **긴급 수정**: `hotfix/ATCMP-XXX-description`
  - 예: `hotfix/ATCMP-301-security-patch`
- **릴리스**: `release/vX.X.X`
  - 예: `release/v1.0.0`

### 워크플로우

1. **최신 코드 가져오기**
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **브랜치 생성**
   ```bash
   git checkout -b feature/ATCMP-101-client-registration
   ```

3. **개발 및 커밋**
   ```bash
   git add .
   git commit -m "feat ATCMP-101: 대상자 등록 폼 구현"
   ```

4. **Pull Request 생성**
   - GitHub에서 `develop` 브랜치로 PR 생성
   - 코드 리뷰 요청
   - CI 통과 확인

5. **병합 및 정리**
   - 리뷰 승인 후 병합
   - 브랜치 삭제

자세한 내용은 [Git Flow 가이드](./docs/git-flow-guide.md)를 참고하세요.

---

## 💬 커밋 메시지 규칙

### 형식

```
[TYPE] ATCMP-XXX: 간단한 설명

상세 설명 (옵션)

- 변경 사항 1
- 변경 사항 2
```

### TYPE 종류

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `refactor`: 코드 리팩토링
- `docs`: 문서 수정
- `test`: 테스트 추가/수정
- `style`: 코드 포맷팅 (기능 변경 없음)
- `chore`: 빌드 업무 수정, 패키지 매니저 설정 등
- `perf`: 성능 개선

### 예시

```bash
# 기능 추가
git commit -m "feat ATCMP-101: 대상자 등록 API 구현

- POST /api/clients 엔드포인트 추가
- Zod 검증 스키마 구현
- Jest 테스트 작성"

# 버그 수정
git commit -m "fix ATCMP-201: API 에러 핸들링 개선"
```

커밋 템플릿 사용:
```bash
git config commit.template .gitmessage
```

---

## 📝 코드 스타일 가이드

### TypeScript

- **언어**: TypeScript (any 타입 금지)
- **들여쓰기**: 2 스페이스
- **라인 길이**: 최대 100자
- **명명 규칙**:
  - 파일: `kebab-case` (예: `user-profile.tsx`)
  - 변수/함수: `camelCase` (예: `getUserProfile`)
  - 타입/인터페이스: `PascalCase` (예: `UserProfile`)
  - 상수: `UPPER_SNAKE_CASE` (예: `MAX_RETRIES`)

### ESLint 및 Prettier

- 프로젝트는 ESLint와 Prettier를 사용합니다
- 커밋 전에 반드시 린트 검사를 실행하세요:
  ```bash
  pnpm lint
  pnpm format
  ```

### 파일 구조

```
src/
├── app/              # Next.js App Router 페이지
├── components/       # React 컴포넌트
│   ├── ui/          # 재사용 가능한 UI 컴포넌트
│   └── [feature]/   # 기능별 컴포넌트
├── lib/             # 유틸리티 함수
├── config/          # 설정 파일
└── types/           # TypeScript 타입 정의
```

---

## 🧪 테스트

### 테스트 작성 규칙

- 모든 주요 함수/컴포넌트에 단위 테스트 작성
- 테스트 파일 명명: `.test.ts` 또는 `.spec.ts`
- 테스트 커버리지 목표: **70% 이상**

### 테스트 실행

```bash
# 개발 모드 (watch)
pnpm test

# CI 모드 (커버리지 포함)
pnpm test:ci
```

---

## 🔍 코드 리뷰

### Pull Request 체크리스트

- [ ] 코드가 프로젝트 코딩 스타일을 준수합니다
- [ ] ESLint 및 Prettier 검사를 통과했습니다
- [ ] 모든 테스트가 통과합니다
- [ ] 테스트 커버리지가 70% 이상입니다
- [ ] 관련 문서를 업데이트했습니다 (필요한 경우)
- [ ] 감사 로그를 추가했습니다 (CRUD 작업인 경우)

### 리뷰 프로세스

1. PR 생성 시 자동으로 리뷰어 할당
2. 리뷰어는 24시간 내 피드백 제공
3. 피드백 반영 후 다시 리뷰 요청
4. 최소 1명 이상 승인 필요 (develop 브랜치)
5. 최소 2명 이상 승인 필요 (main 브랜치)

---

## 🐛 버그 리포트

버그를 발견했다면:

1. [버그 리포트 템플릿](../.github/ISSUE_TEMPLATE/bug_report.md) 사용
2. 재현 단계를 명확히 작성
3. 환경 정보 포함
4. 스크린샷 또는 로그 첨부

---

## 💡 기능 제안

새로운 기능을 제안하고 싶다면:

1. [기능 요청 템플릿](../.github/ISSUE_TEMPLATE/feature_request.md) 사용
2. 사용 사례와 제안하는 솔루션 명확히 작성
3. 수용 기준 정의

---

## ❓ 질문

질문이 있다면:

1. [질문 템플릿](../.github/ISSUE_TEMPLATE/question.md) 사용
2. 시도한 방법과 참고 자료 포함

---

## 📚 관련 문서

- [프로젝트 관리 시스템](../PROJECT_MANAGEMENT_SYSTEM.md)
- [Git Flow 가이드](./docs/git-flow-guide.md)
- [이슈 관리 가이드](./docs/issue-management-guide.md)
- [프로젝트 약어 가이드](./docs/project-abbreviation-guide.md)
- [개발 환경 설정 가이드](../web/ENV_SETUP.md)

---

## 🤝 행동 강령

- 존중과 배려를 바탕으로 소통합니다
- 건설적인 피드백을 제공합니다
- 다양성을 존중합니다

---

## 📞 문의

질문이나 제안이 있다면:

- GitHub Issues를 통해 문의
- 프로젝트 관리자에게 직접 연락

---

**마지막 업데이트**: 2025-11-01

