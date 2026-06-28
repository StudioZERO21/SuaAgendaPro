-- Add theme selection columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS template_id   TEXT    NOT NULL DEFAULT 'bloom_soft',
  ADD COLUMN IF NOT EXISTS custom_colors JSONB;
