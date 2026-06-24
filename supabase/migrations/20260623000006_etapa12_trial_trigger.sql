-- Etapa 12.6 — Trigger: cria subscription trial ao inserir perfil
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    plan_id,
    status,
    trial_ends_at
  ) VALUES (
    NEW.id,
    'trial',
    'trial',
    now() + interval '7 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_trial_on_profile ON public.profiles;

CREATE TRIGGER trg_create_trial_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trial_subscription();
