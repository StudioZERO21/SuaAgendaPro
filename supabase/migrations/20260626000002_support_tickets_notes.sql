-- Adiciona coluna notes (JSONB array) para auditoria de atendimento dos tickets
-- Cada entrada: { id, at, type: "note"|"status"|"priority", content, statusFrom?, statusTo?, priorityFrom?, priorityTo? }

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS notes JSONB NOT NULL DEFAULT '[]'::jsonb;
