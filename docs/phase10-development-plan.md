# Phase 10: 맞춤제작 관리 및 통합 대상자 관리 개발 계획

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-02  
**버전**: 1.0

---

## 📋 개요

Phase 10은 맞춤제작 관리 기능을 추가하고, 상담 기록, 평가 기록, 대여 기록, 맞춤제작 요청, 일정을 통합적으로 관리할 수 있는 대상자 관리 시스템을 구축하는 단계입니다. 하나의 대상자에 대한 모든 활동을 한 곳에서 확인하고 관리할 수 있도록 통합 대시보드를 제공합니다.

---

## 🎯 목표

1. **맞춤제작 관리 기능 구축**
   - 맞춤제작 요청이 기존 대상자(`clients`)에 연결되도록 설계
   - 맞춤제작 단계별 추적 기능 제공
   - 맞춤제작 관련 UI 구현

2. **통합 대상자 관리 시스템 구축**
   - 대상자별 모든 활동 통합 조회 (상담/평가/대여/맞춤제작/일정)
   - 통합 활동 타임라인 뷰 제공
   - 통합 검색 및 필터 기능
   - 대상자 목록 페이지 개선

3. **일정 관리 기능 구축**
   - 상담/평가/대여/맞춤제작 일정 관리
   - 통합 캘린더 뷰 제공
   - 일정 알림 기능

---

## 📊 현재 상태

### 진행률

- **진행률**: 0/47 (0%)
- **완료된 작업**: 0개
- **미완료 작업**: 47개

### 주요 작업 영역

1. **맞춤제작 관리** (15개 작업)
   - 데이터 모델 설계 (3개)
   - API 구현 (9개)
   - UI 구현 (3개)

2. **통합 대상자 관리** (16개 작업)
   - 통합 활동 조회 API (2개)
   - 통합 뷰 UI (2개)
   - 통합 검색 및 필터 (2개)
   - 대상자 목록 개선 (2개)

3. **일정 관리** (16개 작업)
   - 데이터 모델 설계 (3개)
   - 일정 관리 API (6개)
   - 캘린더 UI (4개)
   - 알림 기능 (1개)

---

## 📝 단계별 개발 계획

### Step 1: 맞춤제작 데이터 모델 설계 및 마이그레이션

**우선순위**: 높음 (P1)  
**예상 소요 시간**: 5-6일  
**담당자**: 개발 리더 + 개발자2

**작업 내용**:
1. 맞춤제작 요청 테이블 설계
   - `customization_requests` 테이블 스키마 설계
   - `client_id` 외래키로 기존 대상자와 연결
   - 맞춤제작 특화 필드 정의
     - 치수 정보 (높이, 너비, 깊이 등)
     - 재료 정보
     - 특수 요구사항
     - 제작 목적
   - ERD 다이어그램 작성 및 문서화

2. 맞춤제작 단계 상태 Enum 정의
   - 상태 값: requested → designing → prototyping → fitting → completed → cancelled
   - 상태 전이 규칙 정의 및 문서화
   - 역할별 상태 변경 권한 매트릭스 정의
   - 상태별 필수 작업 정의

3. 맞춤제작 단계 추적 테이블 설계
   - `customization_stages` 테이블 설계
   - 단계별 메타데이터 저장 구조 설계
   - 파일 첨부 기능 (설계도, 사진 등)

4. 데이터베이스 마이그레이션 작성
   - `customization_requests` 테이블 생성 마이그레이션
   - `customization_stages` 테이블 생성 마이그레이션
   - 인덱스 및 외래키 설정
   - 마이그레이션 테스트

**예상 파일**:
- `web/supabase/migrations/YYYYMMDD_create_customization_requests.sql` (신규)
- `web/supabase/migrations/YYYYMMDD_create_customization_stages.sql` (신규)
- `docs/erd-cdm.md` (신규 - 맞춤제작 ERD 문서)
- `docs/customization-workflow.md` (신규 - 맞춤제작 워크플로우 문서)

**의존성**:
- CMS-EP-01 (clients 테이블 존재)

**기대 효과**:
- 맞춤제작 요청의 체계적 관리
- 기존 대상자와의 연결을 통한 통합 관리 가능
- 단계별 추적을 통한 진행 상황 가시화

---

### Step 2: 맞춤제작 API 구현

**우선순위**: 높음 (P1)  
**예상 소요 시간**: 10-12일  
**담당자**: 개발자2

**작업 내용**:
1. 맞춤제작 요청 등록 API
   - POST /api/customization-requests 엔드포인트 구현
   - `client_id` 필수 검증 (기존 대상자에 연결)
   - Zod 검증 스키마 작성
   - 역할 권한 검증 (specialist, technician만 가능)
   - 감사 로그 구현 (`customization_request_created`)
   - 단위 테스트 작성 (커버리지 70% 이상)

2. 맞춤제작 요청 조회 API
   - GET /api/customization-requests 엔드포인트 구현
   - 목록 조회 (페이지네이션, 필터링)
   - 대상자별 조회 GET /api/clients/[id]/customizations
   - 상세 조회 GET /api/customization-requests/[id]
   - 검색 기능 (대상자 이름, 상태, 단계별)
   - 감사 로그 구현 (`customization_request_listed`)

3. 맞춤제작 요청 수정 API
   - PUT /api/customization-requests/[id] 엔드포인트 구현
   - 부분 업데이트 지원 (PATCH)
   - 역할 권한 검증 (작성자 또는 admin/leader만 수정 가능)
   - 감사 로그 구현 (`customization_request_updated`)
   - 단위 테스트 작성

4. 맞춤제작 단계 변경 API
   - PATCH /api/customization-requests/[id]/stage 엔드포인트 구현
   - 상태 전이 검증 로직 구현
   - 역할별 상태 변경 권한 검증
   - 감사 로그 구현 (`customization_stage_updated`)
   - 단위 테스트 작성

5. 맞춤제작 단계 히스토리 조회 API
   - GET /api/customization-requests/[id]/stages 엔드포인트 구현
   - 타임라인 형태로 단계별 이력 조회
   - 각 단계별 메타데이터 및 파일 조회

**예상 파일**:
- `web/src/app/api/customization-requests/route.ts` (신규)
- `web/src/app/api/customization-requests/[id]/route.ts` (신규)
- `web/src/app/api/customization-requests/[id]/stage/route.ts` (신규)
- `web/src/app/api/customization-requests/[id]/stages/route.ts` (신규)
- `web/src/app/api/clients/[id]/customizations/route.ts` (신규)
- `web/src/lib/validations/customization.ts` (신규 - Zod 스키마)
- `web/src/app/api/customization-requests/__tests__/route.test.ts` (신규)
- `web/src/app/api/customization-requests/[id]/__tests__/route.test.ts` (신규)

**의존성**:
- Step 1 완료 (데이터 모델 및 마이그레이션)

**기대 효과**:
- 맞춤제작 요청의 체계적 관리
- API를 통한 맞춤제작 데이터 접근
- 감사 로그를 통한 추적 가능성

---

### Step 3: 맞춤제작 UI 구현

**우선순위**: 높음 (P1)  
**예상 소요 시간**: 10-12일  
**담당자**: 개발자1

**작업 내용**:
1. 맞춤제작 요청 등록 폼 UI
   - React Hook Form + Zod 검증 통합
   - 대상자 선택 컴포넌트 (기존 대상자 검색 및 선택)
   - 치수 입력 필드 (높이, 너비, 깊이 등)
   - 재료 선택 컴포넌트
   - 특수 요구사항 텍스트 영역
   - 파일 업로드 기능 (설계도, 참고 이미지)
   - 성공/실패 토스트 알림

2. 맞춤제작 요청 목록 페이지
   - 목록 테이블 컴포넌트 (대상자 이름, 상태, 단계 표시)
   - 검색 및 필터 기능 (대상자 이름, 상태별, 단계별)
   - 페이지네이션 구현
   - 접근성 준수 (ARIA 라벨, 키보드 네비게이션)

3. 맞춤제작 요청 상세 페이지
   - 기본 정보 탭 (대상자 정보 링크 포함)
   - 단계 추적 탭 (타임라인 형태)
   - 파일 첨부 목록 표시
   - 단계 변경 버튼 (권한에 따라 표시)
   - 수정 기능 (권한 검증)

**예상 파일**:
- `web/src/app/(dashboard)/customizations/page.tsx` (신규 - 목록 페이지)
- `web/src/app/(dashboard)/customizations/new/page.tsx` (신규 - 등록 페이지)
- `web/src/app/(dashboard)/customizations/[id]/page.tsx` (신규 - 상세 페이지)
- `web/src/components/customizations/CustomizationForm.tsx` (신규)
- `web/src/components/customizations/CustomizationList.tsx` (신규)
- `web/src/components/customizations/CustomizationTimeline.tsx` (신규)
- `web/src/components/customizations/CustomizationStageSelector.tsx` (신규)

**의존성**:
- Step 2 완료 (API 구현)

**기대 효과**:
- 사용자 친화적인 맞춤제작 관리 인터페이스
- 맞춤제작 진행 상황 가시화
- 효율적인 맞춤제작 요청 처리

---

### Step 4: 통합 대상자 활동 조회 API 구현

**우선순위**: 높음 (P1)  
**예상 소요 시간**: 5-6일  
**담당자**: 개발자2

**작업 내용**:
1. 대상자 활동 통합 조회 API
   - GET /api/clients/[id]/activities 엔드포인트 구현
   - 상담 기록 조회 (service_records WHERE record_type = 'consultation')
   - 평가 기록 조회 (service_records WHERE record_type = 'assessment')
   - 대여 기록 조회 (rentals)
   - 맞춤제작 요청 조회 (customization_requests)
   - 일정 조회 (schedules WHERE client_id)
   - 날짜순 통합 정렬 (최신순)
   - 활동 유형별 필터링 지원
   - 감사 로그 구현 (`client_activities_listed`)

2. 대상자 통합 통계 API
   - GET /api/clients/[id]/stats 엔드포인트 구현
   - 상담 횟수 통계
   - 평가 횟수 통계
   - 진행 중인 대여 수
   - 진행 중인 맞춤제작 요청 수
   - 다음 예정 일정 정보
   - 감사 로그 구현 (`client_stats_listed`)

**예상 파일**:
- `web/src/app/api/clients/[id]/activities/route.ts` (신규)
- `web/src/app/api/clients/[id]/stats/route.ts` (신규)
- `web/src/lib/types/activity.ts` (신규 - 활동 타입 정의)

**의존성**:
- CMS-EP-01 (clients, service_records 테이블)
- ERM-EP-01 (rentals 테이블)
- Step 1 완료 (customization_requests 테이블)
- Step 6 완료 (schedules 테이블)

**기대 효과**:
- 대상자별 모든 활동을 한 번의 API 호출로 조회 가능
- 통합 통계를 통한 대상자 현황 파악

---

### Step 5: 통합 대상자 관리 UI 구현

**우선순위**: 높음 (P1)  
**예상 소요 시간**: 12-15일  
**담당자**: 개발자1

**작업 내용**:
1. 대상자 상세 페이지 통합 활동 탭
   - 통합 활동 타임라인 컴포넌트 생성
   - 활동 유형별 아이콘 및 색상 구분
     - 상담: 파란색, 💬 아이콘
     - 평가: 보라색, 📋 아이콘
     - 대여: 초록색, 📦 아이콘
     - 맞춤제작: 주황색, 🔧 아이콘
     - 일정: 노란색, 📅 아이콘
   - 날짜순 통합 타임라인 표시
   - 각 활동 클릭 시 상세 정보 모달
   - 활동 유형별 필터 버튼
   - 빠른 추가 버튼 (상담/평가/대여/맞춤제작/일정)
   - 접근성 준수 (ARIA 라벨, 키보드 네비게이션)

2. 대상자 통합 대시보드 위젯
   - 요약 통계 카드 컴포넌트 (상담/평가/대여/맞춤제작 수)
   - 진행 중인 작업 목록 위젯
   - 최근 활동 목록 위젯 (최근 5개)
   - 다음 예정 일정 위젯
   - 빠른 액션 버튼 그룹

3. 대상자 목록 페이지 개선
   - 목록 테이블에 활동 통계 컬럼 추가
     - 상담 수
     - 평가 수
     - 진행 중인 대여 수
     - 진행 중인 맞춤제작 수
   - 활동 요약 툴팁 (호버 시 상세 정보)
   - 활동 통계 클릭 시 해당 유형 필터링된 대상자 상세 페이지로 이동
   - 활동 유형별 필터 (상담 있음, 평가 있음, 대여 있음 등)
   - 활동 횟수 범위 필터
   - 최근 활동 날짜 필터

**예상 파일**:
- `web/src/components/clients/ActivityTimeline.tsx` (신규)
- `web/src/components/clients/ActivityCard.tsx` (신규)
- `web/src/components/clients/ActivityFilter.tsx` (신규)
- `web/src/components/clients/ClientStatsWidget.tsx` (신규)
- `web/src/components/clients/QuickActionButtons.tsx` (신규)
- `web/src/app/(dashboard)/clients/[id]/activities/page.tsx` (신규 또는 기존 페이지 수정)

**의존성**:
- Step 4 완료 (통합 활동 조회 API)

**기대 효과**:
- 대상자별 모든 활동을 한 화면에서 확인 가능
- 효율적인 대상자 관리
- 사용자 경험 개선

---

### Step 6: 통합 검색 기능 구현

**우선순위**: 중간 (P2)  
**예상 소요 시간**: 6-7일  
**담당자**: 개발자2 + 개발자1

**작업 내용**:
1. 통합 검색 API 구현
   - GET /api/search/activities 엔드포인트 구현
   - 대상자 이름으로 모든 활동 검색
   - 활동 유형별 검색 (상담/평가/대여/맞춤제작/일정)
   - 날짜 범위 검색
   - 담당자별 검색
   - 통합 검색 결과 정렬 및 페이지네이션
   - 감사 로그 구현 (`activities_searched`)

2. 통합 검색 UI 구현
   - 통합 검색 바 컴포넌트
   - 검색 결과 페이지 (활동 유형별 그룹화)
   - 검색 필터 컴포넌트 (활동 유형, 날짜 범위, 담당자)
   - 검색 결과 클릭 시 해당 대상자 상세 페이지로 이동
   - 접근성 준수

**예상 파일**:
- `web/src/app/api/search/activities/route.ts` (신규)
- `web/src/app/(dashboard)/search/page.tsx` (신규)
- `web/src/components/search/SearchBar.tsx` (신규)
- `web/src/components/search/SearchResults.tsx` (신규)
- `web/src/components/search/SearchFilters.tsx` (신규)

**의존성**:
- Step 4 완료 (통합 활동 조회 API)

**기대 효과**:
- 모든 활동을 통합적으로 검색 가능
- 효율적인 정보 검색
- 사용자 생산성 향상

---

### Step 7: 일정 데이터 모델 설계 및 마이그레이션

**우선순위**: 높음 (P1)  
**예상 소요 시간**: 5-6일  
**담당자**: 개발 리더 + 개발자2

**작업 내용**:
1. 일정 테이블 설계
   - `schedules` 테이블 스키마 설계
   - 일정 유형 정의 (consultation, assessment, rental, customization)
   - 관련 엔티티 연결
     - `client_id` 필수 (대상자 연결)
     - `equipment_id` 선택 (대여 일정의 경우)
     - `customization_request_id` 선택 (맞춤제작 일정의 경우)
   - 반복 일정 지원 구조 설계
   - ERD 다이어그램 작성 및 문서화

2. 일정 상태 Enum 정의
   - 상태 값: scheduled → confirmed → in_progress → completed → cancelled
   - 알림 설정 필드 정의 (리마인더 시간 등)
   - 역할별 일정 관리 권한 매트릭스 정의

3. 참석자 관리 테이블 설계
   - `schedule_participants` 테이블 설계
   - 여러 담당자 참석 지원

4. 데이터베이스 마이그레이션 작성
   - `schedules` 테이블 생성 마이그레이션
   - `schedule_participants` 테이블 생성 마이그레이션
   - 인덱스 및 외래키 설정
   - 마이그레이션 테스트

**예상 파일**:
- `web/supabase/migrations/YYYYMMDD_create_schedules.sql` (신규)
- `web/supabase/migrations/YYYYMMDD_create_schedule_participants.sql` (신규)
- `docs/erd-schedules.md` (신규 - 일정 ERD 문서)

**의존성**:
- CMS-EP-01 (clients 테이블)
- ERM-EP-01 (equipment 테이블)
- Step 1 완료 (customization_requests 테이블)

**기대 효과**:
- 체계적인 일정 관리
- 다양한 일정 유형 지원
- 참석자 관리 기능 제공

---

### Step 8: 일정 관리 API 구현

**우선순위**: 높음 (P1)  
**예상 소요 시간**: 12-14일  
**담당자**: 개발자2

**작업 내용**:
1. 상담 일정 관리 API
   - POST /api/schedules/consultation 엔드포인트 구현
   - GET /api/schedules 엔드포인트 구현 (날짜별, 담당자별, 대상자별 필터링)
   - PUT /api/schedules/[id] 엔드포인트 구현
   - DELETE /api/schedules/[id] 엔드포인트 구현
   - 중복 일정 검증 로직 구현
   - 역할 권한 검증 (specialist, socialWorker만 가능)
   - 감사 로그 구현

2. 평가 일정 관리 API
   - POST /api/schedules/assessment 엔드포인트 구현
   - 평가 유형 연동 (기능 평가, 환경 평가, 욕구 평가)
   - 평가 장소 필드 추가
   - 평가 일정 전용 필터링 옵션 추가
   - 감사 로그 구현

3. 대여 일정 관리 API
   - POST /api/schedules/rental 엔드포인트 구현
   - 대여 예약 기능 연동
   - 기기 준비 일정 자동 생성
   - 감사 로그 구현

4. 맞춤제작 일정 관리 API
   - POST /api/schedules/customization 엔드포인트 구현
   - 맞춤제작 단계별 일정 자동 생성
   - 제작 단계와 일정 연동
   - 감사 로그 구현

5. 캘린더 API 구현
   - GET /api/schedules/calendar 엔드포인트 구현
   - 월별/주별/일별 조회 지원
   - 일정 유형별 색상 구분
   - 참석자 정보 포함
   - iCal 형식 내보내기 지원 (선택)

**예상 파일**:
- `web/src/app/api/schedules/route.ts` (신규)
- `web/src/app/api/schedules/[id]/route.ts` (신규)
- `web/src/app/api/schedules/consultation/route.ts` (신규)
- `web/src/app/api/schedules/assessment/route.ts` (신규)
- `web/src/app/api/schedules/rental/route.ts` (신규)
- `web/src/app/api/schedules/customization/route.ts` (신규)
- `web/src/app/api/schedules/calendar/route.ts` (신규)
- `web/src/lib/validations/schedule.ts` (신규 - Zod 스키마)
- `web/src/app/api/schedules/__tests__/route.test.ts` (신규)

**의존성**:
- Step 7 완료 (일정 데이터 모델)

**기대 효과**:
- 체계적인 일정 관리
- 다양한 일정 유형 지원
- 캘린더 뷰를 위한 데이터 제공

---

### Step 9: 일정 관리 UI 구현

**우선순위**: 높음 (P1)  
**예상 소요 시간**: 14-16일  
**담당자**: 개발자1

**작업 내용**:
1. 일정 생성 폼 UI
   - 일정 유형 선택 컴포넌트
   - 날짜/시간 선택 컴포넌트 (DatePicker)
   - 관련 엔티티 선택 (대상자, 기기 등)
   - 담당자 선택 (멀티 선택)
   - 리마인더 설정 옵션
   - 반복 일정 설정 옵션 (선택)
   - 성공/실패 토스트 알림

2. 캘린더 UI 컴포넌트
   - 월별 캘린더 뷰 컴포넌트
   - 주별 캘린더 뷰 컴포넌트
   - 일별 캘린더 뷰 컴포넌트
   - 일정 드래그 앤 드롭 기능 (선택)
   - 일정 클릭 시 상세 정보 모달
   - 일정 유형별 색상 표시
   - 접근성 준수 (ARIA 라벨, 키보드 네비게이션)

3. 일정 목록 페이지
   - 일정 목록 테이블 컴포넌트
   - 일정 유형별 필터
   - 날짜별 필터
   - 담당자별 필터
   - 페이지네이션 구현

**예상 파일**:
- `web/src/app/(dashboard)/schedules/page.tsx` (신규 - 목록 페이지)
- `web/src/app/(dashboard)/schedules/calendar/page.tsx` (신규 - 캘린더 페이지)
- `web/src/app/(dashboard)/schedules/new/page.tsx` (신규 - 등록 페이지)
- `web/src/components/schedules/ScheduleForm.tsx` (신규)
- `web/src/components/schedules/ScheduleList.tsx` (신규)
- `web/src/components/schedules/CalendarView.tsx` (신규)
- `web/src/components/schedules/MonthView.tsx` (신규)
- `web/src/components/schedules/WeekView.tsx` (신규)
- `web/src/components/schedules/DayView.tsx` (신규)
- `web/src/components/schedules/ScheduleModal.tsx` (신규)

**의존성**:
- Step 8 완료 (일정 관리 API)

**기대 효과**:
- 직관적인 일정 관리 인터페이스
- 다양한 캘린더 뷰 제공
- 효율적인 일정 관리

---

### Step 10: 일정 알림 기능 구현

**우선순위**: 중간 (P2)  
**예상 소요 시간**: 4-5일  
**담당자**: 개발자2 + 개발자1

**작업 내용**:
1. 일정 리마인더 알림 로직 구현
   - 리마인더 시간 계산 로직
   - 알림 대상자 식별
   - 알림 전송 스케줄링

2. 브라우저 알림 기능
   - Web Notification API 활용
   - 브라우저 권한 요청 처리
   - 알림 표시 및 클릭 처리

3. 이메일 알림 기능 (선택)
   - 이메일 템플릿 작성
   - 이메일 전송 로직 구현
   - 알림 설정 UI

4. 알림 설정 관리 UI
   - 사용자별 알림 설정 페이지
   - 알림 유형별 설정 (이메일, 브라우저)
   - 리마인더 시간 설정

**예상 파일**:
- `web/src/lib/notifications/schedule-reminder.ts` (신규)
- `web/src/lib/notifications/email-service.ts` (신규 - 선택)
- `web/src/app/(dashboard)/settings/notifications/page.tsx` (신규)
- `web/src/components/settings/NotificationSettings.tsx` (신규)

**의존성**:
- Step 8 완료 (일정 관리 API)

**기대 효과**:
- 일정 놓침 방지
- 사용자 경험 개선
- 업무 효율성 향상

---

## 📋 체크리스트

### Step 1: 맞춤제작 데이터 모델 설계 및 마이그레이션
- [ ] 맞춤제작 요청 테이블 설계 완료
- [ ] 맞춤제작 단계 상태 Enum 정의 완료
- [ ] 맞춤제작 단계 추적 데이터 모델 설계 완료
- [ ] 데이터베이스 마이그레이션 작성 완료

### Step 2: 맞춤제작 API 구현
- [ ] 맞춤제작 요청 등록 API 구현 완료
- [ ] 맞춤제작 요청 조회 API 구현 완료
- [ ] 맞춤제작 요청 수정 API 구현 완료
- [ ] 맞춤제작 단계 변경 API 구현 완료
- [ ] 맞춤제작 단계 히스토리 조회 API 구현 완료

### Step 3: 맞춤제작 UI 구현
- [ ] 맞춤제작 요청 등록 폼 UI 완료
- [ ] 맞춤제작 요청 목록 페이지 완료
- [ ] 맞춤제작 요청 상세 페이지 완료

### Step 4: 통합 대상자 활동 조회 API 구현
- [ ] 대상자 활동 통합 조회 API 구현 완료
- [ ] 대상자 통합 통계 API 구현 완료

### Step 5: 통합 대상자 관리 UI 구현
- [ ] 대상자 상세 페이지 통합 활동 탭 완료
- [ ] 대상자 통합 대시보드 위젯 완료
- [ ] 대상자 목록 페이지 개선 완료

### Step 6: 통합 검색 기능 구현
- [ ] 통합 검색 API 구현 완료
- [ ] 통합 검색 UI 구현 완료

### Step 7: 일정 데이터 모델 설계 및 마이그레이션
- [ ] 일정 테이블 설계 완료
- [ ] 일정 상태 Enum 정의 완료
- [ ] 참석자 관리 테이블 설계 완료
- [ ] 데이터베이스 마이그레이션 작성 완료

### Step 8: 일정 관리 API 구현
- [ ] 상담 일정 관리 API 구현 완료
- [ ] 평가 일정 관리 API 구현 완료
- [ ] 대여 일정 관리 API 구현 완료
- [ ] 맞춤제작 일정 관리 API 구현 완료
- [ ] 캘린더 API 구현 완료

### Step 9: 일정 관리 UI 구현
- [ ] 일정 생성 폼 UI 완료
- [ ] 캘린더 UI 컴포넌트 완료
- [ ] 일정 목록 페이지 완료

### Step 10: 일정 알림 기능 구현
- [ ] 일정 리마인더 알림 로직 구현 완료
- [ ] 브라우저 알림 기능 완료
- [ ] 이메일 알림 기능 완료 (선택)
- [ ] 알림 설정 관리 UI 완료

---

## 🔗 관련 Phase

- **Phase 1**: 프로젝트 초기 설정 (프로젝트 구조)
- **Phase 2**: 개발 환경 구축 (기술 스택)
- **Phase 4**: 문서화 (ERD 문서 작성)
- **Phase 5**: 보안 및 인프라 (데이터베이스 보안)
- **Phase 6**: 테스트 및 품질 관리 (단위 테스트 작성)

---

## 📚 참고 자료

- [데이터베이스 스키마](../DATABASE_SCHEMA.md)
- [CMS ERD](./erd-cms.md)
- [ERM ERD](./erd-erm.md)
- [API 문서](../API_DOCS.md)
- [개발 가이드](../DEVELOPMENT.md)

---

## 🎯 최종 목표

Phase 10 완료 시 달성할 목표:

1. **맞춤제작 관리 기능**
   - 맞춤제작 요청이 기존 대상자에 연결되어 통합 관리 가능
   - 맞춤제작 단계별 추적 기능 제공
   - 맞춤제작 관련 UI 완성

2. **통합 대상자 관리 시스템**
   - 대상자별 모든 활동을 한 곳에서 확인 가능
   - 통합 활동 타임라인 뷰 제공
   - 통합 검색 및 필터 기능
   - 대상자 목록 페이지 개선

3. **일정 관리 기능**
   - 상담/평가/대여/맞춤제작 일정 관리
   - 통합 캘린더 뷰 제공
   - 일정 알림 기능

---

## 📈 성공 지표

- **맞춤제작 관리**: 맞춤제작 요청 등록부터 완료까지 전체 프로세스 지원
- **통합 대상자 관리**: 대상자 상세 페이지에서 모든 활동 통합 조회 가능
- **일정 관리**: 모든 일정 유형의 통합 관리 및 캘린더 뷰 제공
- **사용자 만족도**: 대상자 관리 효율성 향상, 작업 시간 단축

---

## ⚠️ 위험 요소 및 완화 전략

### 위험 요소

1. **데이터 모델 복잡도 증가**
   - **위험**: 여러 테이블 간 관계가 복잡해질 수 있음
   - **완화 전략**: ERD를 먼저 작성하고 리뷰 후 마이그레이션 진행

2. **통합 활동 조회 성능**
   - **위험**: 여러 테이블 JOIN으로 인한 성능 저하 가능
   - **완화 전략**: 인덱스 최적화, 페이지네이션 적용, 필요시 캐싱 고려

3. **캘린더 UI 구현 복잡도**
   - **위험**: 캘린더 컴포넌트 구현이 복잡할 수 있음
   - **완화 전략**: 기존 캘린더 라이브러리 활용 검토 (react-big-calendar 등)

4. **일정 알림 기능 구현 시간**
   - **위험**: 알림 기능 구현에 예상보다 많은 시간 소요 가능
   - **완화 전략**: MVP에서는 브라우저 알림만 구현, 이메일 알림은 Phase 2로 이동

---

## 📅 개발 일정 추정

### 전체 예상 기간: 8-10주 (2개월)

**Week 1-2**: Step 1-2 (맞춤제작 데이터 모델 및 API)
- 데이터 모델 설계: 1주
- API 구현: 1주

**Week 3-4**: Step 3 (맞춤제작 UI)
- UI 구현: 2주

**Week 5**: Step 4-5 (통합 대상자 관리)
- API 구현: 1주
- UI 구현: 1주

**Week 6**: Step 6 (통합 검색)
- 검색 기능 구현: 1주

**Week 7-8**: Step 7-8 (일정 데이터 모델 및 API)
- 데이터 모델 설계: 1주
- API 구현: 1주

**Week 9-10**: Step 9-10 (일정 UI 및 알림)
- UI 구현: 1.5주
- 알림 기능: 0.5주

---

**마지막 업데이트**: 2025-11-02  
**다음 검토일**: 2025-11-09

