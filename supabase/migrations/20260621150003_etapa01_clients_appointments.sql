-- ============================================================
-- ETAPA 01 — Clientes e Agendamentos
-- ============================================================

-- ------------------------------------------------------------
-- TABELA: clients
-- ------------------------------------------------------------
CREATE TABLE public.clients (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  email                TEXT,
  phone                TEXT NOT NULL,
  notes                TEXT,
  total_appointments   INTEGER NOT NULL DEFAULT 0 CHECK (total_appointments >= 0),
  total_spent_cents    INTEGER NOT NULL DEFAULT 0 CHECK (total_spent_cents >= 0),
  last_appointment_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT clients_name_len CHECK (char_length(name) <= 120),
  CONSTRAINT clients_email_len CHECK (email IS NULL OR char_length(email) <= 255),
  CONSTRAINT clients_phone_len CHECK (char_length(phone) <= 20),
  CONSTRAINT clients_notes_len CHECK (notes IS NULL OR char_length(notes) <= 600)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_crud_own"
  ON public.clients FOR ALL TO authenticated
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- TABELA: appointments
-- ------------------------------------------------------------
CREATE TYPE public.appointment_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TABLE public.appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  service_id       UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 15),
  status           public.appointment_status NOT NULL DEFAULT 'pending',
  price_cents      INTEGER NOT NULL CHECK (price_cents >= 0),
  deposit_cents    INTEGER NOT NULL DEFAULT 0 CHECK (deposit_cents >= 0),
  deposit_paid     BOOLEAN NOT NULL DEFAULT false,
  notes            TEXT,
  google_event_id  TEXT,
  cancelled_at     TIMESTAMPTZ,
  cancel_reason    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT appointments_notes_len CHECK (notes IS NULL OR char_length(notes) <= 400),
  CONSTRAINT appointments_cancel_reason_len CHECK (cancel_reason IS NULL OR char_length(cancel_reason) <= 300)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT INSERT ON public.appointments TO anon;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Profissional gerencia os próprios agendamentos
CREATE POLICY "appointments_crud_own"
  ON public.appointments FOR ALL TO authenticated
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

-- Público pode criar agendamentos (booking)
CREATE POLICY "appointments_insert_public"
  ON public.appointments FOR INSERT TO anon
  WITH CHECK (true);

-- Leitura pública de agendamentos (para checar disponibilidade — só horários, sem dados pessoais)
CREATE POLICY "appointments_select_availability"
  ON public.appointments FOR SELECT TO anon
  USING (status NOT IN ('cancelled', 'no_show'));

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- TRIGGER: atualizar stats do cliente ao concluir agendamento
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando agendamento é concluído
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.clients
    SET
      total_appointments = total_appointments + 1,
      total_spent_cents  = total_spent_cents + NEW.price_cents,
      last_appointment_at = NEW.scheduled_at,
      updated_at = now()
    WHERE id = NEW.client_id;
  END IF;

  -- Quando agendamento é desconcluído (rollback de status)
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    UPDATE public.clients
    SET
      total_appointments = GREATEST(total_appointments - 1, 0),
      total_spent_cents  = GREATEST(total_spent_cents - OLD.price_cents, 0),
      updated_at = now()
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER appointments_update_client_stats
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_client_stats();
