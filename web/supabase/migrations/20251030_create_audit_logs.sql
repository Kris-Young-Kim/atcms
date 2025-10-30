-- Create audit_logs table for tracking all critical actions
-- Sprint 1: INF-US-01

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id TEXT,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id) WHERE actor_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Audit log table for tracking all CMS/ERM/CDM critical actions';
COMMENT ON COLUMN audit_logs.actor_id IS 'Clerk user ID or system identifier';
COMMENT ON COLUMN audit_logs.action IS 'Action name (e.g., client_created, equipment_status_updated)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context data (client ID, error details, etc.)';
COMMENT ON COLUMN audit_logs.tags IS 'Categorization tags for filtering';

