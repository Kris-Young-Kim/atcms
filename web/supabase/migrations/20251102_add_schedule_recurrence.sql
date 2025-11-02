-- Add recurrence support to schedules table
-- Phase 10 follow-up: 반복 일정 지원 구조 설계

ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recurrence_count INTEGER CHECK (recurrence_count IS NULL OR recurrence_count > 0),
  ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS recurrence_exception_dates JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Recurring 일정은 recurrence_rule이 필수
ALTER TABLE schedules
  ADD CONSTRAINT IF NOT EXISTS check_recurrence_rule_presence
  CHECK (is_recurring = FALSE OR recurrence_rule IS NOT NULL);

-- 하위 인스턴스 조회 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_schedules_recurrence_parent_id
  ON schedules(recurrence_parent_id)
  WHERE recurrence_parent_id IS NOT NULL;

COMMENT ON COLUMN schedules.is_recurring IS '반복 일정 여부. TRUE이면 recurrence_rule이 필수이며 해당 레코드는 반복 템플릿을 의미합니다.';
COMMENT ON COLUMN schedules.recurrence_rule IS '반복 규칙 (iCal RRULE 형식 권장, 예: FREQ=WEEKLY;INTERVAL=1).';
COMMENT ON COLUMN schedules.recurrence_end_time IS '반복 일정 종료 시각 (옵션).';
COMMENT ON COLUMN schedules.recurrence_count IS '반복 생성 횟수 제한 (옵션).';
COMMENT ON COLUMN schedules.recurrence_parent_id IS '반복 일정 시리즈의 부모 일정 ID. NULL이면 자체가 템플릿 또는 단일 일정.';
COMMENT ON COLUMN schedules.recurrence_exception_dates IS '반복 일정에서 제외할 ISO 날짜 목록.';

