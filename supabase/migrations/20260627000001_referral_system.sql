-- Sistema de indicações (referral)
-- Cada profissional tem um link único; recompensa de 1 mês grátis após primeiro pagamento do indicado

-- ─── Tabela principal: links de indicação ────────────────────────────────────

CREATE TABLE public.referral_links (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code          text        NOT NULL UNIQUE,       -- igual ao slug do profissional
  is_active     boolean     NOT NULL DEFAULT true,
  expires_at    timestamptz DEFAULT NULL,           -- NULL = sem expiração
  max_uses      integer     DEFAULT NULL,           -- NULL = ilimitado
  total_clicks  integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_links_referrer_unique UNIQUE (referrer_id)
);

CREATE INDEX idx_referral_links_code     ON public.referral_links(code);
CREATE INDEX idx_referral_links_referrer ON public.referral_links(referrer_id);

-- ─── Tabela de conversões (cada uso do link) ─────────────────────────────────

CREATE TABLE public.referral_conversions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id           uuid        NOT NULL REFERENCES public.referral_links(id),
  referrer_id       uuid        NOT NULL REFERENCES public.profiles(id),
  referee_id        uuid        REFERENCES public.profiles(id),  -- preenchido após cadastro
  referee_email     text,
  clicked_at        timestamptz NOT NULL DEFAULT now(),
  registered_at     timestamptz,
  first_paid_at     timestamptz,
  reward_granted_at timestamptz,
  status            text        NOT NULL DEFAULT 'clicked'
                    CHECK (status IN ('clicked','registered','paid','rewarded')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_conversions_link     ON public.referral_conversions(link_id);
CREATE INDEX idx_referral_conversions_referee  ON public.referral_conversions(referee_id);
CREATE INDEX idx_referral_conversions_referrer ON public.referral_conversions(referrer_id);
CREATE INDEX idx_referral_conversions_status   ON public.referral_conversions(status);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.referral_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_links_select_own" ON public.referral_links
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "referral_links_admin" ON public.referral_links
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "referral_conversions_select_own" ON public.referral_conversions
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "referral_conversions_admin" ON public.referral_conversions
  FOR ALL USING (auth.role() = 'service_role');

-- ─── updated_at automático ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_referral_links_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_referral_links_updated_at
  BEFORE UPDATE ON public.referral_links
  FOR EACH ROW EXECUTE FUNCTION public.set_referral_links_updated_at();

-- ─── Auto-criar link ao criar perfil ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_referral_link_on_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.referral_links (referrer_id, code)
  VALUES (NEW.id, NEW.slug)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_referral_link
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_referral_link_on_profile();

-- ─── Criar links para perfis já existentes ───────────────────────────────────

INSERT INTO public.referral_links (referrer_id, code)
SELECT id, slug FROM public.profiles
ON CONFLICT DO NOTHING;
