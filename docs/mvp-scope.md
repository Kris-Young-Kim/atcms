# AT-Care Phase 1 MVP Scope & Backlog

## 1. 범위 개요

- 기준 문서: `AT-Care_PRD_v1.0.md`, `PROJECT_MANAGEMENT_SYSTEM.md`, `atc_rules.mdc`
- MVP 목표: 사례관리(CMS)와 대여관리(ERM) 핵심 P0 기능 + 필수 인증·감사 로깅 제공
- 공통 원칙
  - 기술 스택: Next.js 14 (TypeScript), Supabase, Clerk, Tailwind CSS
  - 코드 규칙: 2스페이스 들여쓰기, 100자 라인 제한, camelCase/PascalCase 명명
  - 보안: RLS, 입력 검증(Zod), 감사 로그 기록, 민감 정보 환경 변수화
  - 로깅: 모든 CRUD·상태 변경 API에 `auditLogger.info/error` 호출 필수

## 2. P0 기능 분류

### 2.1 사례관리 (Client Case Management)

- CMS-001 대상자 등록
- CMS-002 대상자 조회/수정
- CMS-003 대상자 검색/필터
- CMS-005 상담 기록
- CMS-006 평가 기록

### 2.2 대여기기 관리 (Equipment Rental Management)

- ERM-001 기기 재고 관리
- ERM-003 대여/반납 프로세스
- ERM-005 기기 상태 관리

### 2.3 맞춤제작 (연계 준비)

- CDM-001 제작 요청 생성 _(데이터 모델 및 API만 선구축, UI는 Phase 2 연계)_
- CDM-003 제작 단계 추적 _(상태 값 및 로깅 구조 정의)_

### 2.4 공통/인프라

- 인증 및 권한: Clerk 통합, RBAC(Role: admin, leader, specialist, technician, socialWorker)
- 데이터 보안: Supabase RLS 정책, 감사 로그 테이블 설계
- 시스템 서포트: 대시보드 KPI Stub, 환경 변수 템플릿, 테스트 파이프라인

## 3. 백로그 (Epic → Story → Task)

### 3.1 EPIC CMS: 대상자 사례관리 기초 구축

| ID        | 유형  | 제목                         | 상세 설명                                                   | 수용 기준 (AC)                                                                                                                                                       | 의존성    | 로깅                                             |
| --------- | ----- | ---------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------ |
| CMS-EP-01 | Epic  | 사례관리 데이터 모델         | `clients`, `service_records` 테이블, Supabase RLS 초안 수립 | - ERD 작성<br>- 각 컬럼 데이터 타입 정의<br>- 역할별 접근 제어 매트릭스 존재                                                                                         | 없음      | 테이블 생성 및 RLS 적용 시 감사 로그             |
| CMS-US-01 | Story | 대상자 등록 플로우 (CMS-001) | 대상자 등록 폼, API, RLS, UI 연결                           | - 15개 필드 입력 가능<br>- 성공/실패 토스트<br>- 감사 로그 기록(`client_created`)<br>- 단위 테스트 70% 이상                                                          | CMS-EP-01 | 성공·실패 각각 `auditLogger.info/error`          |
| CMS-US-02 | Story | 대상자 조회/수정 (CMS-002)   | 목록/상세 페이지, 인라인 수정, 권한 제어                    | - 목록 페이지 페이지네이션 25개 기본<br>- 상세 탭 구조(Overview/Notes/Assessments/Eqpt) 기본 섹션만 표시<br>- 수정 시 optimistic UI + toast<br>- 변경 내용 감사 로그 | CMS-US-01 | 조회 `auditLogger.info`, 수정 `auditLogger.info` |
| CMS-US-03 | Story | 대상자 검색/필터 (CMS-003)   | 이름, 장애 유형, 상태 검색/필터                             | - 검색어 300ms 디바운스<br>- 필터 상태 URL 쿼리로 반영<br>- 접근성 준수 (ARIA)                                                                                       | CMS-US-02 | 검색 실행 시 `auditLogger.info`                  |
| CMS-US-04 | Story | 상담 기록 CRUD (CMS-005)     | 상담 기록 타임라인, 등록 폼                                 | - SOAP 템플릿 자동<br>- 파일 첨부 Supabase Storage 연결<br>- ACL: 작성자/관리자만 수정<br>- 감사 로그(`consultation_created`)                                        | CMS-US-01 | 생성/수정 시 `auditLogger.info`                  |
| CMS-US-05 | Story | 평가 기록 관리 (CMS-006)     | 평가 점수 입력, 체크리스트 저장                             | - 평가 유형 프리셋(기능/환경/욕구)<br>- 점수 검증 (0-5)<br>- PDF 첨부 지원<br>- 감사 로그(`assessment_created`)                                                      | CMS-US-01 | CRUD 전반 `auditLogger.info`                     |

#### CMS 세부 작업 목록 (JIRA Sub-task 제안)

- CMS-EP-01
  - ERD 다이어그램 작성 및 Notion 업로드
  - Supabase DDL 초안 작성 (`clients`, `service_records`)
  - 역할별 RLS 정책 정의 문서화 (`admin`, `leader`, `specialist`, `socialWorker`)
- CMS-US-01
  - React Hook Form + Zod 기반 등록 폼 컴포넌트 생성 (`src/app/clients/new/page.tsx` 예정)
  - `POST /api/clients` 라우트 구현 및 `auditLogger.info('client_created')` 호출
  - 성공/실패 토스트 컴포넌트 연결, 폼 유효성 테스트 작성
  - Supabase Storage 파일 업로드(선택 첨부) 연동 및 단위 테스트 추가
- CMS-US-02
  - `GET /api/clients` 목록 API 구현 (페이지네이션, 필터 파라미터 처리)
  - `/clients` 페이지 테이블 UI + 상세 페이지 탭 뼈대 구현
  - 수정 API(`PATCH /api/clients/:id`)와 optimistic 업데이트, 감사 로그 호출
  - 접근성 점검(테이블 헤더, ARIA 라벨) 및 Jest 스냅샷 테스트
- CMS-US-03
  - 검색/필터 상태를 URL 쿼리로 동기화하는 훅 구현 (`useClientFilters`)
  - 300ms 디바운스 유틸 추가 (`/utils/debounce.ts`)
  - 검색/필터 실행 시 감사 로그 호출 + 에러 처리 토스트
  - 접근성 확인(Escape 키, 포커스 관리) 및 테스트
- CMS-US-04
  - 상담 기록 타임라인 컴포넌트 + CRUD API (`/api/clients/[id]/consultations`)
  - SOAP 템플릿 자동 삽입 유틸 및 첨부파일 처리 구현
  - 권한 검사: 작성자/관리자만 수정하도록 Clerk + RLS 재검증
  - 감사 로그 액션(`consultation_created/updated/deleted`)과 단위 테스트 작성
- CMS-US-05
  - 평가 유형 프리셋 및 점수 검증 로직(Zod) 정의
  - 평가 기록 양식 + PDF 업로드 옵션 구현
  - 점수 계산/표시 컴포넌트와 Supabase API 연동
  - CRUD 감사 로그, 에러 핸들링, 단위 테스트 작성

### 3.2 EPIC ERM: 대여 기기 관리 초기 버전

| ID        | 유형  | 제목                         | 상세 설명                           | 수용 기준 (AC)                                                                                                     | 의존성    | 로깅                         |
| --------- | ----- | ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------- | ---------------------------- |
| ERM-EP-01 | Epic  | 기기 재고 데이터 모델        | `equipment`, `rentals` 테이블 + RLS | - ERD 확정<br>- 상태 Enum 정의(normal, maintenance, retired)<br>- 역할 권한 매트릭스 정의                          | CMS-EP-01 | 스키마 적용 시 감사 로그     |
| ERM-US-01 | Story | 기기 재고 관리 UI (ERM-001)  | 재고 목록, 상태 변경, 수량 조정     | - 목록 테이블(기기명, 카테고리, 수량, 상태)<br>- 상태 변경 Confirm 모달<br>- 감사 로그(`equipment_status_updated`) | ERM-EP-01 | 상태 변경 `auditLogger.info` |
| ERM-US-02 | Story | 대여/반납 프로세스 (ERM-003) | 대여 신청 → 반납 처리 UI            | - 대여 생성 시 계약서 PDF Stub 저장<br>- 반납 시 상태 업데이트<br>- 기기 가용 수량 자동 갱신                       | ERM-US-01 | 대여·반납 각각 로그          |
| ERM-US-03 | Story | 기기 상태 모니터링 (ERM-005) | 상태별 필터, 유지보수 메모          | - 상태 필터 버튼<br>- 유지보수 노트 히스토리<br>- 감사 로그(`maintenance_note_added`)                              | ERM-US-01 | 노트 추가 시 로그            |

#### ERM 세부 작업 목록 (JIRA Sub-task 제안)

- ERM-EP-01
  - `equipment`, `rentals` 테이블 DDL 작성 및 상태 Enum 정의
  - 기기 상태 전이 다이어그램 작성(maintenance ↔ normal 등)
  - 역할별 권한 매트릭스 문서화 (관리자, 기술자, 사회복지사)
- ERM-US-01
  - `GET /api/equipment` API 구현 + 감사 로그(조회)
  - 재고 목록 테이블 컴포넌트 + 상태 변경 모달 구현
  - `PATCH /api/equipment/:id/status` 엔드포인트 + 감사 로그 호출
  - Jest/RTL 기반 상호작용 테스트(상태 변경 확인)
- ERM-US-02
  - `POST /api/rentals` 및 `PATCH /api/rentals/:id/return` API 작성
  - 계약서 PDF Stub 생성 유틸(향후 Toss 연계 대비)
  - 대여/반납 UI 흐름 + 재고 자동 갱신 로직 구현
  - 감사 로그(`rental_created`, `rental_returned`) 및 단위 테스트
- ERM-US-03
  - 상태별 필터 버튼 + 뱃지 컴포넌트 구현
  - 유지보수 노트 작성 모달 + Supabase 저장/API 구현
  - 감사 로그(`maintenance_note_added`)와 에러 핸들링 테스트
  - 기기 상태 차트(간단한 바차트) Stub 추가

### 3.3 EPIC CDM: 맞춤제작 데이터 준비

| ID        | 유형  | 제목                 | 상세 설명                                | 수용 기준 (AC)                                                                                                     | 의존성    | 로깅               |
| --------- | ----- | -------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------- | ------------------ |
| CDM-EP-01 | Epic  | 맞춤제작 테이블 정의 | `customization_requests` 구조, 상태 Enum | - 상태 값(requested→designing→prototyping→fitting→completed→cancelled)<br>- Technician ACL 정의<br>- API 스펙 초안 | CMS-EP-01 | 생성/상태변경 로그 |
| CDM-US-01 | Story | 제작 요청 API Stub   | POST/GET API, Validation                 | - 요청 본문 검증(Zod)<br>- 상태 기본값 requested<br>- 감사 로그(`custom_request_created`)                          | CDM-EP-01 | API 실행 로그      |

#### CDM 세부 작업 목록 (JIRA Sub-task 제안)

- CDM-EP-01
  - 상태 Enum 및 전이표 정의 + 문서화
  - Technician 역할 RLS 정책 작성
  - API 스펙 초안 작성 및 리뷰(디자인팀 공유)
- CDM-US-01
  - `POST /api/custom-requests` 및 `GET /api/custom-requests` Stub 구현
  - 요청 본문 Zod 검증 스키마 정의 + 테스트
  - 감사 로그(`custom_request_created`, `custom_request_listed`) 호출
  - Phase 2 UI 연계를 위한 Swagger/MD 문서화

### 3.4 EPIC INFRA: 공통 플랫폼 준비

| ID        | 유형  | 제목                | 상세 설명                          | 수용 기준 (AC)                                                                                                  | 의존성    | 로깅                  |
| --------- | ----- | ------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------- | --------------------- |
| INF-EP-01 | Epic  | 인증/권한 통합      | Clerk 조직, 역할 기반 보호         | - Clerk 조직 매핑 문서<br>- Protected route HOC 구현<br>- RLS 역할 매핑 표                                      | CMS-EP-01 | 로그인/로그아웃 로그  |
| INF-US-01 | Story | 감사 로그 인프라    | `audit_logs` 테이블 + helper       | - 테이블(schema: id, actor_id, action, metadata, created_at)<br>- `auditLogger` 유틸 구현<br>- Jest 단위 테스트 | INF-EP-01 | 모든 helper 호출 로그 |
| INF-US-02 | Story | 환경 변수 & CI 설정 | `.env.example`, Vercel secret 문서 | - 필수 키 정리(CLERK, SUPABASE, SENTRY, TOSS)<br>- CI lint/test 파이프라인 정의<br>- 보안 체크리스트 작성       | 없음      | CI 성공/실패 로그     |

#### INFRA 세부 작업 목록 (JIRA Sub-task 제안)

- INF-EP-01
  - Clerk 조직/역할 구조 기획서 작성 및 공유
  - Protected layout/HOC 구현 계획 수립 (`withAuth` 패턴)
  - Supabase RLS와 Clerk 역할 매핑 표 작성
- INF-US-01
  - `audit_logs` 테이블 DDL 작성 및 마이그레이션 스크립트 준비
  - `auditLogger` 유틸 (info/error) + Jest 테스트
  - 주요 API 라우트에 감사 로그 미들웨어 패턴 설계 문서화
- INF-US-02
  - `.env.example` 작성 및 보안 주석 추가
  - GitHub Actions/Husky 등 Lint/Test 파이프라인 정의 문서 작성
  - 보안 체크리스트(환경 변수, RLS, XSS 방지) 초안 작성

## 4. 작업 추적 및 보고

- 추적 도구: JIRA (프로젝트 코드 `ATCARE-MVP` 가정)
- Epic/Story ID: 위 표 ID를 JIRA Issue Key로 매핑 (예: `ATCARE-MVP-CMS-001`)
- 매 스프린트 종료 시:
  - 진행률 요약 (완료/진행/차단)
  - 발견 이슈 및 리스크 로그 업데이트

### 4.1 JIRA Import 템플릿 가이드

- `docs/jira-p0-backlog.csv` 파일을 사용해 Epic/Story/Sub-task를 일괄 등록합니다.
- CSV 열: `Issue Type,Key,Summary,Description,Acceptance Criteria,Dependencies,Logging`
- Import 후 각 스토리에 테스트 케이스(Link) 및 감사 로그 체크리스트를 첨부합니다.
- Sub-task는 `CMS-US-01 :: API 구현` 형식으로 생성하고 상위 스토리에 연결합니다.

## 5. 다음 단계

1. 이해관계자 승인 (PM, 개발 리더, 디자인 리더)
2. JIRA 프로젝트 생성 및 Issue 일괄 등록 (CSV Import Template 참고)
3. 스프린트 1 계획 수립 (우선순위: CMS-US-01, INF-US-01, INF-US-02)

---

_작성일: 2025-10-30_
