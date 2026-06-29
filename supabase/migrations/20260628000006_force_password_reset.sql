-- Forced password reset by admin
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_reset_token UUID,
  ADD COLUMN IF NOT EXISTS password_reset_token_expires_at TIMESTAMPTZ;
