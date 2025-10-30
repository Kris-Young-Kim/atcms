-- Create RLS (Row Level Security) policies for clients table
-- Sprint 1: CMS-EP-01

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin has full access
CREATE POLICY "Admin full access on clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
  );

-- Policy 2: Leader full access
CREATE POLICY "Leader full access on clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'leader'
  );

-- Policy 3: Specialist full access
CREATE POLICY "Specialist full access on clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'specialist'
  );

-- Policy 4: Social Worker read-only access
CREATE POLICY "Social Worker read access on clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'socialWorker'
  );

-- Policy 5: Deny all other roles (technician should not access)
-- This is implicit - no policy means no access

-- Grant necessary permissions
GRANT SELECT ON clients TO authenticated;
GRANT INSERT, UPDATE, DELETE ON clients TO authenticated;

-- Add comments
COMMENT ON POLICY "Admin full access on clients" ON clients IS 
  'Admin 역할은 clients 테이블의 모든 작업(CRUD) 가능';
COMMENT ON POLICY "Leader full access on clients" ON clients IS 
  'Leader 역할은 clients 테이블의 모든 작업(CRUD) 가능';
COMMENT ON POLICY "Specialist full access on clients" ON clients IS 
  'Specialist 역할은 clients 테이블의 모든 작업(CRUD) 가능';
COMMENT ON POLICY "Social Worker read access on clients" ON clients IS 
  'SocialWorker 역할은 clients 테이블 조회(SELECT)만 가능';

