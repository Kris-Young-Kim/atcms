# 정적 코드 분석 도구 통합 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 프로젝트에 정적 코드 분석 도구를 통합하는 방법을 설명합니다. 현재 ESLint가 기본 설정되어 있으며, 추가로 코드 품질과 복잡도를 분석하는 도구를 통합할 수 있습니다.

---

## 🎯 목표

1. **코드 품질 자동 분석**
2. **코드 냄새(Code Smell) 감지**
3. **복잡도 검사**
4. **보안 취약점 검사**
5. **CI/CD 통합**

---

## 📝 옵션 비교

### 옵션 1: ESLint 강화 (권장)

**장점**:
- ✅ 추가 비용 없음
- ✅ 설정 간단
- ✅ 빠른 실행 속도
- ✅ GitHub Actions와 통합 용이

**단점**:
- ⚠️ 코드 품질 지표 시각화 제한적
- ⚠️ 코드 커버리지와 연동 필요

**추천 상황**: 소규모 프로젝트, 빠른 설정 필요

### 옵션 2: SonarCloud

**장점**:
- ✅ 풍부한 코드 품질 지표
- ✅ 코드 커버리지와 연동
- ✅ 기술 부채 추적
- ✅ GitHub 통합 용이
- ✅ 무료 티어 제공 (공개 저장소)

**단점**:
- ⚠️ 설정 복잡도 높음
- ⚠️ 실행 시간 증가
- ⚠️ 비공개 저장소는 유료

**추천 상황**: 중대형 프로젝트, 상세한 품질 지표 필요

### 옵션 3: CodeQL

**장점**:
- ✅ GitHub 기본 제공
- ✅ 보안 중심 분석
- ✅ 무료

**단점**:
- ⚠️ 코드 품질 분석 기능 제한적
- ⚠️ 복잡도 분석 부족

**추천 상황**: 보안 중심 프로젝트

---

## 🚀 옵션 1: ESLint 강화 (현재 적용)

### 현재 설정

ESLint가 이미 설정되어 있으며, 다음 규칙들이 적용되어 있습니다:
- TypeScript `any` 타입 금지
- Next.js 규칙 통합
- Prettier 통합

### 추가 규칙 제안

#### 복잡도 검사 규칙
```javascript
// eslint.config.mjs에 추가
rules: {
  complexity: ["error", { max: 10 }], // 순환 복잡도 최대 10
  "max-lines-per-function": ["warn", { max: 100 }], // 함수당 최대 라인 수
  "max-depth": ["warn", { max: 4 }], // 최대 중첩 깊이
  "max-params": ["warn", { max: 5 }], // 최대 매개변수 수
}
```

#### 코드 냄새 감지 규칙
```javascript
rules: {
  "no-console": ["warn", { allow: ["warn", "error"] }], // console.log 금지
  "no-debugger": "error", // debugger 금지
  "no-alert": "error", // alert 금지
  "no-eval": "error", // eval 금지
  "no-implied-eval": "error", // 암시적 eval 금지
  "no-new-func": "error", // new Function 금지
}
```

### 적용 방법

1. `web/eslint.config.mjs` 파일을 열어서 위 규칙들을 추가합니다.
2. CI/CD에서 자동으로 실행됩니다 (`.github/workflows/ci.yml`에 이미 포함됨).

---

## 🔧 옵션 2: SonarCloud 설정

### 사전 준비

1. **SonarCloud 계정 생성**
   - https://sonarcloud.io/ 접속
   - GitHub 계정으로 로그인

2. **프로젝트 추가**
   - "Add Project" 클릭
   - GitHub 저장소 선택
   - 프로젝트 키 설정 (예: `Kris-Young-Kim_atcmp`)

3. **Organization Key 확인**
   - SonarCloud 대시보드에서 Organization Key 확인

### GitHub Secrets 설정

다음 Secrets를 GitHub 저장소에 추가합니다:
- `SONAR_TOKEN`: SonarCloud에서 생성한 토큰

### GitHub Actions 워크플로우 추가

`.github/workflows/sonarcloud.yml` 파일 생성:

```yaml
name: SonarCloud Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  sonarcloud:
    name: SonarCloud Analysis
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 전체 히스토리 필요

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.19.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests with coverage
        run: pnpm --filter web test:ci
        env:
          SKIP_ENV_VALIDATION: true
          NODE_ENV: test

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### SonarCloud 설정 파일

프로젝트 루트에 `sonar-project.properties` 파일 생성:

```properties
sonar.projectKey=Kris-Young-Kim_atcmp
sonar.organization=kris-young-kim

sonar.sources=web/src
sonar.exclusions=**/node_modules/**,**/dist/**,**/__tests__/**,**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx

sonar.tests=web/src
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx

sonar.javascript.lcov.reportPaths=web/coverage/lcov.info
sonar.typescript.lcov.reportPaths=web/coverage/lcov.info

sonar.sourceEncoding=UTF-8
```

---

## 📊 코드 품질 게이트 설정

### ESLint 기반 게이트

현재 CI/CD 워크플로우에서 ESLint 경고가 있으면 실패하도록 설정되어 있습니다:
- `lint` 단계에서 `--max-warnings 0` 옵션 사용

### SonarCloud 게이트

SonarCloud에서는 프로젝트 설정에서 Quality Gate를 설정할 수 있습니다:
- 코드 커버리지 70% 이상
- 중복 코드 3% 이하
- 취약점 0개
- 보안 핫스팟 0개

---

## 🔍 코드 품질 지표 추적

### ESLint 기반 지표

- **복잡도**: 순환 복잡도 10 이하
- **함수 길이**: 함수당 100줄 이하
- **중첩 깊이**: 최대 4단계
- **매개변수 수**: 최대 5개

### SonarCloud 지표

- **코드 커버리지**: 70% 이상
- **중복 코드**: 3% 이하
- **기술 부채**: 추적 가능
- **보안 취약점**: 0개
- **코드 냄새**: 각 카테고리별 추적

---

## ✅ 완료 기준

### ESLint 강화 완료 기준
- [x] ESLint 복잡도 규칙 추가
- [x] 코드 냄새 감지 규칙 추가
- [x] CI/CD에 통합 확인

### SonarCloud 통합 완료 기준
- [ ] SonarCloud 계정 생성 및 프로젝트 추가
- [ ] GitHub Secrets 설정 완료
- [ ] GitHub Actions 워크플로우 생성
- [ ] `sonar-project.properties` 파일 생성
- [ ] 첫 번째 분석 실행 성공

---

## 📚 참고 자료

- [ESLint 공식 문서](https://eslint.org/docs/latest/)
- [SonarCloud 공식 문서](https://docs.sonarcloud.io/)
- [CodeQL 공식 문서](https://codeql.github.com/docs/)
- [프로젝트 ESLint 설정 가이드](./docs/eslint-config-guide.md)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: Phase 6 완료 시

