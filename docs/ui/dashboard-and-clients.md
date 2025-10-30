# AT-Care MVP 화면 설계 (Dashboard & Clients)

## 1. 공통 UI 원칙
- Tailwind CSS 4 기반 유틸 사용, 8pt spacing 스케일 유지
- 카드/모달/배지 등 공통 컴포넌트는 `src/components` 하위에 모듈화
- 라이트 모드 기준 설계 후 다크 모드 대비 색상 토큰 정의 (`bg-slate-50`, `bg-slate-900` 등)
- 접근성: 대비비율 AA 이상, 포커스 링(`outline-2 outline-offset-2 outline-blue-500`) 기본 제공
- 감사 로그: 핵심 버튼(`저장`, `생성`, `반납`) 클릭 시 `auditLogger.info` 호출

## 2. 대시보드 (`/dashboard`)

### 2.1 레이아웃 개요
```
┌─────────────────────────────────────────────┐
│ Top Bar                                    │ height 64
├─────────────────────────────────────────────┤
│ Filters Row                                │ height 56 (검색, 날짜)   
├─────────────────────────────────────────────┤
│ KPI Cards (4 columns)                      │ height 120
├────────────────────────┬────────────────────┤
│ Today's Schedule       │ Recent Activity    │
│ (list)                 │ (timeline)         │ flex-1 (min 320)
├────────────────────────┴────────────────────┤
│ Charts (Service Trend / Disability Mix)    │ height 280
└─────────────────────────────────────────────┘
```

### 2.2 컴포넌트 목록
- `TopNavigation`: 로고, 조직 선택, 전역 검색, 사용자 메뉴
- `DashboardFilterBar`: 날짜 범위 선택, 담당자 필터, 알림 배지
- `KpiCard`: 아이콘 + 제목 + 값 + 변화율 (props로 수치 전달)
- `ScheduleList`: 시간순 리스트, 상태 배지(대기/진행/완료)
- `ActivityTimeline`: 최근 활동 타임라인, 로그 아이콘 및 작성자 정보
- `DashboardCharts`: LineChart(서비스 트렌드), DonutChart(장애 유형 비중)

### 2.3 Tailwind 스타일 토큰
- 기본 배경: `bg-slate-50`
- 카드 배경: `bg-white shadow-sm rounded-2xl border border-slate-200`
- 주요 텍스트: `text-slate-900`
- 보조 텍스트: `text-slate-600`
- 강조 색상: `bg-blue-600 text-white` (버튼), `text-emerald-600` (증감)

## 3. 대상자 목록 (`/clients`)

### 3.1 레이아웃 개요
```
┌─────────────────────────────────────────────┐
│ Header                                      │ 제목 + 신규 등록 버튼
├─────────────────────────────────────────────┤
│ Filter Toolbar                              │ 검색, 필터, 정렬, 태그   
├─────────────────────────────────────────────┤
│ ClientTable (sticky columns)                │
│ ┌────────────┬───────┬────────┬────────────┐ │
│ │ 체크박스   │ ID    │ 이름   │ 장애 유형  │ │ 25행/p
│ └────────────┴───────┴────────┴────────────┘ │
├─────────────────────────────────────────────┤
│ Bulk Action Bar (선택 시 노출)              │
├─────────────────────────────────────────────┤
│ Pagination                                  │
└─────────────────────────────────────────────┘
```

### 3.2 컴포넌트 목록
- `PageHeader`: 제목, 총 대상자 수, CTA 버튼
- `ClientFilterBar`: 검색 인풋 + 필터 선택 + 태그 토글
- `DataTable`: 재사용 가능한 표 컴포넌트 (컬럼 정의 + 행 렌더 함수)
- `StatusBadge`: 진행 상태 색상 (진행중 `bg-blue-100 text-blue-700`, 완료 `bg-emerald-100 text-emerald-700`)
- `BulkActionBar`: 내보내기, 담당자 변경, 태그 추가 버튼
- `Pagination`: 기본 25행, 페이지 이동, per-page 선택

### 3.3 반응형 전략
- ≥1280px: 테이블 전체 표시
- 1024px~1279px: 일부 열(담당자, 상태)만 유지, 나머지는 `overflow-x-auto`
- ≤768px: 카드형 리스트로 전환 (이름/장애유형/담당자 핵심 정보)

## 4. 대상자 상세 (`/clients/:id`)

### 4.1 탭 구조
Tabs 컴포넌트(`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`)를 사용해 5개 섹션 제공

1. **기본 정보**: 2열 그리드 카드 (`Label + Value`), 연락처/의료 이력
2. **상담 & 기록**: 타임라인 + 아코디언 뷰, 작성자/작성일 표시, `Add Record` 버튼
3. **평가**: 카드 리스트 (점수, 첨부 파일, 지표), `Start Assessment` 버튼
4. **서비스 계획**: 목표 카드, 진행률 바(`w-full bg-slate-200` 내부에 `bg-blue-500`)
5. **기기 & 대여**: 현재 대여 테이블 + 맞춤 제작 상태 뱃지

### 4.2 서브 컴포넌트
- `SectionCard`: 탭 내 섹션 컨테이너, 헤더 + 액션 버튼 슬롯
- `TimelineItem`: 아이콘, 제목, 날짜, 작성자, 컨텍스트 메뉴(편집/삭제)
- `ProgressBadge`: 목표 진행률 시각화 (원형/바)
- `AttachmentList`: 파일명, 용량, 다운로드 버튼

### 4.3 모달/폼 패턴
- 등록/편집 모달은 `Dialog` 기본 컴포넌트 재사용
- 폼은 `react-hook-form` + `zodResolver`
- `PrimaryButton`: `bg-blue-600 text-white hover:bg-blue-700`
- `SecondaryButton`: `bg-white border border-slate-300 text-slate-700`

## 5. 컴포넌트 디렉토리 제안
```
src/
  components/
    layout/
      top-navigation.tsx
      page-header.tsx
    cards/
      kpi-card.tsx
      section-card.tsx
    data-display/
      data-table.tsx
      schedule-list.tsx
      timeline.tsx
    forms/
      controlled-input.tsx
      filter-bar.tsx
    feedback/
      status-badge.tsx
      progress-badge.tsx
```

## 6. 상태/색상 토큰 요약
| 목적 | 클래스 |
|------|--------|
| 성공 | `bg-emerald-100 text-emerald-700` |
| 경고 | `bg-amber-100 text-amber-700` |
| 오류 | `bg-rose-100 text-rose-700` |
| 정보 | `bg-blue-100 text-blue-700` |

## 7. 감사 로그 트리거 표준
| 위치 | action | 메타데이터 |
|------|--------|-------------|
| 신규 대상자 등록 버튼 | `client_create_clicked` | `{ source: "dashboard" }` |
| 상담 기록 저장 | `consultation_created` | `{ clientId, recordId }` |
| 기기 반납 처리 | `rental_returned` | `{ rentalId, equipmentId }` |

---
*작성일: 2025-10-30 / 담당: Frontend*

