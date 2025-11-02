# ERM (Equipment Rental Management) ERD

대여 기기 관리 시스템의 데이터베이스 스키마 설계 문서입니다.

## 테이블 개요

### 1. equipment (기기 재고)

대여 가능한 기기의 재고 정보를 저장하는 테이블입니다.

| 컬럼명             | 타입          | 제약조건                  | 설명                                  |
| ------------------ | ------------- | ------------------------- | ------------------------------------- |
| id                 | UUID          | PRIMARY KEY, DEFAULT uuid | 기기 고유 ID                          |
| name               | TEXT          | NOT NULL                  | 기기명 (필수)                         |
| category           | TEXT          | NULL                      | 카테고리 (wheelchair, hearing_aid, communication_aid 등) |
| brand              | TEXT          | NULL                      | 브랜드                                |
| model              | TEXT          | NULL                      | 모델명                                |
| serial_number      | TEXT          | NULL                      | 시리얼 번호 (고유값)                  |
| description        | TEXT          | NULL                      | 설명                                  |
| status             | TEXT          | DEFAULT 'normal'           | 상태 (normal, maintenance, retired)   |
| total_quantity     | INTEGER       | DEFAULT 1                 | 전체 수량                              |
| available_quantity | INTEGER       | DEFAULT 0                 | 가용 수량 (대여 가능한 수량)           |
| location           | TEXT          | NULL                      | 보관 위치                             |
| purchase_date      | DATE          | NULL                      | 구매일                                |
| purchase_price     | DECIMAL(10,2) | NULL                      | 구매 가격                             |
| warranty_expires   | DATE          | NULL                      | 보증 만료일                            |
| notes              | TEXT          | NULL                      | 메모                                  |
| created_at         | TIMESTAMPTZ   | DEFAULT NOW()             | 생성 일시                             |
| updated_at         | TIMESTAMPTZ   | DEFAULT NOW()             | 수정 일시                             |
| created_by_user_id | TEXT          | NULL                      | 생성자 (Clerk User ID)                |
| updated_by_user_id | TEXT          | NULL                      | 최종 수정자 (Clerk User ID)           |

**인덱스:**
- `idx_equipment_name`: name 컬럼 (검색 최적화)
- `idx_equipment_category`: category 컬럼 (필터링 최적화)
- `idx_equipment_status`: status 컬럼 (필터링 최적화)
- `idx_equipment_serial_number`: serial_number 컬럼 (고유값 검색)

**비즈니스 규칙:**
- `name`은 필수 입력
- `status`는 normal(정상), maintenance(유지보수), retired(폐기) 중 하나
- `total_quantity`는 0 이상이어야 함
- `available_quantity`는 0 이상이고 `total_quantity` 이하여야 함
- `serial_number`는 고유값이어야 함 (NULL 허용)
- `updated_at`은 자동 업데이트 (트리거 사용)

---

### 2. rentals (대여 기록)

기기 대여/반납 기록을 저장하는 테이블입니다.

| 컬럼명             | 타입          | 제약조건                  | 설명                                  |
| ------------------ | ------------- | ------------------------- | ------------------------------------- |
| id                 | UUID          | PRIMARY KEY, DEFAULT uuid | 대여 기록 고유 ID                     |
| equipment_id       | UUID          | FOREIGN KEY → equipment.id | 기기 ID                               |
| client_id          | UUID          | FOREIGN KEY → clients.id  | 대상자 ID                             |
| rental_date        | DATE          | NOT NULL, DEFAULT TODAY   | 대여 시작일                           |
| expected_return_date | DATE       | NULL                      | 예상 반납일                           |
| actual_return_date | DATE          | NULL                      | 실제 반납일                           |
| status             | TEXT          | DEFAULT 'active'          | 상태 (active, returned, cancelled)    |
| quantity           | INTEGER       | DEFAULT 1                 | 대여 수량                              |
| contract_url       | TEXT          | NULL                      | 계약서 PDF URL (Supabase Storage)    |
| notes              | TEXT          | NULL                      | 메모                                  |
| created_at         | TIMESTAMPTZ   | DEFAULT NOW()             | 생성 일시                             |
| updated_at         | TIMESTAMPTZ   | DEFAULT NOW()             | 수정 일시                             |
| created_by_user_id | TEXT          | NULL                      | 생성자 (Clerk User ID)                |
| updated_by_user_id | TEXT          | NULL                      | 최종 수정자 (Clerk User ID)           |

**인덱스:**
- `idx_rentals_equipment_id`: equipment_id (JOIN 최적화)
- `idx_rentals_client_id`: client_id (JOIN 최적화)
- `idx_rentals_status`: status (필터링 최적화)
- `idx_rentals_rental_date`: rental_date DESC (최신순 정렬)

**외래키:**
- `equipment_id` REFERENCES `equipment(id)` ON DELETE RESTRICT
- `client_id` REFERENCES `clients(id)` ON DELETE RESTRICT

**비즈니스 규칙:**
- `status`는 active(대여중), returned(반납됨), cancelled(취소됨) 중 하나
- `quantity`는 1 이상이어야 함
- `actual_return_date`가 설정되면 `status`는 'returned'로 변경
- `equipment_id`가 삭제되면 관련 대여 기록은 삭제되지 않음 (RESTRICT)
- 대여 생성 시 `equipment.available_quantity` 자동 감소
- 반납 시 `equipment.available_quantity` 자동 증가

---

### 3. maintenance_notes (유지보수 노트)

기기 유지보수 이력을 저장하는 테이블입니다.

| 컬럼명             | 타입          | 제약조건                  | 설명                                  |
| ------------------ | ------------- | ------------------------- | ------------------------------------- |
| id                 | UUID          | PRIMARY KEY, DEFAULT uuid | 노트 고유 ID                          |
| equipment_id       | UUID          | FOREIGN KEY → equipment.id | 기기 ID                               |
| note_date          | DATE          | NOT NULL, DEFAULT TODAY  | 노트 작성일                           |
| title              | TEXT          | NOT NULL                  | 제목                                 |
| content            | TEXT          | NULL                      | 내용                                  |
| maintenance_type   | TEXT          | NULL                      | 유지보수 유형 (repair, inspection, cleaning 등) |
| cost               | DECIMAL(10,2) | NULL                      | 비용                                  |
| created_at         | TIMESTAMPTZ   | DEFAULT NOW()             | 생성 일시                             |
| updated_at         | TIMESTAMPTZ   | DEFAULT NOW()             | 수정 일시                             |
| created_by_user_id | TEXT          | NULL                      | 작성자 (Clerk User ID)               |
| updated_by_user_id | TEXT          | NULL                      | 최종 수정자 (Clerk User ID)           |

**인덱스:**
- `idx_maintenance_notes_equipment_id`: equipment_id (JOIN 최적화)
- `idx_maintenance_notes_note_date`: note_date DESC (최신순 정렬)

**외래키:**
- `equipment_id` REFERENCES `equipment(id)` ON DELETE CASCADE

**비즈니스 규칙:**
- `title`은 필수 입력
- `equipment_id`가 삭제되면 관련 노트도 자동 삭제 (CASCADE)

---

## ERD 다이어그램

```
┌─────────────────────────────────────────┐
│             clients                     │
│ (CMS 모듈)                              │
└────────────┬────────────────────────────┘
             │
             │ 1:N
             │
             ▼
┌─────────────────────────────────────────┐
│             rentals                     │
├─────────────────────────────────────────┤
│ id (PK)                 UUID            │
│ equipment_id (FK)       UUID NOT NULL   │
│ client_id (FK)          UUID NOT NULL   │
│ rental_date             DATE            │
│ expected_return_date     DATE            │
│ actual_return_date      DATE            │
│ status                  TEXT            │
│ quantity                INTEGER         │
│ contract_url            TEXT            │
│ notes                   TEXT            │
│ created_at              TIMESTAMPTZ     │
│ updated_at              TIMESTAMPTZ     │
└────────────┬────────────────────────────┘
             │
             │ N:1
             │
             ▼
┌─────────────────────────────────────────┐
│             equipment                  │
├─────────────────────────────────────────┤
│ id (PK)                 UUID            │
│ name                    TEXT NOT NULL   │
│ category                TEXT            │
│ brand                   TEXT            │
│ model                   TEXT            │
│ serial_number           TEXT            │
│ status                  TEXT            │
│ total_quantity          INTEGER         │
│ available_quantity      INTEGER         │
│ location                TEXT            │
│ purchase_date           DATE            │
│ purchase_price          DECIMAL(10,2)   │
│ warranty_expires        DATE            │
│ notes                   TEXT            │
│ created_at              TIMESTAMPTZ     │
│ updated_at              TIMESTAMPTZ     │
└────────────┬────────────────────────────┘
             │
             │ 1:N
             │
             ▼
┌─────────────────────────────────────────┐
│         maintenance_notes              │
├─────────────────────────────────────────┤
│ id (PK)                 UUID            │
│ equipment_id (FK)       UUID NOT NULL   │
│ note_date               DATE            │
│ title                   TEXT NOT NULL   │
│ content                 TEXT            │
│ maintenance_type        TEXT            │
│ cost                    DECIMAL(10,2)   │
│ created_at              TIMESTAMPTZ     │
│ updated_at              TIMESTAMPTZ     │
└─────────────────────────────────────────┘
```

---

## 기기 상태 전이 다이어그램

```
normal (정상)
    │
    ├─→ maintenance (유지보수) ─→ normal (정상)
    │         │
    │         └─→ retired (폐기)
    │
    └─→ retired (폐기)
```

**상태 전이 규칙:**
- `normal` → `maintenance`: 유지보수 시작
- `maintenance` → `normal`: 유지보수 완료
- `maintenance` → `retired`: 기기 폐기
- `normal` → `retired`: 기기 폐기
- `retired` → 다른 상태: 불가능 (폐기된 기기는 복구 불가)

---

## 역할별 접근 권한 매트릭스

| 역할          | equipment 읽기 | equipment 쓰기 | rentals 읽기 | rentals 쓰기 | maintenance_notes 읽기 | maintenance_notes 쓰기 |
| ------------- | -------------- | -------------- | ------------ | ------------ | ---------------------- | ---------------------- |
| admin         | ✅             | ✅             | ✅           | ✅           | ✅                     | ✅                     |
| leader        | ✅             | ✅             | ✅           | ✅           | ✅                     | ✅                     |
| specialist    | ✅             | ❌             | ✅           | ❌           | ✅                     | ❌                     |
| socialWorker  | ✅             | ❌             | ✅           | ❌           | ✅                     | ❌                     |
| technician    | ✅             | ✅             | ✅           | ✅           | ✅                     | ✅                     |

**참고:**
- `technician`은 ERM 모듈의 핵심 역할 (equipment, rentals, maintenance_notes 모두 접근 가능)
- `specialist`, `socialWorker`는 조회만 가능
- `admin`, `leader`는 모든 작업 가능

---

## 마이그레이션 적용 순서

1. `20251030_create_audit_logs.sql` (감사 로그 테이블)
2. `20251031_create_clients.sql` (대상자 테이블)
3. `20251101_create_service_records.sql` (서비스 기록 테이블)
4. `20251101_create_equipment.sql` (기기 재고 테이블) ← **다음**
5. `20251101_create_rentals.sql` (대여 기록 테이블) ← **다음**
6. `20251101_create_maintenance_notes.sql` (유지보수 노트 테이블) ← **다음**

---

## 향후 확장 (Phase 2+)

- `equipment_categories` 테이블: 카테고리 관리 분리
- `equipment_images` 테이블: 기기 이미지 메타데이터 관리
- `rental_history` 테이블: 대여 이력 아카이브
- `equipment_suppliers` 테이블: 공급업체 정보 관리

---

_작성일: 2025-11-01_  
_최종 수정: 2025-11-01_

