-- Single-session enforcement: one active login per user at a time
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_session_nonce UUID;
