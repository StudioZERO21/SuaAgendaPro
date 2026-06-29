-- ─── Google Calendar OAuth tokens ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token    TEXT NOT NULL,
  refresh_token   TEXT,
  expires_at      TIMESTAMPTZ NOT NULL,
  google_email    TEXT,
  settings        JSONB NOT NULL DEFAULT '{
    "calendarId": "primary",
    "syncCreate": true,
    "syncUpdate": true,
    "syncCancel": true,
    "includeClientName": true,
    "reminderMinutes": 30,
    "autoSyncEnabled": true,
    "autoSyncInterval": 15
  }'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_calendar_tokens TO authenticated;
GRANT ALL ON public.google_calendar_tokens TO service_role;

CREATE POLICY "gcal_tokens_own"
  ON public.google_calendar_tokens FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_gcal_token_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_gcal_token_updated_at
  BEFORE UPDATE ON public.google_calendar_tokens
  FOR EACH ROW EXECUTE FUNCTION public.touch_gcal_token_updated_at();
