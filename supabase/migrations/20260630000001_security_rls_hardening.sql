-- ============================================================
-- Segurança P0 — RLS: expor apenas colunas públicas em profiles
-- e remover leitura/inserção anon direta em appointments
-- ============================================================

-- Colunas de endereço/tema podem existir só no remoto — garantir antes da view
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url         TEXT,
  ADD COLUMN IF NOT EXISTS gradient_color_2   TEXT,
  ADD COLUMN IF NOT EXISTS business_name      TEXT,
  ADD COLUMN IF NOT EXISTS street             TEXT,
  ADD COLUMN IF NOT EXISTS street_number      TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood       TEXT,
  ADD COLUMN IF NOT EXISTS address_complement TEXT,
  ADD COLUMN IF NOT EXISTS cep                TEXT,
  ADD COLUMN IF NOT EXISTS social_links       JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS template_id        TEXT DEFAULT 'bloom_soft',
  ADD COLUMN IF NOT EXISTS custom_colors      JSONB;

-- Revoga SELECT anon na tabela profiles (expunha tokens sensíveis)
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;

-- View com subset seguro para booking / página pública
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT
  id,
  slug,
  display_name,
  bio,
  phone,
  avatar_url,
  banner_url,
  cover_url,
  business_name,
  city,
  state,
  street,
  street_number,
  neighborhood,
  address_complement,
  cep,
  specialty,
  theme_color,
  gradient_color_2,
  show_prices,
  show_portfolio,
  accept_online,
  cancellation_policy,
  welcome_message,
  social_links,
  template_id,
  custom_colors,
  is_active
FROM public.profiles
WHERE is_active = true;

GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;

-- Appointments: anon não precisa SELECT/INSERT (booking via service_role)
DROP POLICY IF EXISTS "appointments_select_availability" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_public" ON public.appointments;
REVOKE SELECT, INSERT ON public.appointments FROM anon;

-- View mínima para disponibilidade (caso algum client anon precise no futuro)
CREATE OR REPLACE VIEW public.appointments_availability AS
SELECT
  id,
  professional_id,
  scheduled_at,
  duration_minutes,
  status
FROM public.appointments
WHERE status NOT IN ('cancelled', 'no_show');

GRANT SELECT ON public.appointments_availability TO anon;
GRANT SELECT ON public.appointments_availability TO authenticated;
