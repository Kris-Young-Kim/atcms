-- Create customization_requests table for storing custom device manufacturing requests
-- Phase 10: CDM-EP-01, CDM-US-01
-- 참고: 이 프로젝트는 Supabase RLS를 사용하지 않습니다. 모든 접근 제어는 애플리케이션 레벨에서 처리합니다.

CREATE TABLE IF NOT EXISTS customization_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  purpose TEXT, -- 제작 목적
  -- 치수 정보
  height_cm DECIMAL(10,2),
  width_cm DECIMAL(10,2),
  depth_cm DECIMAL(10,2),
  weight_kg DECIMAL(10,2),
  -- 재료 정보
  materials JSONB DEFAULT '[]'::jsonb, -- 재료 배열 (예: ["플라스틱", "알루미늄"])
  -- 특수 요구사항
  special_requirements TEXT,
  -- 제작 관련 파일
  design_files JSONB DEFAULT '[]'::jsonb, -- 설계도, 참고 이미지 URL 배열
  -- 상태 관리
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'designing', 'prototyping', 'fitting', 'completed', 'cancelled')),
  -- 날짜 정보
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_completion_date DATE,
  completed_date DATE,
  -- 메모
  notes TEXT,
  -- 감사 필드
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id TEXT,
  updated_by_user_id TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_customization_requests_client_id ON customization_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_customization_requests_status ON customization_requests(status);
CREATE INDEX IF NOT EXISTS idx_customization_requests_requested_date ON customization_requests(requested_date DESC);
CREATE INDEX IF NOT EXISTS idx_customization_requests_created_at ON customization_requests(created_at DESC);

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER update_customization_requests_updated_at
  BEFORE UPDATE ON customization_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE customization_requests IS '맞춤제작 요청 테이블';
COMMENT ON COLUMN customization_requests.client_id IS '대상자 ID (외래키)';
COMMENT ON COLUMN customization_requests.title IS '제작 요청 제목 (필수)';
COMMENT ON COLUMN customization_requests.description IS '제작 요청 설명';
COMMENT ON COLUMN customization_requests.purpose IS '제작 목적';
COMMENT ON COLUMN customization_requests.height_cm IS '높이 (cm)';
COMMENT ON COLUMN customization_requests.width_cm IS '너비 (cm)';
COMMENT ON COLUMN customization_requests.depth_cm IS '깊이 (cm)';
COMMENT ON COLUMN customization_requests.weight_kg IS '무게 (kg)';
COMMENT ON COLUMN customization_requests.materials IS '재료 정보 배열 (JSONB)';
COMMENT ON COLUMN customization_requests.special_requirements IS '특수 요구사항';
COMMENT ON COLUMN customization_requests.design_files IS '설계도 및 참고 이미지 URL 배열 (JSONB)';
COMMENT ON COLUMN customization_requests.status IS '제작 상태: requested(요청됨), designing(설계중), prototyping(시제품 제작중), fitting(착용 테스트), completed(완료), cancelled(취소됨)';
COMMENT ON COLUMN customization_requests.requested_date IS '요청일';
COMMENT ON COLUMN customization_requests.expected_completion_date IS '예상 완료일';
COMMENT ON COLUMN customization_requests.completed_date IS '실제 완료일';

