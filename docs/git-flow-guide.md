# AT-CMP Git Flow 브랜치 전략 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 1. 브랜치 전략 개요

AT-CMP 프로젝트는 **Git Flow** 전략을 사용합니다.

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

---

## 2. 브랜치 유형 및 사용법

### 2.1 메인 브랜치 (Main Branches)

#### main 브랜치
- **용도**: 프로덕션 배포용 브랜치
- **특징**:
  - 항상 배포 가능한 안정적인 상태 유지
  - 보호 규칙 적용 (PR 필수, 최소 2명 승인)
  - 직접 커밋 금지
- **브랜치명**: `main`

#### develop 브랜치
- **용도**: 개발 통합 브랜치
- **특징**:
  - 모든 기능 개발의 통합 지점
  - 다음 릴리스를 위한 최신 개발 상태
  - 보호 규칙 적용 (PR 필수, 최소 1명 승인)
- **브랜치명**: `develop`

---

### 2.2 보조 브랜치 (Supporting Branches)

#### feature 브랜치
- **용도**: 새 기능 개발
- **생성**: `develop` 브랜치에서 분기
- **병합**: `develop` 브랜치로 병합
- **삭제**: 병합 후 삭제
- **브랜치명 규칙**: `feature/ATCMP-XXX-description`
  - 예: `feature/ATCMP-101-client-registration`
  - 예: `feature/ATCMP-102-search-filter`

**생성 예시**:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/ATCMP-101-client-registration
```

**병합 예시**:
```bash
git checkout develop
git merge --no-ff feature/ATCMP-101-client-registration
git push origin develop
git branch -d feature/ATCMP-101-client-registration
```

#### bugfix 브랜치
- **용도**: 버그 수정
- **생성**: `develop` 브랜치에서 분기
- **병합**: `develop` 브랜치로 병합
- **삭제**: 병합 후 삭제
- **브랜치명 규칙**: `bugfix/ATCMP-XXX-description`
  - 예: `bugfix/ATCMP-201-api-error-handling`
  - 예: `bugfix/ATCMP-202-form-validation`

**생성 예시**:
```bash
git checkout develop
git pull origin develop
git checkout -b bugfix/ATCMP-201-api-error-handling
```

#### hotfix 브랜치
- **용도**: 프로덕션 긴급 수정
- **생성**: `main` 브랜치에서 분기
- **병합**: `main`과 `develop` 브랜치로 병합
- **삭제**: 병합 후 삭제
- **브랜치명 규칙**: `hotfix/ATCMP-XXX-description`
  - 예: `hotfix/ATCMP-301-security-patch`
  - 예: `hotfix/ATCMP-302-critical-bug`

**생성 예시**:
```bash
git checkout main
git pull origin main
git checkout -b hotfix/ATCMP-301-security-patch
```

**병합 예시**:
```bash
# main 브랜치에 병합
git checkout main
git merge --no-ff hotfix/ATCMP-301-security-patch
git push origin main

# develop 브랜치에도 병합
git checkout develop
git merge --no-ff hotfix/ATCMP-301-security-patch
git push origin develop

# 브랜치 삭제
git branch -d hotfix/ATCMP-301-security-patch
```

#### release 브랜치
- **용도**: 릴리스 준비 및 최종 점검
- **생성**: `develop` 브랜치에서 분기
- **병합**: `main`과 `develop` 브랜치로 병합
- **삭제**: 병합 후 삭제
- **브랜치명 규칙**: `release/vX.X.X`
  - 예: `release/v1.0.0`
  - 예: `release/v1.1.0`

**생성 예시**:
```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0
```

**병합 예시**:
```bash
# main 브랜치에 병합 (태그 생성)
git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

# develop 브랜치에도 병합
git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop

# 브랜치 삭제
git branch -d release/v1.0.0
```

---

## 3. 브랜치 명명 규칙

### 3.1 규칙

1. **소문자 사용**: 모든 브랜치명은 소문자 사용
2. **하이픈 사용**: 단어 구분은 하이픈(`-`) 사용
3. **이슈 번호 포함**: 프로젝트 코드와 이슈 번호 포함 (가능한 경우)
4. **설명적 이름**: 브랜치의 목적을 명확히 표현

### 3.2 명명 형식

```
{type}/ATCMP-{번호}-{설명}
```

**예시**:
- ✅ `feature/ATCMP-101-client-registration`
- ✅ `bugfix/ATCMP-201-api-error`
- ✅ `hotfix/ATCMP-301-security-patch`
- ✅ `release/v1.0.0`
- ❌ `Feature/ClientRegistration` (대문자 사용)
- ❌ `feature/client_registration` (언더스코어 사용)
- ❌ `feature/client` (이슈 번호 없음)

---

## 4. 브랜치 워크플로우

### 4.1 기능 개발 워크플로우

```
1. develop 브랜치에서 최신 코드 가져오기
   git checkout develop
   git pull origin develop

2. feature 브랜치 생성
   git checkout -b feature/ATCMP-101-client-registration

3. 개발 및 커밋
   git add .
   git commit -m "feat ATCMP-101: 대상자 등록 폼 구현"

4. develop 브랜치에 최신 변경사항 반영 (필요시)
   git checkout develop
   git pull origin develop
   git checkout feature/ATCMP-101-client-registration
   git merge develop

5. 원격 저장소에 푸시
   git push origin feature/ATCMP-101-client-registration

6. Pull Request 생성 (develop ← feature)
   - GitHub에서 PR 생성
   - 코드 리뷰 요청
   - CI 통과 확인

7. PR 승인 후 병합
   - "Squash and merge" 또는 "Merge commit" 사용
   - 브랜치 삭제 (자동 또는 수동)
```

### 4.2 버그 수정 워크플로우

```
1. develop 브랜치에서 버그 수정 브랜치 생성
   git checkout develop
   git checkout -b bugfix/ATCMP-201-api-error

2. 버그 수정 및 커밋
   git commit -m "fix ATCMP-201: API 에러 핸들링 개선"

3. PR 생성 및 병합
   - develop 브랜치로 PR 생성
   - 리뷰 후 병합
```

### 4.3 긴급 수정 워크플로우

```
1. main 브랜치에서 hotfix 브랜치 생성
   git checkout main
   git checkout -b hotfix/ATCMP-301-security-patch

2. 수정 및 커밋
   git commit -m "hotfix ATCMP-301: 보안 취약점 수정"

3. main 브랜치에 병합 및 배포
   - PR 생성 (main ← hotfix)
   - 긴급 승인 후 병합
   - 즉시 배포

4. develop 브랜치에도 병합
   git checkout develop
   git merge hotfix/ATCMP-301-security-patch
```

---

## 5. 브랜치 보호 규칙

### 5.1 main 브랜치

- ✅ Pull Request 필수
- ✅ 최소 2명의 승인 필요
- ✅ 상태 체크 통과 필수 (CI/CD)
- ✅ 최신 코드와 충돌 없어야 함
- ✅ 관리자 우회 불가

### 5.2 develop 브랜치

- ✅ Pull Request 필수
- ✅ 최소 1명의 승인 필요
- ✅ 상태 체크 통과 필수 (CI/CD)
- ✅ 최신 코드와 충돌 없어야 함

---

## 6. 브랜치 정리 정책

### 6.1 브랜치 삭제 기준

- ✅ 병합 완료된 feature/bugfix/hotfix 브랜치
- ✅ 릴리스 완료된 release 브랜치
- ✅ 30일 이상 비활성화된 브랜치 (PM 검토 후)

### 6.2 브랜치 보관 기준

- ❌ 병합되지 않은 브랜치 (작업 진행 중)
- ❌ 최근 30일 내 활동이 있는 브랜치

---

## 7. 충돌 해결

### 7.1 충돌 발생 시

1. `develop` 브랜치의 최신 변경사항 가져오기
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. 작업 브랜치로 돌아가서 병합
   ```bash
   git checkout feature/ATCMP-101-client-registration
   git merge develop
   ```

3. 충돌 파일 수정
   - 충돌 마커 제거
   - 올바른 코드 선택
   - 테스트 실행

4. 충돌 해결 후 커밋
   ```bash
   git add .
   git commit -m "merge: develop 브랜치 최신 변경사항 반영"
   ```

---

## 8. 태그 관리

### 8.1 태그 규칙

- **버전 형식**: `v{MAJOR}.{MINOR}.{PATCH}`
  - 예: `v1.0.0`, `v1.1.0`, `v2.0.0`
- **태그 생성 위치**: `main` 브랜치에만 생성
- **태그 메시지**: 릴리스 노트 포함

### 8.2 태그 생성 예시

```bash
git checkout main
git tag -a v1.0.0 -m "Release v1.0.0

- 대상자 등록 기능 구현
- 상담 기록 관리 기능 추가
- 보안 개선사항 적용"
git push origin v1.0.0
```

---

## 9. 참고 자료

- [PROJECT_MANAGEMENT_SYSTEM.md](../PROJECT_MANAGEMENT_SYSTEM.md): 프로젝트 관리 시스템 문서
- [Git Flow 공식 문서](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub 브랜치 보호 규칙](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)

---

## 10. FAQ

### Q1. 이미 작업한 브랜치가 develop과 많이 달라졌어요.
**A**: 정기적으로 `develop` 브랜치를 병합하여 충돌을 방지하세요. 작업 시작 전과 커밋 전에 병합하는 것을 권장합니다.

### Q2. feature 브랜치에서 버그를 발견했어요.
**A**: 버그 수정은 별도의 `bugfix` 브랜치를 생성하거나, 현재 `feature` 브랜치에서 수정 후 커밋하세요. 버그의 심각도에 따라 결정하세요.

### Q3. hotfix를 develop에 병합하는 것을 깜빡했어요.
**A**: 가능한 빨리 `develop` 브랜치에 병합하세요. 미래의 기능 개발에 영향을 줄 수 있습니다.

**참고 자료**:
- [커밋 메시지 가이드](./commit-message-guide.md)
- [PROJECT_MANAGEMENT_SYSTEM.md](../PROJECT_MANAGEMENT_SYSTEM.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

