-- Create clients table for storing client (case subject) information
-- Sprint 1: CMS-EP-01

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  disability_type TEXT,
  disability_grade TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  referral_source TEXT,
  intake_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discharged')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id TEXT,
  updated_by_user_id TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_intake_date ON clients(intake_date DESC);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on UPDATE
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE clients IS '대상자(사례 대상) 기본 정보 테이블';
COMMENT ON COLUMN clients.name IS '대상자 이름 (필수)';
COMMENT ON COLUMN clients.status IS '대상자 상태: active(활동중), inactive(비활동), discharged(종결)';
COMMENT ON COLUMN clients.disability_type IS '장애 유형 (예: 지체장애, 시각장애, 청각장애 등)';
COMMENT ON COLUMN clients.disability_grade IS '장애 등급 (예: 1급, 2급 등)';
COMMENT ON COLUMN clients.referral_source IS '의뢰 경로 (예: 병원, 복지관, 자가 등)';
COMMENT ON COLUMN clients.intake_date IS '접수일 (케이스 시작일)';
COMMENT ON COLUMN clients.created_by_user_id IS '생성자 Clerk User ID';
COMMENT ON COLUMN clients.updated_by_user_id IS '최종 수정자 Clerk User ID';

