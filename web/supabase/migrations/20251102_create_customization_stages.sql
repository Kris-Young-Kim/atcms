-- Create customization_stages table for tracking customization request stage changes
-- Phase 10: CDM-EP-01, CDM-US-03
-- 참고: 이 프로젝트는 Supabase RLS를 사용하지 않습니다. 모든 접근 제어는 애플리케이션 레벨에서 처리합니다.

CREATE TABLE IF NOT EXISTS customization_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customization_request_id UUID NOT NULL REFERENCES customization_requests(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('requested', 'designing', 'prototyping', 'fitting', 'completed', 'cancelled')),
  -- 단계별 메타데이터
  notes TEXT, -- 단계별 메모
  metadata JSONB DEFAULT '{}'::jsonb, -- 단계별 추가 정보 (예: 설계자, 제작자, 테스트 결과 등)
  -- 파일 첨부
  attachments JSONB DEFAULT '[]'::jsonb, -- 단계별 파일 URL 배열 (설계도, 사진 등)
  -- 날짜 정보
  stage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- 감사 필드
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_customization_stages_request_id ON customization_stages(customization_request_id);
CREATE INDEX IF NOT EXISTS idx_customization_stages_stage ON customization_stages(stage);
CREATE INDEX IF NOT EXISTS idx_customization_stages_stage_date ON customization_stages(stage_date DESC);
CREATE INDEX IF NOT EXISTS idx_customization_stages_created_at ON customization_stages(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE customization_stages IS '맞춤제작 단계 추적 테이블';
COMMENT ON COLUMN customization_stages.customization_request_id IS '맞춤제작 요청 ID (외래키)';
COMMENT ON COLUMN customization_stages.stage IS '단계: requested(요청됨), designing(설계중), prototyping(시제품 제작중), fitting(착용 테스트), completed(완료), cancelled(취소됨)';
COMMENT ON COLUMN customization_stages.notes IS '단계별 메모';
COMMENT ON COLUMN customization_stages.metadata IS '단계별 추가 정보 (JSONB 형식)';
COMMENT ON COLUMN customization_stages.attachments IS '단계별 파일 URL 배열 (설계도, 사진 등)';
COMMENT ON COLUMN customization_stages.stage_date IS '단계 변경일';

