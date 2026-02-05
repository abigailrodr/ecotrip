-- Create admin_audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  target_resource VARCHAR(100),
  target_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for querying audit logs
CREATE INDEX idx_audit_log_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_target ON admin_audit_log(target_resource, target_id);
