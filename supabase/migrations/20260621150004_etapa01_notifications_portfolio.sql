-- ============================================================
-- ETAPA 01 — Notificações e Portfólio
-- ============================================================

-- ------------------------------------------------------------
-- TABELA: notifications
-- ------------------------------------------------------------
CREATE TYPE public.notification_type AS ENUM (
  'new_appointment',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_reminder',
  'payment_received',
  'payment_pending',
  'system'
);

CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            public.notification_type NOT NULL DEFAULT 'system',
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  appointment_id  UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notifications_title_len CHECK (char_length(title) <= 120),
  CONSTRAINT notifications_body_len CHECK (char_length(body) <= 400)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own"
  ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índice para busca de notificações não lidas
CREATE INDEX notifications_user_unread_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE is_read = false;

-- ------------------------------------------------------------
-- TABELA: portfolio_items
-- ------------------------------------------------------------
CREATE TABLE public.portfolio_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url       TEXT NOT NULL,
  title           TEXT,
  description     TEXT,
  service_id      UUID REFERENCES public.services(id) ON DELETE SET NULL,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portfolio_items_title_len CHECK (title IS NULL OR char_length(title) <= 100),
  CONSTRAINT portfolio_items_description_len CHECK (description IS NULL OR char_length(description) <= 300)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT SELECT ON public.portfolio_items TO anon;
GRANT ALL ON public.portfolio_items TO service_role;

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_items_crud_own"
  ON public.portfolio_items FOR ALL TO authenticated
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

-- Público pode ver portfolio (para perfil público)
CREATE POLICY "portfolio_items_select_public"
  ON public.portfolio_items FOR SELECT TO anon
  USING (true);
