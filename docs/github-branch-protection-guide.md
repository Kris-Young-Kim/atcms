# GitHub 브랜치 보호 규칙 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01

---

## 📋 개요

develop 브랜치가 성공적으로 생성되었습니다. 이제 GitHub에서 브랜치 보호 규칙을 설정해야 합니다.

---

## 🔒 브랜치 보호 규칙 설정 방법

### 1. GitHub 저장소 접속

1. [GitHub 저장소](https://github.com/Kris-Young-Kim/atcms) 접속
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Branches** 클릭

### 2. main 브랜치 보호 규칙 설정

**브랜치 이름 패턴**: `main`

#### 필수 설정

- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: 2 (최소 2명 승인)
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - ✅ **Require review from Code Owners** (선택 사항)

- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  - 필수 체크:
    - `lint` (ESLint)
    - `type-check` (TypeScript)
    - `test` (Jest)
    - `build` (Next.js 빌드)

- ✅ **Require conversation resolution before merging**

- ✅ **Do not allow bypassing the above settings**
  - ✅ **Restrict pushes that create matching branches**

- ✅ **Include administrators** (관리자도 규칙 적용)

#### 선택 사항

- [ ] **Require linear history** (선택 사항)
- [ ] **Allow force pushes** (비활성화 권장)
- [ ] **Allow deletions** (비활성화 권장)

### 3. develop 브랜치 보호 규칙 설정

**브랜치 이름 패턴**: `develop`

#### 필수 설정

- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: 1 (최소 1명 승인)
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**

- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  - 필수 체크:
    - `lint` (ESLint)
    - `type-check` (TypeScript)
    - `test` (Jest)
    - `build` (Next.js 빌드)

- ✅ **Require conversation resolution before merging**

- ✅ **Do not allow bypassing the above settings**
  - ✅ **Restrict pushes that create matching branches**

- ✅ **Include administrators** (관리자도 규칙 적용)

---

## ✅ 설정 완료 확인

### 확인 사항

1. **main 브랜치 직접 푸시 차단 확인**
   ```bash
   # 이 명령이 실패해야 합니다 (권한 에러)
   git push origin main
   ```

2. **develop 브랜치 직접 푸시 차단 확인**
   ```bash
   # 이 명령이 실패해야 합니다 (권한 에러)
   git push origin develop
   ```

3. **PR 생성 및 승인 프로세스 확인**
   - feature 브랜치에서 develop으로 PR 생성
   - 최소 1명 승인 후 병합 가능 확인

---

## 📝 권한 설정

### 팀원별 권한

| 역할 | 저장소 권한 | 설명 |
|------|-----------|------|
| PM | Admin | 모든 권한 (설정 포함) |
| 개발 리더 | Admin | 모든 권한 (설정 포함) |
| 개발자 | Write | 코드 작성, PR 생성 가능 |
| 디자이너 | Read | 읽기 전용 |

### 권한 설정 방법

1. 저장소 **Settings** → **Collaborators and teams**
2. 각 팀원에게 적절한 권한 부여

---

## 🔗 관련 문서

- [Git Flow 가이드](./git-flow-guide.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)

---

**마지막 업데이트**: 2025-11-01

