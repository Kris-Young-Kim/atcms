# 데이터베이스 스키마

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 데이터베이스 스키마 문서입니다. 이 문서는 모든 테이블의 구조, 관계, 인덱스, 비즈니스 규칙을 정의합니다.

**데이터베이스**: PostgreSQL (Supabase)  
**접근 제어**: 애플리케이션 레벨 (RLS 미사용)

---

## 📊 전체 테이블 목록

| 테이블명 | 모듈 | 설명 |
|---------|------|------|
| `audit_logs` | 공통 | 감사 로그 (모든 중요한 작업 기록) |
| `clients` | CMS | 대상자 기본 정보 |
| `service_records` | CMS | 서비스 기록 (상담, 평가) |
| `equipment` | ERM | 기기 재고 정보 |
| `rentals` | ERM | 대여 기록 |
| `maintenance_notes` | ERM | 유지보수 노트 |

---

## 🔗 테이블 관계 다이어그램

```
┌─────────────────┐
│  audit_logs     │  (공통 - 독립)
└─────────────────┘

┌─────────────────┐
│  clients        │  (CMS 모듈)
└────────┬─────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│ service_records │  (CMS 모듈)
└─────────────────┘

┌─────────────────┐
│  equipment      │  (ERM 모듈)
└────────┬─────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│ maintenance_    │  (ERM 모듈)
│ notes           │
└─────────────────┘

┌─────────────────┐      ┌─────────────────┐
│  clients        │◄─────┤  rentals        │
└─────────────────┘ N:1  └────────┬─────────┘
                                   │
                                   │ N:1
                                   │
                           ┌───────▼───────┐
                           │  equipment    │
                           └───────────────┘
```

---

## 1. 공통 테이블

### 1.1 audit_logs (감사 로그)

모든 중요한 작업을 기록하는 감사 로그 테이블입니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | UUID | PRIMARY KEY | 로그 고유 ID |
| `actor_id` | TEXT | NULL | 실행자 (Clerk User ID) |
| `action` | TEXT | NOT NULL | 작업 이름 (예: `client_created`) |
| `metadata` | JSONB | DEFAULT '{}' | 추가 컨텍스트 데이터 |
| `tags` | JSONB | DEFAULT '{}' | 분류 태그 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 생성 일시 |

**인덱스:**
- `idx_audit_logs_action`: action 컬럼
- `idx_audit_logs_created_at`: created_at DESC
- `idx_audit_logs_actor_id`: actor_id (WHERE actor_id IS NOT NULL)

**비즈니스 규칙:**
- 모든 CRUD 작업 및 상태 변경 시 기록
- `action`은 `모듈_작업_상태` 형식 (예: `client_created`, `equipment_status_updated`)

**마이그레이션:** `20251030_create_audit_logs.sql`

---

## 2. CMS 모듈 (사례관리)

### 2.1 clients (대상자)

대상자의 기본 정보를 저장하는 핵심 테이블입니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | UUID | PRIMARY KEY | 대상자 고유 ID |
| `name` | TEXT | NOT NULL | 이름 (필수) |
| `birth_date` | DATE | NULL | 생년월일 |
| `gender` | TEXT | CHECK | 성별 (male, female, other) |
| `disability_type` | TEXT | NULL | 장애 유형 |
| `disability_grade` | TEXT | NULL | 장애 등급 |
| `contact_phone` | TEXT | NULL | 연락처 (전화번호) |
| `contact_email` | TEXT | NULL | 연락처 (이메일) |
| `address` | TEXT | NULL | 주소 |
| `guardian_name` | TEXT | NULL | 보호자 이름 |
| `guardian_phone` | TEXT | NULL | 보호자 연락처 |
| `referral_source` | TEXT | NULL | 의뢰 경로 |
| `intake_date` | DATE | DEFAULT CURRENT_DATE | 접수일 |
| `status` | TEXT | DEFAULT 'active' | 상태 (active, inactive, discharged) |
| `notes` | TEXT | NULL | 메모 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 생성 일시 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 수정 일시 |
| `created_by_user_id` | TEXT | NULL | 생성자 (Clerk User ID) |
| `updated_by_user_id` | TEXT | NULL | 최종 수정자 |

**인덱스:**
- `idx_clients_name`: name 컬럼 (검색 최적화)
- `idx_clients_status`: status 컬럼 (필터링 최적화)
- `idx_clients_intake_date`: intake_date DESC (최신순 정렬)
- `idx_clients_created_at`: created_at DESC

**비즈니스 규칙:**
- `name`은 필수 입력
- `status`는 active(활동중), inactive(비활동), discharged(종결) 중 하나
- `updated_at`은 자동 업데이트 (트리거)

**마이그레이션:** `20251031_create_clients.sql`

### 2.2 service_records (서비스 기록)

상담, 평가 등 서비스 제공 기록을 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | UUID | PRIMARY KEY | 서비스 기록 고유 ID |
| `client_id` | UUID | FOREIGN KEY, NOT NULL | 대상자 ID |
| `record_type` | TEXT | NOT NULL, CHECK | 기록 유형 (consultation, assessment) |
| `record_date` | DATE | NOT NULL, DEFAULT TODAY | 서비스 제공일 |
| `title` | TEXT | NOT NULL | 제목 |
| `content` | TEXT | NULL | 내용 (SOAP 형식 등) |
| `attachments` | JSONB | DEFAULT '[]' | 첨부파일 URL 배열 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 생성 일시 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 수정 일시 |
| `created_by_user_id` | TEXT | NULL | 작성자 (Clerk User ID) |
| `updated_by_user_id` | TEXT | NULL | 최종 수정자 |

**인덱스:**
- `idx_service_records_client_id`: client_id (JOIN 최적화)
- `idx_service_records_record_type`: record_type (필터링 최적화)
- `idx_service_records_record_date`: record_date DESC
- `idx_service_records_created_at`: created_at DESC

**외래키:**
- `client_id` REFERENCES `clients(id)` ON DELETE CASCADE

**비즈니스 규칙:**
- `record_type`은 consultation(상담), assessment(평가) 중 하나
- `client_id`가 삭제되면 관련 기록도 자동 삭제 (CASCADE)
- `attachments`는 Supabase Storage URL 배열 (JSONB 형식)

**마이그레이션:** `20251101_create_service_records.sql`

---

## 3. ERM 모듈 (대여 기기 관리)

### 3.1 equipment (기기 재고)

대여 가능한 기기의 재고 정보를 저장하는 테이블입니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | UUID | PRIMARY KEY | 기기 고유 ID |
| `name` | TEXT | NOT NULL | 기기명 (필수) |
| `category` | TEXT | NULL | 카테고리 |
| `brand` | TEXT | NULL | 브랜드 |
| `model` | TEXT | NULL | 모델명 |
| `serial_number` | TEXT | UNIQUE | 시리얼 번호 (고유값) |
| `description` | TEXT | NULL | 설명 |
| `status` | TEXT | DEFAULT 'normal' | 상태 (normal, maintenance, retired) |
| `total_quantity` | INTEGER | DEFAULT 1, CHECK >= 0 | 전체 수량 |
| `available_quantity` | INTEGER | DEFAULT 0, CHECK >= 0 | 가용 수량 |
| `location` | TEXT | NULL | 보관 위치 |
| `purchase_date` | DATE | NULL | 구매일 |
| `purchase_price` | DECIMAL(10,2) | NULL | 구매 가격 |
| `warranty_expires` | DATE | NULL | 보증 만료일 |
| `notes` | TEXT | NULL | 메모 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 생성 일시 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 수정 일시 |
| `created_by_user_id` | TEXT | NULL | 생성자 |
| `updated_by_user_id` | TEXT | NULL | 최종 수정자 |

**인덱스:**
- `idx_equipment_name`: name 컬럼
- `idx_equipment_category`: category 컬럼
- `idx_equipment_status`: status 컬럼
- `idx_equipment_serial_number`: serial_number (WHERE serial_number IS NOT NULL)
- `idx_equipment_created_at`: created_at DESC

**비즈니스 규칙:**
- `name`은 필수 입력
- `status`는 normal(정상), maintenance(유지보수), retired(폐기) 중 하나
- `total_quantity`는 0 이상이어야 함
- `available_quantity`는 0 이상이고 `total_quantity` 이하여야 함
- `serial_number`는 고유값이어야 함 (NULL 허용)
- `updated_at`은 자동 업데이트 (트리거)

**마이그레이션:** `20251101_create_equipment.sql`

### 3.2 rentals (대여 기록)

기기 대여/반납 기록을 저장하는 테이블입니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | UUID | PRIMARY KEY | 대여 기록 고유 ID |
| `equipment_id` | UUID | FOREIGN KEY, NOT NULL | 기기 ID |
| `client_id` | UUID | FOREIGN KEY, NOT NULL | 대상자 ID |
| `rental_date` | DATE | NOT NULL, DEFAULT TODAY | 대여 시작일 |
| `expected_return_date` | DATE | NULL | 예상 반납일 |
| `actual_return_date` | DATE | NULL | 실제 반납일 |
| `status` | TEXT | DEFAULT 'active' | 상태 (active, returned, cancelled) |
| `quantity` | INTEGER | DEFAULT 1, CHECK > 0 | 대여 수량 |
| `contract_url` | TEXT | NULL | 계약서 PDF URL |
| `notes` | TEXT | NULL | 메모 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 생성 일시 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 수정 일시 |
| `created_by_user_id` | TEXT | NULL | 생성자 |
| `updated_by_user_id` | TEXT | NULL | 최종 수정자 |

**인덱스:**
- `idx_rentals_equipment_id`: equipment_id (JOIN 최적화)
- `idx_rentals_client_id`: client_id (JOIN 최적화)
- `idx_rentals_status`: status (필터링 최적화)
- `idx_rentals_rental_date`: rental_date DESC
- `idx_rentals_created_at`: created_at DESC

**외래키:**
- `equipment_id` REFERENCES `equipment(id)` ON DELETE RESTRICT
- `client_id` REFERENCES `clients(id)` ON DELETE RESTRICT

**트리거:**
- 대여 생성 시 `equipment.available_quantity` 자동 감소
- 반납 시 `equipment.available_quantity` 자동 증가

**비즈니스 규칙:**
- `status`는 active(대여중), returned(반납됨), cancelled(취소됨) 중 하나
- `quantity`는 1 이상이어야 함
- `actual_return_date`가 설정되면 `status`는 'returned'로 변경
- `equipment_id`가 삭제되면 관련 대여 기록은 삭제되지 않음 (RESTRICT)

**마이그레이션:** `20251101_create_rentals.sql`

### 3.3 maintenance_notes (유지보수 노트)

기기 유지보수 이력을 저장하는 테이블입니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | UUID | PRIMARY KEY | 노트 고유 ID |
| `equipment_id` | UUID | FOREIGN KEY, NOT NULL | 기기 ID |
| `note_date` | DATE | NOT NULL, DEFAULT TODAY | 노트 작성일 |
| `title` | TEXT | NOT NULL | 제목 |
| `content` | TEXT | NULL | 내용 |
| `maintenance_type` | TEXT | NULL | 유지보수 유형 |
| `cost` | DECIMAL(10,2) | NULL | 비용 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 생성 일시 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 수정 일시 |
| `created_by_user_id` | TEXT | NULL | 작성자 |
| `updated_by_user_id` | TEXT | NULL | 최종 수정자 |

**인덱스:**
- `idx_maintenance_notes_equipment_id`: equipment_id (JOIN 최적화)
- `idx_maintenance_notes_note_date`: note_date DESC
- `idx_maintenance_notes_created_at`: created_at DESC

**외래키:**
- `equipment_id` REFERENCES `equipment(id)` ON DELETE CASCADE

**비즈니스 규칙:**
- `title`은 필수 입력
- `equipment_id`가 삭제되면 관련 노트도 자동 삭제 (CASCADE)

**마이그레이션:** `20251101_create_maintenance_notes.sql`

---

## 📦 Storage (Supabase Storage)

### attachments 버킷

파일 첨부를 위한 Supabase Storage 버킷입니다.

**버킷명:** `attachments`

**설정:**
- Public bucket: true (또는 접근 정책 설정)
- File size limit: 10MB
- Allowed MIME types: `image/*`, `application/pdf`, `application/msword`, `application/vnd.*`, `text/plain`

**용도:**
- 상담 기록 첨부파일
- 평가 기록 첨부파일
- 계약서 PDF

**참고:** Storage 버킷은 SQL 마이그레이션으로 직접 생성할 수 없습니다. Supabase Dashboard에서 수동으로 생성해야 합니다.

**마이그레이션 가이드:** `20251101_create_storage_bucket.sql`

---

## 🔄 마이그레이션 적용 순서

마이그레이션은 다음 순서로 적용해야 합니다:

1. `20251030_create_audit_logs.sql` - 감사 로그 테이블
2. `20251031_create_clients.sql` - 대상자 테이블
3. `20251101_create_service_records.sql` - 서비스 기록 테이블
4. `20251101_create_equipment.sql` - 기기 재고 테이블
5. `20251101_create_rentals.sql` - 대여 기록 테이블
6. `20251101_create_maintenance_notes.sql` - 유지보수 노트 테이블

**Storage 버킷:**
- `20251101_create_storage_bucket.sql` (참고용, Supabase Dashboard에서 수동 생성)

---

## 🔐 접근 제어

**주의:** 이 프로젝트는 Supabase RLS를 사용하지 않습니다. 모든 접근 제어는 애플리케이션 레벨에서 처리합니다.

**접근 제어 방식:**
- Clerk 인증 (인증 확인)
- API Route 미들웨어 (역할 기반 권한 확인)
- 애플리케이션 레벨 검증

**역할별 권한:**
- 자세한 권한 매트릭스는 [CMS ERD](./docs/erd-cms.md) 및 [ERM ERD](./docs/erd-erm.md) 참고

---

## 📚 참고 문서

- [CMS ERD](./docs/erd-cms.md) - CMS 모듈 상세 ERD
- [ERM ERD](./docs/erd-erm.md) - ERM 모듈 상세 ERD
- [마이그레이션 가이드](./web/supabase/migrations/README.md) - 마이그레이션 적용 방법

---

## 🚀 향후 확장 계획

### Phase 2+ 예정 테이블

**CMS 모듈:**
- `assessments` 테이블: 평가 점수 및 체크리스트 분리
- `consultations` 테이블: 상담 기록 전용 테이블 분리
- `client_documents` 테이블: 파일 메타데이터 관리
- `client_goals` 테이블: 개인별 목표 설정 및 추적

**ERM 모듈:**
- `equipment_categories` 테이블: 카테고리 관리 분리
- `equipment_images` 테이블: 기기 이미지 메타데이터 관리
- `rental_history` 테이블: 대여 이력 아카이브
- `equipment_suppliers` 테이블: 공급업체 정보 관리

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

