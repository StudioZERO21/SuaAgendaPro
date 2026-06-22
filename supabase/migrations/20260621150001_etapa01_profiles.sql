-- ============================================================
-- ETAPA 01 — Perfis de Profissionais
-- ============================================================

-- Garantir que update_updated_at_column já existe (pode ter sido criada antes)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ------------------------------------------------------------
-- TABELA: profiles
-- ------------------------------------------------------------
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slug            TEXT UNIQUE NOT NULL,
  display_name    TEXT NOT NULL DEFAULT '',
  bio             TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  cover_url       TEXT,
  city            TEXT,
  state           TEXT,
  specialty       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  -- personalização (usada na etapa 11)
  theme_color     TEXT NOT NULL DEFAULT '#ec4899',
  show_prices     BOOLEAN NOT NULL DEFAULT true,
  show_portfolio  BOOLEAN NOT NULL DEFAULT true,
  accept_online   BOOLEAN NOT NULL DEFAULT true,
  cancellation_policy TEXT,
  welcome_message TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9\-]{2,48}[a-z0-9]$'),
  CONSTRAINT profiles_phone_len CHECK (phone IS NULL OR char_length(phone) <= 20),
  CONSTRAINT profiles_display_name_len CHECK (char_length(display_name) <= 120),
  CONSTRAINT profiles_bio_len CHECK (bio IS NULL OR char_length(bio) <= 600),
  CONSTRAINT profiles_city_len CHECK (city IS NULL OR char_length(city) <= 80),
  CONSTRAINT profiles_state_len CHECK (state IS NULL OR char_length(state) <= 2)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profissional vê e edita apenas o próprio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Qualquer um pode ler perfis públicos pelo slug (para booking)
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- TRIGGER: criar profile automaticamente após signup
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter   INTEGER := 0;
BEGIN
  -- Gerar slug base a partir do email (parte antes do @)
  base_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  -- Garantir tamanho mínimo
  IF char_length(base_slug) < 4 THEN
    base_slug := base_slug || '-pro';
  END IF;
  -- Truncar para caber o sufixo
  base_slug := substring(base_slug FROM 1 FOR 40);
  final_slug := base_slug;

  -- Garantir unicidade do slug
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, slug, display_name)
  VALUES (
    NEW.id,
    final_slug,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
