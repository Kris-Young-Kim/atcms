-- Create equipment table for storing equipment inventory
-- Sprint 1: ERM-EP-01
-- 참고: 이 프로젝트는 Supabase RLS를 사용하지 않습니다. 모든 접근 제어는 애플리케이션 레벨에서 처리합니다.

CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'maintenance', 'retired')),
  total_quantity INTEGER NOT NULL DEFAULT 1 CHECK (total_quantity >= 0),
  available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  location TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  warranty_expires DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id TEXT,
  updated_by_user_id TEXT,
  -- Serial number should be unique if provided
  CONSTRAINT unique_serial_number UNIQUE (serial_number) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_equipment_name ON equipment(name);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_serial_number ON equipment(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_created_at ON equipment(created_at DESC);

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to validate available_quantity <= total_quantity
CREATE OR REPLACE FUNCTION validate_equipment_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.available_quantity > NEW.total_quantity THEN
    RAISE EXCEPTION '가용 수량은 전체 수량을 초과할 수 없습니다.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_equipment_quantity
  BEFORE INSERT OR UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION validate_equipment_quantity();

-- Add comments for documentation
COMMENT ON TABLE equipment IS '기기 재고 테이블';
COMMENT ON COLUMN equipment.name IS '기기명 (필수)';
COMMENT ON COLUMN equipment.category IS '카테고리 (wheelchair, hearing_aid, communication_aid 등)';
COMMENT ON COLUMN equipment.status IS '상태: normal(정상), maintenance(유지보수), retired(폐기)';
COMMENT ON COLUMN equipment.total_quantity IS '전체 수량';
COMMENT ON COLUMN equipment.available_quantity IS '가용 수량 (대여 가능한 수량)';
COMMENT ON COLUMN equipment.serial_number IS '시리얼 번호 (고유값, NULL 허용)';

