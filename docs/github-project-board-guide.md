# GitHub 프로젝트 보드 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01

---

## 📋 개요

GitHub Projects를 사용하여 칸반 보드를 생성하고 자동화 규칙을 설정하는 방법을 안내합니다.

---

## 🎯 Step 1: 프로젝트 보드 생성

### 1.1 프로젝트 보드 생성

1. [GitHub 저장소](https://github.com/Kris-Young-Kim/atcms) 접속
2. 상단 메뉴에서 **Projects** 클릭
3. **New project** 클릭
4. **Board** 템플릿 선택
5. 프로젝트 이름 입력: `AT-CMP Project Board`
6. **Create** 클릭

### 1.2 칼럼 설정

기본 칼럼을 다음과 같이 설정합니다:

1. **To Do** (기본)
   - 새로 생성된 이슈가 여기에 자동으로 추가됨

2. **In Progress**
   - 작업이 진행 중인 이슈

3. **Review**
   - 코드 리뷰 대기 중인 PR

4. **Done**
   - 완료된 작업

**추가 칼럼** (선택 사항):
- **Blocked**: 블로킹된 작업
- **Testing**: 테스트 중인 작업

---

## ⚙️ Step 2: 자동화 규칙 설정

### 2.1 이슈 자동화 규칙

#### 규칙 1: 이슈 생성 시 To Do에 추가

**조건**:
- 이슈가 생성되면

**동작**:
- `To Do` 칼럼에 자동으로 추가

**설정 방법**:
1. 프로젝트 보드에서 **⚙️ (설정)** 아이콘 클릭
2. **Workflows** 탭 선택
3. **+ Add workflow** 클릭
4. **When**: `Issues` → `opened`
5. **Action**: `Add to project` → `AT-CMP Project Board`
6. **Status**: `To Do`
7. **Save** 클릭

#### 규칙 2: 라벨에 따른 자동 분류

**조건**:
- 이슈에 `priority:p0` 라벨이 추가되면

**동작**:
- `To Do` 칼럼의 맨 위로 이동

**설정 방법**:
1. **+ Add workflow** 클릭
2. **When**: `Issues` → `Labeled` → `priority:p0`
3. **Action**: `Move to top of column` → `To Do`
4. **Save** 클릭

### 2.2 Pull Request 자동화 규칙

#### 규칙 1: PR 생성 시 Review에 추가

**조건**:
- Pull Request가 생성되면

**동작**:
- `Review` 칼럼에 자동으로 추가

**설정 방법**:
1. **+ Add workflow** 클릭
2. **When**: `Pull requests` → `opened`
3. **Action**: `Add to project` → `AT-CMP Project Board`
4. **Status**: `Review`
5. **Save** 클릭

#### 규칙 2: PR 머지 시 Done으로 이동

**조건**:
- Pull Request가 병합되면

**동작**:
- `Done` 칼럼으로 자동 이동

**설정 방법**:
1. **+ Add workflow** 클릭
2. **When**: `Pull requests` → `merged`
3. **Action**: `Move to column` → `Done`
4. **Save** 클릭

#### 규칙 3: PR 닫힘 시 Done으로 이동

**조건**:
- Pull Request가 닫히면 (병합되지 않고 닫힌 경우)

**동작**:
- `Done` 칼럼으로 자동 이동

**설정 방법**:
1. **+ Add workflow** 클릭
2. **When**: `Pull requests` → `closed`
3. **Action**: `Move to column` → `Done`
4. **Save** 클릭

### 2.3 상태 변경 자동화 규칙

#### 규칙 1: 이슈가 "In Progress"로 변경

**조건**:
- 이슈에 `status:in-progress` 라벨이 추가되면

**동작**:
- `In Progress` 칼럼으로 자동 이동

**설정 방법**:
1. **+ Add workflow** 클릭
2. **When**: `Issues` → `Labeled` → `status:in-progress`
3. **Action**: `Move to column` → `In Progress`
4. **Save** 클릭

#### 규칙 2: 이슈가 블로킹됨

**조건**:
- 이슈에 `status:blocked` 라벨이 추가되면

**동작**:
- `Blocked` 칼럼으로 자동 이동 (있는 경우)

---

## 📊 Step 3: 마일스톤 연결

### 3.1 마일스톤 생성

1. 저장소에서 **Issues** 탭 클릭
2. **Milestones** 클릭
3. **New milestone** 클릭
4. 마일스톤 정보 입력:
   - **Title**: `MVP 기초 구축` (예: 2026-01-15)
   - **Due date**: 마일스톤 날짜
   - **Description**: 마일스톤 설명

### 3.2 주요 마일스톤

다음 마일스톤을 생성하는 것을 권장합니다:

1. **MVP 기초 구축** (2026-01-15)
   - 대상자 등록 기능 완성
   - 기본 인프라 구축

2. **핵심 기능 완성** (2026-03-31)
   - 사례관리 핵심 기능 완성
   - 대여기기 관리 기능 완성

3. **베타 릴리스** (2026-06-30)
   - 베타 버전 출시 준비
   - 사용자 테스트

4. **정식 출시** (2026-08-31)
   - 정식 버전 출시
   - 전체 기능 완성

### 3.3 마일스톤과 프로젝트 보드 연결

1. 프로젝트 보드에서 이슈/PR 선택
2. 오른쪽 패널에서 **Milestone** 선택
3. 연결할 마일스톤 선택

마일스톤 진행률은 자동으로 추적됩니다.

---

## 🔗 Step 4: 필터 및 뷰 설정

### 4.1 보드 필터 설정

프로젝트 보드에서 필터를 설정하여 특정 항목만 볼 수 있습니다:

- **담당자별 필터**: `assignee:@username`
- **라벨별 필터**: `label:cms`
- **마일스톤별 필터**: `milestone:"MVP 기초 구축"`
- **상태별 필터**: `status:in-progress`

### 4.2 저장된 뷰 생성

자주 사용하는 필터 조합을 저장할 수 있습니다:

1. 필터 설정
2. **Save view** 클릭
3. 뷰 이름 입력 (예: "내 작업", "긴급 작업")

---

## ✅ 완료 기준

- [ ] 프로젝트 보드 생성 완료
- [ ] 기본 칼럼 설정 완료 (To Do, In Progress, Review, Done)
- [ ] 이슈 자동화 규칙 설정 완료
- [ ] PR 자동화 규칙 설정 완료
- [ ] 마일스톤 생성 및 연결 완료
- [ ] 팀원에게 보드 사용법 안내 완료

---

## 📝 사용 가이드

### 개발자 워크플로우

1. **새 작업 시작**
   - 이슈 생성 → 자동으로 `To Do`에 추가
   - 작업 시작 시 `status:in-progress` 라벨 추가 → `In Progress`로 이동

2. **코드 리뷰**
   - PR 생성 → 자동으로 `Review`에 추가
   - 리뷰 완료 후 병합 → `Done`으로 이동

3. **작업 완료**
   - 이슈에 `status:done` 라벨 추가 → `Done`으로 이동

---

## 🔗 관련 문서

- [이슈 관리 가이드](./issue-management-guide.md)
- [Git Flow 가이드](./git-flow-guide.md)
- [프로젝트 실행 계획](./phase1-execution-plan.md)

---

**마지막 업데이트**: 2025-11-01

