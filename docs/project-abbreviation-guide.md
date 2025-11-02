# AT-CMP 프로젝트 약어 사용 가이드

**프로젝트명**: AT-CMP (Assistive Technology Case Management Platform)  
**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 1. 프로젝트 약어 정의

### 1.1 공식 약어

| 약어 | 전체 명칭 | 설명 | 사용 예시 |
|------|----------|------|-----------|
| AT-CMP | Assistive Technology Case Management Platform | 프로젝트 전체 명칭 | 공식 문서, 발표 자료 |
| ATCMP | Assistive Technology Case Management Platform | 프로젝트 코드 (ATCMP-2026) | 이슈 번호, 브랜치명 |
| CMS | Client Management System | 사례관리 시스템 | 기능 모듈명 |
| ERM | Equipment Rental Management | 대여기기 관리 | 기능 모듈명 |
| CDM | Custom Device Manufacturing | 맞춤제작 | 기능 모듈명 |

### 1.2 기술 스택 약어

| 약어 | 전체 명칭 | 설명 |
|------|----------|------|
| API | Application Programming Interface | API 엔드포인트 |
| UI | User Interface | 사용자 인터페이스 |
| UX | User Experience | 사용자 경험 |
| DB | Database | 데이터베이스 |
| RLS | Row Level Security | 행 수준 보안 |
| CI/CD | Continuous Integration / Continuous Deployment | 지속적 통합/배포 |

### 1.3 역할 및 조직 약어

| 약어 | 전체 명칭 | 설명 |
|------|----------|------|
| PM | Project Manager | 프로젝트 매니저 |
| FE | Frontend | 프론트엔드 개발자 |
| BE | Backend | 백엔드 개발자 |
| FS | Fullstack | 풀스택 개발자 |
| QA | Quality Assurance | 품질 보증 |

---

## 2. 약어 사용 규칙

### 2.1 문서 작성 시

1. **첫 사용 시**: 전체 명칭과 약어를 함께 표기
   - 예: "Assistive Technology Case Management Platform (AT-CMP)"
   - 예: "프로젝트 관리 시스템 (Project Management System, PMS)"

2. **이후 사용**: 약어만 사용 가능
   - 예: "AT-CMP는..."

3. **코드 및 기술 문서**: 약어 사용 권장
   - 예: `ATCMP-2026`, `CMS-001`, `ERM-003`

### 2.2 커밋 메시지 및 브랜치명

- **커밋 메시지**: 프로젝트 코드 사용
  - 예: `feat ATCMP-101: 대상자 등록 기능 구현`
- **브랜치명**: kebab-case와 약어 혼용
  - 예: `feature/ATCMP-101-client-registration`
  - 예: `bugfix/ATCMP-102-api-error`

### 2.3 이슈 및 PR

- **이슈 제목**: 프로젝트 코드 사용
  - 예: `ATCMP-101: 대상자 등록 기능 구현`
- **라벨**: 약어 사용 가능
  - 예: `cms`, `erm`, `frontend`, `backend`

---

## 3. 금지 사항

### 3.1 사용 금지 약어

- ❌ `ATCARE`: 이전 프로젝트 코드 (현재 사용하지 않음)
- ❌ `AT-Care`: 이전 프로젝트명 (현재 사용하지 않음)
- ❌ 모호한 약어: 팀 내에서 합의되지 않은 약어 사용 금지

### 3.2 혼용 금지

- ❌ 동일 문서 내에서 전체 명칭과 약어를 무작위로 혼용
- ❌ 공식 문서에서 약어만 사용 (첫 사용 시 전체 명칭 필수)

---

## 4. 약어 사전 관리

### 4.1 신규 약어 추가 프로세스

1. 새로운 약어 필요 시 팀 회의에서 논의
2. 약어 정의 및 사용 규칙 문서화
3. 이 가이드 문서에 추가
4. 팀원에게 공유

### 4.2 약어 검토

- **정기 검토**: 분기별 약어 사용 현황 검토
- **갱신**: 필요 시 약어 가이드 업데이트

---

## 5. 참고 자료

- [PROJECT_MANAGEMENT_SYSTEM.md](../PROJECT_MANAGEMENT_SYSTEM.md): 프로젝트 관리 시스템 문서
- [TODO.md](../TODO.md): 프로젝트 TODO 체크리스트

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

