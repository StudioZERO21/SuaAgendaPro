-- Telefone repetido: cadastra mas SEM trial (entra suspenso). Super admin libera depois.

-- 1) handle_new_user passa a copiar o phone do metadata para o profile
--    (assim o trigger de trial consegue detectar reuso no momento da criação).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter   INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  IF char_length(base_slug) < 4 THEN
    base_slug := base_slug || '-pro';
  END IF;
  base_slug := substring(base_slug FROM 1 FOR 40);
  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, slug, display_name, phone)
  VALUES (
    NEW.id,
    final_slug,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  );

  RETURN NEW;
END;
$$;

-- 2) create_trial_subscription: se o telefone já foi usado por outro perfil,
--    cria a assinatura SUSPENSA (sem trial). Caso contrário, trial normal (7 dias).
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  phone_norm text;
  reused boolean := false;
BEGIN
  phone_norm := regexp_replace(coalesce(NEW.phone, ''), '\D', '', 'g');
  IF phone_norm <> '' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id <> NEW.id
        AND regexp_replace(coalesce(phone, ''), '\D', '', 'g') = phone_norm
    ) INTO reused;
  END IF;

  IF reused THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status, trial_ends_at, notes)
    VALUES (NEW.id, 'trial', 'suspended', NULL, 'Reentrada: telefone já usado — trial bloqueado')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.subscriptions (user_id, plan_id, status, trial_ends_at)
    VALUES (NEW.id, 'trial', 'trial', now() + interval '7 days')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
