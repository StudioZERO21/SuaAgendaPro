-- ============================================================
-- ETAPA 09 — WhatsApp (config + message log)
-- ============================================================

-- Adiciona colunas de WhatsApp no perfil do profissional
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_enabled          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_greeting         TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_msg_confirmation TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_msg_reminder     TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_msg_cancellation TEXT;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_whatsapp_greeting_len
    CHECK (whatsapp_greeting IS NULL OR char_length(whatsapp_greeting) <= 500),
  ADD CONSTRAINT profiles_whatsapp_msg_confirmation_len
    CHECK (whatsapp_msg_confirmation IS NULL OR char_length(whatsapp_msg_confirmation) <= 500),
  ADD CONSTRAINT profiles_whatsapp_msg_reminder_len
    CHECK (whatsapp_msg_reminder IS NULL OR char_length(whatsapp_msg_reminder) <= 500),
  ADD CONSTRAINT profiles_whatsapp_msg_cancellation_len
    CHECK (whatsapp_msg_cancellation IS NULL OR char_length(whatsapp_msg_cancellation) <= 500);

-- ------------------------------------------------------------
-- TABELA: whatsapp_messages (log de mensagens enviadas)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id  UUID        REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_phone    TEXT        NOT NULL,
  client_name     TEXT,
  message_type    TEXT        NOT NULL DEFAULT 'manual',
  message_text    TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending',
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_messages_type_check
    CHECK (message_type IN ('confirmation','reminder','cancellation','manual')),
  CONSTRAINT whatsapp_messages_status_check
    CHECK (status IN ('pending','sent','failed')),
  CONSTRAINT whatsapp_messages_phone_len
    CHECK (char_length(client_phone) <= 30),
  CONSTRAINT whatsapp_messages_text_len
    CHECK (char_length(message_text) <= 1000)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_messages_own"
  ON public.whatsapp_messages FOR ALL TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- anon não pode ver mensagens; service_role precisa para logar confirmações de booking público
GRANT ALL ON public.whatsapp_messages TO service_role;

CREATE INDEX whatsapp_messages_professional_idx
  ON public.whatsapp_messages (professional_id, sent_at DESC);
