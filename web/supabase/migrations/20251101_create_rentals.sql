-- Create rentals table for storing equipment rental records
-- Sprint 1: ERM-EP-01
-- 참고: 이 프로젝트는 Supabase RLS를 사용하지 않습니다. 모든 접근 제어는 애플리케이션 레벨에서 처리합니다.

CREATE TABLE IF NOT EXISTS rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  rental_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  actual_return_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'cancelled')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  contract_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id TEXT,
  updated_by_user_id TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_rentals_equipment_id ON rentals(equipment_id);
CREATE INDEX IF NOT EXISTS idx_rentals_client_id ON rentals(client_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_rental_date ON rentals(rental_date DESC);
CREATE INDEX IF NOT EXISTS idx_rentals_created_at ON rentals(created_at DESC);

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER update_rentals_updated_at
  BEFORE UPDATE ON rentals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update equipment.available_quantity when rental is created
CREATE OR REPLACE FUNCTION decrease_equipment_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE equipment
    SET available_quantity = available_quantity - NEW.quantity
    WHERE id = NEW.equipment_id
      AND available_quantity >= NEW.quantity;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION '가용 수량이 부족합니다.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rental_created
  AFTER INSERT ON rentals
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION decrease_equipment_quantity();

-- Create trigger to automatically update equipment.available_quantity when rental is returned
CREATE OR REPLACE FUNCTION increase_equipment_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes from active to returned
  IF OLD.status = 'active' AND NEW.status = 'returned' AND NEW.actual_return_date IS NOT NULL THEN
    UPDATE equipment
    SET available_quantity = available_quantity + OLD.quantity
    WHERE id = OLD.equipment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rental_returned
  AFTER UPDATE ON rentals
  FOR EACH ROW
  WHEN (OLD.status = 'active' AND NEW.status = 'returned' AND NEW.actual_return_date IS NOT NULL)
  EXECUTE FUNCTION increase_equipment_quantity();

-- Add comments for documentation
COMMENT ON TABLE rentals IS '기기 대여 기록 테이블';
COMMENT ON COLUMN rentals.equipment_id IS '기기 ID (외래키)';
COMMENT ON COLUMN rentals.client_id IS '대상자 ID (외래키)';
COMMENT ON COLUMN rentals.rental_date IS '대여 시작일';
COMMENT ON COLUMN rentals.expected_return_date IS '예상 반납일';
COMMENT ON COLUMN rentals.actual_return_date IS '실제 반납일';
COMMENT ON COLUMN rentals.status IS '상태: active(대여중), returned(반납됨), cancelled(취소됨)';
COMMENT ON COLUMN rentals.quantity IS '대여 수량';
COMMENT ON COLUMN rentals.contract_url IS '계약서 PDF URL (Supabase Storage)';

