-- Etapa 8 — Log de auditoria de ações do super admin
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action            TEXT NOT NULL,               -- 'suspend_user', 'unblock_user', etc.
  target_user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_user_email TEXT,
  details           JSONB NOT NULL DEFAULT '{}',
  performed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_performed_at_idx ON admin_audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_user_idx  ON admin_audit_log(target_user_id);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON admin_audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);
