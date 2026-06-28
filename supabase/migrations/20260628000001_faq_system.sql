-- ─── FAQ System ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS faq_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT        NOT NULL DEFAULT '',
  icon        TEXT        NOT NULL DEFAULT '❓',
  sort_order  INT         NOT NULL DEFAULT 0,
  enabled     BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_subcategories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID        NOT NULL REFERENCES faq_categories(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  sort_order  INT         NOT NULL DEFAULT 0,
  enabled     BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_items (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    UUID        NOT NULL REFERENCES faq_categories(id) ON DELETE CASCADE,
  subcategory_id UUID        REFERENCES faq_subcategories(id) ON DELETE SET NULL,
  question       TEXT        NOT NULL,
  answer         TEXT        NOT NULL,
  keywords       TEXT[]      NOT NULL DEFAULT '{}',
  sort_order     INT         NOT NULL DEFAULT 0,
  enabled        BOOLEAN     NOT NULL DEFAULT true,
  view_count     INT         NOT NULL DEFAULT 0,
  ai_view_count  INT         NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_view_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id     UUID        NOT NULL REFERENCES faq_items(id) ON DELETE CASCADE,
  source     TEXT        NOT NULL DEFAULT 'ai',  -- 'ai' | 'admin' | 'public'
  query_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes para buscas e relatórios
CREATE INDEX IF NOT EXISTS idx_faq_items_category    ON faq_items(category_id);
CREATE INDEX IF NOT EXISTS idx_faq_items_enabled     ON faq_items(enabled);
CREATE INDEX IF NOT EXISTS idx_faq_view_logs_faq     ON faq_view_logs(faq_id);
CREATE INDEX IF NOT EXISTS idx_faq_view_logs_created ON faq_view_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_faq_view_logs_source  ON faq_view_logs(source);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_faq_items_fts ON faq_items
  USING gin(to_tsvector('portuguese', question || ' ' || answer));

-- RLS — tabelas são gerenciadas pelo service_role (super admin)
ALTER TABLE faq_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_view_logs    ENABLE ROW LEVEL SECURITY;

-- Nenhuma política de leitura/escrita para roles normais (acesso via service_role)
-- Leitura pública apenas de itens habilitados (para a API N8N sem auth)
CREATE POLICY "faq_items_public_read" ON faq_items
  FOR SELECT USING (enabled = true);

CREATE POLICY "faq_categories_public_read" ON faq_categories
  FOR SELECT USING (enabled = true);

CREATE POLICY "faq_subcategories_public_read" ON faq_subcategories
  FOR SELECT USING (enabled = true);

-- Insert de logs permitido publicamente (N8N registra consultas)
CREATE POLICY "faq_view_logs_public_insert" ON faq_view_logs
  FOR INSERT WITH CHECK (true);

-- ─── RPC: incrementa contadores de visualização ───────────────────────────────
CREATE OR REPLACE FUNCTION increment_faq_view(p_id UUID, p_is_ai BOOLEAN)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE faq_items SET
    view_count    = CASE WHEN NOT p_is_ai THEN view_count + 1    ELSE view_count    END,
    ai_view_count = CASE WHEN p_is_ai     THEN ai_view_count + 1 ELSE ai_view_count END,
    last_viewed_at = now()
  WHERE id = p_id;
$$;
