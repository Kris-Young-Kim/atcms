# 문서 관리 체계 구축 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01

---

## 📋 개요

AT-CMP 프로젝트의 문서 저장소 구조, 접근 권한, 버전 관리 방법을 정의합니다.

---

## 📁 문서 저장소 구조

### 현재 구조 (GitHub 저장소)

```
AT-CMS/
├── docs/                          # 프로젝트 문서
│   ├── project-vision-mission.md  # 프로젝트 비전 및 미션
│   ├── git-flow-guide.md          # Git Flow 가이드
│   ├── issue-management-guide.md  # 이슈 관리 가이드
│   ├── raci-matrix.md             # RACI 매트릭스
│   ├── templates/                 # 문서 템플릿
│   │   ├── sprint-plan-template.md
│   │   ├── sprint-review-template.md
│   │   └── meeting-minutes-template.md
│   └── meetings/                  # 회의록 (향후 생성)
│       └── YYYY-MM/
│           └── YYYY-MM-DD_meeting-type.md
├── web/                           # 웹 애플리케이션
│   ├── README.md                  # 개발 환경 가이드
│   └── docs/                      # 기술 문서 (선택적)
└── README.md                      # 프로젝트 개요
```

### 권장 구조 확장

```
docs/
├── project/                       # 프로젝트 관리 문서
│   ├── vision-mission.md
│   ├── goals-kpi.md
│   ├── budget.md
│   ├── timeline.md
│   └── onboarding.md
├── technical/                     # 기술 문서
│   ├── architecture.md
│   ├── api.md
│   ├── database-schema.md
│   └── security.md
├── guides/                        # 가이드 문서
│   ├── git-flow-guide.md
│   ├── issue-management-guide.md
│   ├── communication-channels-guide.md
│   └── meeting-system-guide.md
├── templates/                     # 템플릿
│   ├── sprint-plan-template.md
│   ├── sprint-review-template.md
│   ├── meeting-minutes-template.md
│   └── api-documentation-template.md
└── meetings/                      # 회의록
    └── YYYY-MM/
        └── YYYY-MM-DD_meeting-type.md
```

---

## 📝 문서 카테고리 정의

### 1. 프로젝트 관리 문서

**위치**: `docs/project/`

**문서 유형**:
- 프로젝트 비전 및 미션
- 프로젝트 목표 및 KPI
- 예산 및 일정
- 팀 구성 및 역할

**접근 권한**: 전체 팀원 (읽기)

### 2. 기술 문서

**위치**: `docs/technical/` 또는 `web/docs/`

**문서 유형**:
- 아키텍처 문서
- API 문서
- 데이터베이스 스키마
- 보안 가이드

**접근 권한**: 개발팀 (읽기/쓰기)

### 3. 가이드 문서

**위치**: `docs/guides/`

**문서 유형**:
- Git Flow 가이드
- 이슈 관리 가이드
- 커뮤니케이션 가이드
- 회의 체계 가이드

**접근 권한**: 전체 팀원 (읽기)

### 4. 템플릿 문서

**위치**: `docs/templates/`

**문서 유형**:
- 스프린트 계획 템플릿
- 회의록 템플릿
- API 문서 템플릿

**접근 권한**: 전체 팀원 (읽기)

### 5. 회의록

**위치**: `docs/meetings/YYYY-MM/`

**문서 유형**:
- 일일 스탠드업 기록
- 주간 계획 회의록
- 스프린트 리뷰 기록
- 회고 기록

**접근 권한**: 전체 팀원 (읽기/쓰기)

---

## 📋 문서 네이밍 규칙

### 파일명 규칙

**형식**: `kebab-case.md`

**예시**:
- `project-vision-mission.md` ✅
- `git-flow-guide.md` ✅
- `sprint-plan-template.md` ✅

**금지**:
- `Project_Vision_Mission.md` ❌ (스네이크 케이스)
- `projectVisionMission.md` ❌ (카멜 케이스)
- `PROJECT_VISION_MISSION.md` ❌ (대문자)

### 회의록 네이밍 규칙

**형식**: `YYYY-MM-DD_meeting-type.md`

**예시**:
- `2025-11-01_daily-standup.md`
- `2025-11-04_weekly-planning.md`
- `2025-11-08_sprint-review.md`
- `2025-11-08_sprint-retrospective.md`

**회의 유형**:
- `daily-standup`: 일일 스탠드업
- `weekly-planning`: 주간 계획 회의
- `sprint-review`: 스프린트 리뷰
- `sprint-retrospective`: 회고
- `technical-meeting`: 기술 회의

---

## 📊 문서 버전 관리 규칙

### 버전 명명 규칙

**형식**: `vMAJOR.MINOR.PATCH`

**예시**:
- `v1.0.0`: 초기 버전
- `v1.1.0`: 기능 추가
- `v1.1.1`: 오타 수정
- `v2.0.0`: 주요 변경

### 버전 증가 기준

**MAJOR (주요 변경)**:
- 문서 구조 대폭 변경
- 문서 목적 변경
- 주요 내용 삭제

**MINOR (기능 추가)**:
- 새로운 섹션 추가
- 내용 추가
- 예시 추가

**PATCH (수정)**:
- 오타 수정
- 형식 수정
- 링크 수정

### 버전 관리 방법

**옵션 1: 파일 내 버전 표기**
```markdown
**버전**: v1.0.0  
**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2025-12-01
```

**옵션 2: Git 태그 사용**
```bash
git tag -a v1.0.0 -m "초기 문서 버전"
```

**권장**: 파일 내 버전 표기 + Git 커밋 히스토리

---

## 🔒 문서 접근 권한 설정

### 권한 레벨

#### 1. 공개 (Public)
- GitHub 저장소가 public인 경우
- 모든 문서가 공개
- 민감 정보 제외 필수

#### 2. 팀원 전용 (Private)
- GitHub 저장소가 private인 경우
- 팀원만 접근 가능
- 외부 협력자는 별도 권한 부여

#### 3. 관리자 전용
- 예산 정보
- 인건비 정보
- 기타 민감 정보

### 권한 매트릭스

| 문서 유형 | PM | 개발 리더 | 개발자 | 디자이너 | 외부 협력자 |
|----------|----|----|----|----|----|
| 프로젝트 관리 문서 | R/W | R | R | R | R |
| 기술 문서 | R | R/W | R/W | R | - |
| 가이드 문서 | R/W | R/W | R | R | R |
| 템플릿 | R/W | R/W | R | R | R |
| 회의록 | R/W | R/W | R | R | - |
| 예산 문서 | R/W | - | - | - | - |

**R**: 읽기, **W**: 쓰기, **-**: 접근 불가

---

## 📚 문서 템플릿 작성

### 프로젝트 문서 템플릿

```markdown
# [문서 제목]

**프로젝트 코드**: ATCMP-2026  
**작성일**: YYYY-MM-DD  
**작성자**: [이름]  
**버전**: v1.0.0

---

## 📋 개요

[문서 개요 설명]

---

## [주요 섹션]

[내용]

---

## 📝 참고 자료

- [관련 문서 링크]

---

**마지막 업데이트**: YYYY-MM-DD  
**다음 검토일**: YYYY-MM-DD
```

### 기술 문서 템플릿

```markdown
# [기술 문서 제목]

**프로젝트 코드**: ATCMP-2026  
**작성일**: YYYY-MM-DD  
**작성자**: [이름]  
**검토자**: [이름]  
**버전**: v1.0.0

---

## 📋 개요

[기술 문서 개요]

---

## 아키텍처

[아키텍처 설명]

---

## API 명세

[API 명세]

---

## 데이터베이스 스키마

[스키마 설명]

---

**마지막 업데이트**: YYYY-MM-DD  
**다음 검토일**: YYYY-MM-DD
```

---

## 🔄 문서 업데이트 프로세스

### 1. 문서 수정 요청

1. 이슈 생성 (`docs` 라벨 추가)
2. 수정 사유 명시
3. 담당자 할당

### 2. 문서 수정

1. feature 브랜치 생성 (`feature/docs-update-xxx`)
2. 문서 수정
3. PR 생성
4. 코드 리뷰 (최소 1명 승인)
5. 머지

### 3. 문서 검토

**주간 검토**:
- 주간 회의에서 문서 업데이트 확인
- 오래된 문서 확인

**월간 검토**:
- 문서 버전 업데이트
- 사용하지 않는 문서 정리

---

## 📦 문서 백업 및 보관

### 백업 방법

**자동 백업**:
- GitHub 저장소 자동 백업 (Git 자체)
- 주기적 클론 (선택적)

**수동 백업**:
- 중요 문서는 별도 위치에 보관
- 정기적으로 백업 확인

### 보관 정책

**활성 문서**: 최근 3개월 이내 업데이트
**보관 문서**: 3개월 이상 미업데이트, 별도 보관 폴더로 이동
**삭제 문서**: 1년 이상 미사용, 삭제 전 검토

---

## ✅ 완료 기준

- [ ] 문서 저장소 구조 설계 완료
- [ ] 문서 카테고리 정의 완료
- [ ] 문서 네이밍 규칙 정의 완료
- [ ] 문서 버전 관리 규칙 정의 완료
- [ ] 문서 접근 권한 설정 완료
- [ ] 문서 템플릿 작성 완료
- [ ] 문서 업데이트 프로세스 정의 완료
- [ ] 문서 백업 및 보관 정책 수립 완료

---

## 📝 참고 자료

- [프로젝트 관리 시스템](../PROJECT_MANAGEMENT_SYSTEM.md)
- [Git Flow 가이드](./git-flow-guide.md)
- [이슈 관리 가이드](./issue-management-guide.md)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2025-12-01

