-- Create maintenance_notes table for storing equipment maintenance history
-- Sprint 1: ERM-EP-01, ERM-US-03
-- 참고: 이 프로젝트는 Supabase RLS를 사용하지 않습니다. 모든 접근 제어는 애플리케이션 레벨에서 처리합니다.

CREATE TABLE IF NOT EXISTS maintenance_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  content TEXT,
  maintenance_type TEXT,
  cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id TEXT,
  updated_by_user_id TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_maintenance_notes_equipment_id ON maintenance_notes(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_notes_note_date ON maintenance_notes(note_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_notes_created_at ON maintenance_notes(created_at DESC);

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER update_maintenance_notes_updated_at
  BEFORE UPDATE ON maintenance_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE maintenance_notes IS '기기 유지보수 노트 테이블';
COMMENT ON COLUMN maintenance_notes.equipment_id IS '기기 ID (외래키)';
COMMENT ON COLUMN maintenance_notes.note_date IS '노트 작성일';
COMMENT ON COLUMN maintenance_notes.title IS '제목 (필수)';
COMMENT ON COLUMN maintenance_notes.content IS '내용';
COMMENT ON COLUMN maintenance_notes.maintenance_type IS '유지보수 유형 (repair, inspection, cleaning 등)';
COMMENT ON COLUMN maintenance_notes.cost IS '비용';

