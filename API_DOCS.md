# API 문서

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 RESTful API 문서입니다. 모든 API 엔드포인트는 Next.js App Router의 API Routes를 사용합니다.

**Base URL**: `/api`

**인증**: 모든 API는 Clerk 인증이 필요합니다 (특정 엔드포인트 제외).

---

## 🔐 인증 및 권한

### 인증 방식

- **Clerk**: HTTP 요청 헤더에 Clerk 세션 토큰 포함
- **자동 처리**: Next.js Middleware가 자동으로 인증 확인

### 역할 기반 접근 제어 (RBAC)

| 역할 | 설명 | 권한 레벨 |
|------|------|----------|
| `admin` | 관리자 | 전체 권한 |
| `leader` | 팀장 | 대부분의 권한 |
| `specialist` | 작업치료사 | CMS 모듈 권한 |
| `socialWorker` | 사회복지사 | CMS 조회 권한 |
| `technician` | 보조공학사 | ERM 모듈 권한 |

### 공통 응답 형식

#### 성공 응답

```json
{
  "id": "uuid",
  "field1": "value1",
  ...
}
```

#### 에러 응답

```json
{
  "error": "Error message",
  "details": {
    "field1": ["Error message 1", "Error message 2"]
  }
}
```

### HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| `200` | 성공 |
| `201` | 생성 성공 |
| `400` | 잘못된 요청 (검증 실패) |
| `401` | 인증 실패 |
| `403` | 권한 없음 |
| `404` | 리소스를 찾을 수 없음 |
| `500` | 서버 오류 |

---

## 📚 API 엔드포인트 목록

### CMS 모듈 (사례관리)

- [대상자 관리](#대상자-관리)
- [상담 기록](#상담-기록)
- [평가 기록](#평가-기록)

### ERM 모듈 (대여 기기 관리)

- [기기 관리](#기기-관리)
- [대여 관리](#대여-관리)

### 공통

- [대시보드](#대시보드)
- [파일 스토리지](#파일-스토리지)

---

## 대상자 관리

### GET /api/clients

대상자 목록 조회 (검색, 필터, 정렬, 페이지네이션 지원)

**권한**: `admin`, `leader`, `specialist`, `socialWorker`

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `search` | string | No | 검색어 (이름 또는 연락처) |
| `status` | string | No | 상태 필터 (`active`, `inactive`, `discharged`, `all`) |
| `page` | number | No | 페이지 번호 (기본값: 1) |
| `limit` | number | No | 페이지당 항목 수 (기본값: 25) |
| `sortBy` | string | No | 정렬 필드 (기본값: `created_at`) |
| `sortOrder` | string | No | 정렬 순서 (`asc`, `desc`, 기본값: `desc`) |

**응답 예시:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "홍길동",
      "status": "active",
      "contact_phone": "010-1234-5678",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "totalPages": 4
  }
}
```

---

### POST /api/clients

새 대상자 등록

**권한**: `admin`, `leader`, `specialist`

**요청 본문:**

```json
{
  "name": "홍길동",
  "birth_date": "1990-01-01",
  "gender": "male",
  "disability_type": "지체장애",
  "disability_grade": "1급",
  "contact_phone": "010-1234-5678",
  "contact_email": "hong@example.com",
  "address": "서울시 강남구",
  "guardian_name": "홍부인",
  "guardian_phone": "010-8765-4321",
  "referral_source": "병원",
  "intake_date": "2025-11-01",
  "status": "active",
  "notes": "메모"
}
```

**필수 필드**: `name`

**응답**: `201 Created`

---

### GET /api/clients/[id]

대상자 상세 조회

**권한**: `admin`, `leader`, `specialist`, `socialWorker`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |

**응답 예시:**

```json
{
  "id": "uuid",
  "name": "홍길동",
  "birth_date": "1990-01-01",
  "gender": "male",
  "status": "active",
  ...
}
```

---

### PUT /api/clients/[id]

대상자 정보 수정

**권한**: `admin`, `leader`, `specialist`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |

**요청 본문:** POST와 동일 (모든 필드 선택)

**응답**: 수정된 대상자 객체

---

### DELETE /api/clients/[id]

대상자 삭제 (Soft Delete - status를 `discharged`로 변경)

**권한**: `admin`, `leader`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |

**응답:**

```json
{
  "message": "Client deleted successfully",
  "data": { ... }
}
```

---

## 상담 기록

### GET /api/clients/[id]/consultations

대상자의 상담 기록 목록 조회

**권한**: `admin`, `leader`, `specialist`, `socialWorker`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |

**응답:**

```json
{
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "record_type": "consultation",
      "record_date": "2025-11-01",
      "title": "상담 제목",
      "content": "상담 내용",
      "attachments": [],
      ...
    }
  ]
}
```

---

### POST /api/clients/[id]/consultations

새 상담 기록 생성

**권한**: `admin`, `leader`, `specialist`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |

**요청 본문:**

```json
{
  "title": "상담 제목",
  "record_date": "2025-11-01",
  "content": "상담 내용",
  "subjective": "주관적 정보",
  "objective": "객관적 정보",
  "assessment": "평가",
  "plan": "계획",
  "attachments": ["url1", "url2"]
}
```

**필수 필드**: `title`

**응답**: `201 Created`

---

### GET /api/clients/[id]/consultations/[consultationId]

상담 기록 상세 조회

**권한**: `admin`, `leader`, `specialist`, `socialWorker`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |
| `consultationId` | UUID | 상담 기록 ID |

---

### PUT /api/clients/[id]/consultations/[consultationId]

상담 기록 수정

**권한**: `admin`, `leader`, `specialist` (본인 작성만 수정 가능)

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |
| `consultationId` | UUID | 상담 기록 ID |

**요청 본문:** POST와 동일

---

### DELETE /api/clients/[id]/consultations/[consultationId]

상담 기록 삭제

**권한**: `admin`, `leader`, `specialist` (본인 작성만 삭제 가능)

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |
| `consultationId` | UUID | 상담 기록 ID |

---

## 평가 기록

### GET /api/clients/[id]/assessments

대상자의 평가 기록 목록 조회

**권한**: `admin`, `leader`, `specialist`, `socialWorker`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |

**응답:**

```json
{
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "record_type": "assessment",
      "record_date": "2025-11-01",
      "title": "평가 제목",
      "content": "{\"assessment_type\": \"...\", \"items\": [...], \"total_score\": 85}",
      "attachments": [],
      ...
    }
  ]
}
```

---

### POST /api/clients/[id]/assessments

새 평가 기록 생성

**권한**: `admin`, `leader`, `specialist`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |

**요청 본문:**

```json
{
  "title": "평가 제목",
  "record_date": "2025-11-01",
  "assessment_type": "FIM",
  "items": [
    {
      "category": "자기관리",
      "score": 7,
      "note": "메모"
    }
  ],
  "total_score": 85,
  "summary": "평가 요약",
  "attachments": ["url1"],
  "pdf_attachment": "url"
}
```

**필수 필드**: `title`, `assessment_type`, `items`

**응답**: `201 Created`

---

### GET /api/clients/[id]/assessments/[assessmentId]

평가 기록 상세 조회

**권한**: `admin`, `leader`, `specialist`, `socialWorker`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |
| `assessmentId` | UUID | 평가 기록 ID |

---

### PUT /api/clients/[id]/assessments/[assessmentId]

평가 기록 수정

**권한**: `admin`, `leader`, `specialist` (본인 작성만 수정 가능)

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |
| `assessmentId` | UUID | 평가 기록 ID |

**요청 본문:** POST와 동일

---

### DELETE /api/clients/[id]/assessments/[assessmentId]

평가 기록 삭제

**권한**: `admin`, `leader`, `specialist` (본인 작성만 삭제 가능)

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대상자 ID |
| `assessmentId` | UUID | 평가 기록 ID |

---

## 기기 관리

### GET /api/equipment

기기 목록 조회

**권한**: `admin`, `leader`, `specialist`, `socialWorker`, `technician`

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `status` | string | No | 상태 필터 (`normal`, `maintenance`, `retired`) |
| `category` | string | No | 카테고리 필터 |
| `search` | string | No | 검색어 (기기명, 브랜드, 모델명) |

**응답:**

```json
[
  {
    "id": "uuid",
    "name": "휠체어",
    "category": "wheelchair",
    "status": "normal",
    "total_quantity": 10,
    "available_quantity": 5,
    ...
  }
]
```

---

### POST /api/equipment

새 기기 등록

**권한**: `admin`, `leader`, `technician`

**요청 본문:**

```json
{
  "name": "휠체어",
  "category": "wheelchair",
  "brand": "브랜드명",
  "model": "모델명",
  "serial_number": "SN123456",
  "description": "설명",
  "status": "normal",
  "total_quantity": 10,
  "available_quantity": 10,
  "location": "보관 위치",
  "purchase_date": "2025-01-01",
  "purchase_price": 500000,
  "warranty_expires": "2026-01-01",
  "notes": "메모"
}
```

**필수 필드**: `name`

**응답**: `201 Created`

---

### GET /api/equipment/[id]

기기 상세 조회

**권한**: `admin`, `leader`, `specialist`, `socialWorker`, `technician`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 기기 ID |

---

### PUT /api/equipment/[id]

기기 정보 수정

**권한**: `admin`, `leader`, `technician`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 기기 ID |

**요청 본문:** POST와 동일 (모든 필드 선택)

---

### DELETE /api/equipment/[id]

기기 삭제

**권한**: `admin`, `leader`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 기기 ID |

**제약조건**: 활성 대여 중인 기기는 삭제 불가

---

### PATCH /api/equipment/[id]/status

기기 상태 변경

**권한**: `admin`, `leader`, `technician`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 기기 ID |

**요청 본문:**

```json
{
  "status": "maintenance"
}
```

**가능한 상태**: `normal`, `maintenance`, `retired`

**제약조건**: 폐기된 기기는 복구 불가

---

### PATCH /api/equipment/[id]/quantity

기기 수량 조정

**권한**: `admin`, `leader`, `technician`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 기기 ID |

**요청 본문:**

```json
{
  "total_quantity": 10,
  "available_quantity": 5
}
```

**제약조건**: `available_quantity <= total_quantity - 대여 중인 수량`

---

### GET /api/equipment/[id]/maintenance-notes

기기별 유지보수 노트 목록 조회

**권한**: `admin`, `leader`, `specialist`, `socialWorker`, `technician`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 기기 ID |

**응답:**

```json
{
  "data": [
    {
      "id": "uuid",
      "equipment_id": "uuid",
      "note_date": "2025-11-01",
      "title": "유지보수 제목",
      "content": "내용",
      "maintenance_type": "repair",
      "cost": 50000,
      ...
    }
  ]
}
```

---

### POST /api/equipment/[id]/maintenance-notes

새 유지보수 노트 생성

**권한**: `admin`, `leader`, `technician`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 기기 ID |

**요청 본문:**

```json
{
  "title": "유지보수 제목",
  "note_date": "2025-11-01",
  "content": "내용",
  "maintenance_type": "repair",
  "cost": 50000
}
```

**필수 필드**: `title`

**응답**: `201 Created`

---

## 대여 관리

### GET /api/rentals

대여 목록 조회

**권한**: `admin`, `leader`, `specialist`, `socialWorker`, `technician`

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `status` | string | No | 상태 필터 (`active`, `returned`, `cancelled`) |
| `equipment_id` | UUID | No | 기기 ID 필터 |
| `client_id` | UUID | No | 대상자 ID 필터 |

**응답:**

```json
[
  {
    "id": "uuid",
    "equipment_id": "uuid",
    "client_id": "uuid",
    "rental_date": "2025-11-01",
    "status": "active",
    "quantity": 1,
    "equipment": {
      "id": "uuid",
      "name": "휠체어",
      "category": "wheelchair"
    },
    "client": {
      "id": "uuid",
      "name": "홍길동"
    },
    ...
  }
]
```

---

### POST /api/rentals

새 대여 기록 생성

**권한**: `admin`, `leader`, `technician`

**요청 본문:**

```json
{
  "equipment_id": "uuid",
  "client_id": "uuid",
  "rental_date": "2025-11-01",
  "expected_return_date": "2025-12-01",
  "quantity": 1,
  "contract_url": "url",
  "notes": "메모"
}
```

**필수 필드**: `equipment_id`, `client_id`, `rental_date`

**제약조건**: 가용 수량 확인 (`available_quantity >= quantity`)

**응답**: `201 Created`

**자동 처리**: 대여 생성 시 `equipment.available_quantity` 자동 감소 (트리거)

---

### GET /api/rentals/[id]

대여 상세 조회

**권한**: `admin`, `leader`, `specialist`, `socialWorker`, `technician`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대여 ID |

**응답:** 기기 및 대상자 정보 포함

---

### PATCH /api/rentals/[id]/return

대여 반납 처리

**권한**: `admin`, `leader`, `technician`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | UUID | 대여 ID |

**요청 본문:**

```json
{
  "actual_return_date": "2025-11-15",
  "notes": "반납 메모"
}
```

**응답:** 반납 처리된 대여 객체

**자동 처리**: 반납 시 `equipment.available_quantity` 자동 증가 (트리거)

---

## 대시보드

### GET /api/dashboard/stats

대시보드 통계 데이터 조회

**권한**: 모든 인증된 사용자

**응답:**

```json
{
  "stats": {
    "totalClients": 100,
    "activeClients": 80,
    "newThisMonth": 10,
    "pendingConsultations": 0
  },
  "recentClients": [
    {
      "id": "uuid",
      "name": "홍길동",
      "intake_date": "2025-11-01",
      "status": "active"
    }
  ]
}
```

---

## 파일 스토리지

### POST /api/storage/upload

파일 업로드

**권한**: 모든 인증된 사용자

**요청 형식**: `multipart/form-data`

**Form Data:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `file` | File | Yes | 업로드할 파일 |

**제약조건:**
- 최대 파일 크기: 10MB
- 허용 파일 타입: `image/*`, `application/pdf`, `application/msword`, `application/vnd.*`, `text/plain`

**응답:**

```json
{
  "success": true,
  "url": "https://...",
  "path": "images/userId/timestamp_random_filename.jpg",
  "fileName": "original_filename.jpg",
  "fileSize": 1024,
  "fileType": "image/jpeg"
}
```

---

### DELETE /api/storage/upload

파일 삭제

**권한**: 모든 인증된 사용자 (본인 파일만)

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `path` | string | Yes | 파일 경로 |

**응답:**

```json
{
  "success": true,
  "message": "파일이 삭제되었습니다."
}
```

---

## 📝 참고사항

### 날짜 형식

모든 날짜는 ISO 8601 형식을 사용합니다: `YYYY-MM-DD`

예: `2025-11-01`

### UUID 형식

모든 ID는 UUID v4 형식입니다.

예: `550e8400-e29b-41d4-a716-446655440000`

### 페이지네이션

페이지네이션을 지원하는 API는 다음 형식을 사용합니다:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "totalPages": 4
  }
}
```

### 에러 처리

모든 API는 표준 HTTP 상태 코드를 사용하며, 에러 응답에는 다음 형식을 따릅니다:

```json
{
  "error": "Error message",
  "details": {
    "field1": ["Error message 1", "Error message 2"]
  }
}
```

### 감사 로깅

모든 중요한 작업은 자동으로 감사 로그에 기록됩니다:
- CRUD 작업
- 상태 변경
- 권한 위반 시도

---

## 🔗 관련 문서

- [시스템 아키텍처](./ARCHITECTURE.md)
- [데이터베이스 스키마](./DATABASE_SCHEMA.md)
- [개발 가이드](./DEVELOPMENT.md)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

