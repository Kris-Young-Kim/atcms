-- Create schedules table for storing various types of schedules
-- Phase 10: SCH-EP-01, SCH-US-01
-- 참고: 이 프로젝트는 Supabase RLS를 사용하지 않습니다. 모든 접근 제어는 애플리케이션 레벨에서 처리합니다.

CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- 일정 유형
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('consultation', 'assessment', 'rental', 'customization', 'other')),
  -- 대상자 연결 (맞춤제작, 대여의 경우 client_id 필수)
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  -- 대여 연결 (대여 관련 일정의 경우)
  rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
  -- 맞춤제작 연결 (맞춤제작 관련 일정의 경우)
  customization_request_id UUID REFERENCES customization_requests(id) ON DELETE SET NULL,
  -- 일정 기본 정보
  title TEXT NOT NULL,
  description TEXT,
  -- 일정 시간
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  -- 장소
  location TEXT,
  -- 참석자 정보 (JSONB 배열로 저장)
  participant_ids JSONB DEFAULT '[]'::jsonb, -- Clerk User ID 배열
  -- 알림 설정
  reminder_minutes INTEGER DEFAULT 30, -- 일정 시작 전 몇 분 전 알림 (0이면 알림 없음)
  -- 상태
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  -- 메모
  notes TEXT,
  -- 감사 필드
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id TEXT,
  updated_by_user_id TEXT,
  -- 제약조건: end_time은 start_time 이후여야 함
  CONSTRAINT check_end_after_start CHECK (end_time > start_time)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_schedules_schedule_type ON schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_schedules_client_id ON schedules(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schedules_rental_id ON schedules(rental_id) WHERE rental_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schedules_customization_request_id ON schedules(customization_request_id) WHERE customization_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_created_at ON schedules(created_at DESC);

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE schedules IS '일정 관리 테이블';
COMMENT ON COLUMN schedules.schedule_type IS '일정 유형: consultation(상담), assessment(평가), rental(대여), customization(맞춤제작), other(기타)';
COMMENT ON COLUMN schedules.client_id IS '대상자 ID (외래키, 일정 유형에 따라 필수)';
COMMENT ON COLUMN schedules.rental_id IS '대여 ID (외래키, 대여 관련 일정인 경우)';
COMMENT ON COLUMN schedules.customization_request_id IS '맞춤제작 요청 ID (외래키, 맞춤제작 관련 일정인 경우)';
COMMENT ON COLUMN schedules.title IS '일정 제목 (필수)';
COMMENT ON COLUMN schedules.description IS '일정 설명';
COMMENT ON COLUMN schedules.start_time IS '시작 시간 (TIMESTAMPTZ)';
COMMENT ON COLUMN schedules.end_time IS '종료 시간 (TIMESTAMPTZ)';
COMMENT ON COLUMN schedules.location IS '장소';
COMMENT ON COLUMN schedules.participant_ids IS '참석자 Clerk User ID 배열 (JSONB)';
COMMENT ON COLUMN schedules.reminder_minutes IS '알림 설정 (일정 시작 전 몇 분 전, 0이면 알림 없음)';
COMMENT ON COLUMN schedules.status IS '일정 상태: scheduled(예정), completed(완료), cancelled(취소), no_show(불참)';

