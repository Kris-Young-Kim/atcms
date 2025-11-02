-- Create service_records table for storing consultation and assessment records
-- Sprint 1: CMS-US-04, CMS-US-05
-- 참고: 이 프로젝트는 Supabase RLS를 사용하지 않습니다. 모든 접근 제어는 애플리케이션 레벨에서 처리합니다.

CREATE TABLE IF NOT EXISTS service_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('consultation', 'assessment')),
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  content TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id TEXT,
  updated_by_user_id TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_service_records_client_id ON service_records(client_id);
CREATE INDEX IF NOT EXISTS idx_service_records_record_type ON service_records(record_type);
CREATE INDEX IF NOT EXISTS idx_service_records_record_date ON service_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_records_created_at ON service_records(created_at DESC);

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER update_service_records_updated_at
  BEFORE UPDATE ON service_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE service_records IS '서비스 기록 테이블 (상담, 평가 기록)';
COMMENT ON COLUMN service_records.client_id IS '대상자 ID (외래키)';
COMMENT ON COLUMN service_records.record_type IS '기록 유형: consultation(상담), assessment(평가)';
COMMENT ON COLUMN service_records.record_date IS '서비스 제공일';
COMMENT ON COLUMN service_records.title IS '기록 제목 (필수)';
COMMENT ON COLUMN service_records.content IS '기록 내용 (SOAP 형식 등)';
COMMENT ON COLUMN service_records.attachments IS '첨부파일 URL 배열 (JSONB 형식)';
COMMENT ON COLUMN service_records.created_by_user_id IS '작성자 Clerk User ID';
COMMENT ON COLUMN service_records.updated_by_user_id IS '최종 수정자 Clerk User ID';

