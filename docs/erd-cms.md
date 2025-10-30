# CMS (Client Case Management) ERD

사례관리 시스템의 데이터베이스 스키마 설계 문서입니다.

## 테이블 개요

### 1. clients (대상자)

대상자의 기본 정보를 저장하는 핵심 테이블입니다.

| 컬럼명             | 타입          | 제약조건                  | 설명                                  |
| ------------------ | ------------- | ------------------------- | ------------------------------------- |
| id                 | UUID          | PRIMARY KEY, DEFAULT uuid | 대상자 고유 ID                        |
| name               | TEXT          | NOT NULL                  | 이름 (필수)                           |
| birth_date         | DATE          | NULL                      | 생년월일                              |
| gender             | TEXT          | NULL                      | 성별 (male, female, other)            |
| disability_type    | TEXT          | NULL                      | 장애 유형                             |
| disability_grade   | TEXT          | NULL                      | 장애 등급                             |
| contact_phone      | TEXT          | NULL                      | 연락처 (전화번호)                     |
| contact_email      | TEXT          | NULL                      | 연락처 (이메일)                       |
| address            | TEXT          | NULL                      | 주소                                  |
| guardian_name      | TEXT          | NULL                      | 보호자 이름                           |
| guardian_phone     | TEXT          | NULL                      | 보호자 연락처                         |
| referral_source    | TEXT          | NULL                      | 의뢰 경로 (병원, 복지관, 자가 등)     |
| intake_date        | DATE          | DEFAULT CURRENT_DATE      | 접수일                                |
| status             | TEXT          | DEFAULT 'active'          | 상태 (active, inactive, discharged)   |
| notes              | TEXT          | NULL                      | 메모                                  |
| created_at         | TIMESTAMPTZ   | DEFAULT NOW()             | 생성 일시                             |
| updated_at         | TIMESTAMPTZ   | DEFAULT NOW()             | 수정 일시                             |
| created_by_user_id | TEXT          | NULL                      | 생성자 (Clerk User ID)                |
| updated_by_user_id | TEXT          | NULL                      | 최종 수정자 (Clerk User ID)           |

**인덱스:**
- `idx_clients_name`: name 컬럼 (검색 최적화)
- `idx_clients_status`: status 컬럼 (필터링 최적화)
- `idx_clients_intake_date`: intake_date 컬럼 DESC (최신순 정렬)

**비즈니스 규칙:**
- `name`은 필수 입력
- `status`는 active(활동중), inactive(비활동), discharged(종결) 중 하나
- `updated_at`은 자동 업데이트 (트리거 사용)

---

### 2. service_records (서비스 기록)

상담, 평가 등 서비스 제공 기록을 저장합니다.

| 컬럼명             | 타입          | 제약조건                  | 설명                                 |
| ------------------ | ------------- | ------------------------- | ------------------------------------ |
| id                 | UUID          | PRIMARY KEY, DEFAULT uuid | 서비스 기록 고유 ID                  |
| client_id          | UUID          | FOREIGN KEY → clients.id  | 대상자 ID                            |
| record_type        | TEXT          | NOT NULL                  | 기록 유형 (consultation, assessment) |
| record_date        | DATE          | NOT NULL, DEFAULT TODAY   | 서비스 제공일                        |
| title              | TEXT          | NOT NULL                  | 제목                                 |
| content            | TEXT          | NULL                      | 내용 (SOAP 형식 등)                  |
| attachments        | JSONB         | DEFAULT '[]'              | 첨부파일 URL 배열                    |
| created_at         | TIMESTAMPTZ   | DEFAULT NOW()             | 생성 일시                            |
| updated_at         | TIMESTAMPTZ   | DEFAULT NOW()             | 수정 일시                            |
| created_by_user_id | TEXT          | NULL                      | 작성자 (Clerk User ID)               |
| updated_by_user_id | TEXT          | NULL                      | 최종 수정자 (Clerk User ID)          |

**인덱스:**
- `idx_service_records_client_id`: client_id (JOIN 최적화)
- `idx_service_records_record_type`: record_type (필터링 최적화)
- `idx_service_records_record_date`: record_date DESC (최신순 정렬)

**외래키:**
- `client_id` REFERENCES `clients(id)` ON DELETE CASCADE

**비즈니스 규칙:**
- `record_type`은 consultation(상담), assessment(평가) 중 하나
- `client_id`가 삭제되면 관련 기록도 자동 삭제 (CASCADE)
- `attachments`는 Supabase Storage URL 배열 (JSONB 형식)

---

## ERD 다이어그램

```
┌─────────────────────────────────────────┐
│             clients                     │
├─────────────────────────────────────────┤
│ id (PK)                 UUID            │
│ name                    TEXT NOT NULL   │
│ birth_date              DATE            │
│ gender                  TEXT            │
│ disability_type         TEXT            │
│ disability_grade        TEXT            │
│ contact_phone           TEXT            │
│ contact_email           TEXT            │
│ address                 TEXT            │
│ guardian_name           TEXT            │
│ guardian_phone          TEXT            │
│ referral_source         TEXT            │
│ intake_date             DATE            │
│ status                  TEXT            │
│ notes                   TEXT            │
│ created_at              TIMESTAMPTZ     │
│ updated_at              TIMESTAMPTZ     │
│ created_by_user_id      TEXT            │
│ updated_by_user_id      TEXT            │
└────────────┬────────────────────────────┘
             │
             │ 1:N
             │
             ▼
┌─────────────────────────────────────────┐
│         service_records                 │
├─────────────────────────────────────────┤
│ id (PK)                 UUID            │
│ client_id (FK)          UUID NOT NULL   │
│ record_type             TEXT NOT NULL   │
│ record_date             DATE NOT NULL   │
│ title                   TEXT NOT NULL   │
│ content                 TEXT            │
│ attachments             JSONB           │
│ created_at              TIMESTAMPTZ     │
│ updated_at              TIMESTAMPTZ     │
│ created_by_user_id      TEXT            │
│ updated_by_user_id      TEXT            │
└─────────────────────────────────────────┘
```

---

## 역할별 접근 권한 매트릭스

| 역할          | clients 읽기 | clients 쓰기 | service_records 읽기 | service_records 쓰기 |
| ------------- | ------------ | ------------ | -------------------- | -------------------- |
| admin         | ✅           | ✅           | ✅                   | ✅                   |
| leader        | ✅           | ✅           | ✅                   | ✅                   |
| specialist    | ✅           | ✅           | ✅                   | ✅ (본인 작성만)     |
| socialWorker  | ✅           | ❌           | ✅                   | ❌                   |
| technician    | ❌           | ❌           | ❌                   | ❌                   |

**참고:**
- `technician`은 equipment 테이블만 접근 가능 (ERM 모듈)
- `service_records` 쓰기는 작성자 본인만 수정 가능 (RLS 정책)

---

## 마이그레이션 적용 순서

1. `20251030_create_audit_logs.sql` (감사 로그 테이블)
2. `20251031_create_clients.sql` (대상자 테이블)
3. `20251031_create_clients_rls.sql` (대상자 테이블 RLS 정책)
4. `20251031_create_service_records.sql` (서비스 기록 테이블 - Phase 2)

---

## 향후 확장 (Phase 2+)

- `assessments` 테이블: 평가 점수 및 체크리스트 분리
- `consultations` 테이블: 상담 기록 전용 테이블 분리
- `client_documents` 테이블: 파일 메타데이터 관리
- `client_goals` 테이블: 개인별 목표 설정 및 추적

---

_작성일: 2025-10-30_
_최종 수정: 2025-10-30_

