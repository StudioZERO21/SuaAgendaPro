-- ============================================================
-- ETAPA 01 — Seed de Dados para Desenvolvimento
-- ============================================================
-- ATENÇÃO: Este seed só deve ser aplicado em ambiente local/dev.
-- Usa UUIDs fixos para facilitar testes reproduzíveis.

DO $$
DECLARE
  v_user_id     UUID := '00000000-0000-0000-0000-000000000001';
  v_profile_id  UUID := '00000000-0000-0000-0000-000000000001';

  v_svc_manicure   UUID := '10000000-0000-0000-0000-000000000001';
  v_svc_pedicure   UUID := '10000000-0000-0000-0000-000000000002';
  v_svc_sobrancelha UUID := '10000000-0000-0000-0000-000000000003';
  v_svc_hidratacao UUID := '10000000-0000-0000-0000-000000000004';
  v_svc_progressiva UUID := '10000000-0000-0000-0000-000000000005';

  v_client_1    UUID := '20000000-0000-0000-0000-000000000001';
  v_client_2    UUID := '20000000-0000-0000-0000-000000000002';
  v_client_3    UUID := '20000000-0000-0000-0000-000000000003';
  v_client_4    UUID := '20000000-0000-0000-0000-000000000004';
  v_client_5    UUID := '20000000-0000-0000-0000-000000000005';
  v_client_6    UUID := '20000000-0000-0000-0000-000000000006';
  v_client_7    UUID := '20000000-0000-0000-0000-000000000007';
  v_client_8    UUID := '20000000-0000-0000-0000-000000000008';
  v_client_9    UUID := '20000000-0000-0000-0000-000000000009';
  v_client_10   UUID := '20000000-0000-0000-0000-000000000010';
BEGIN

  -- --------------------------------------------------------
  -- Usuário de teste no auth.users
  -- --------------------------------------------------------
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    is_super_admin,
    is_sso_user,
    is_anonymous,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'joana@suaagenda.dev',
    crypt('senha123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name": "Joana Beleza"}'::jsonb,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '',
    false,
    false,
    false,
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;

  -- O trigger handle_new_user cria o profile automaticamente,
  -- mas pode já existir se rodado duas vezes — usamos ON CONFLICT
  UPDATE public.profiles SET
    slug             = 'joana-beleza',
    display_name     = 'Joana Beleza',
    bio              = 'Especialista em unhas e estética com 8 anos de experiência. Atendo com carinho e dedicação! 💅',
    phone            = '11999990001',
    city             = 'São Paulo',
    state            = 'SP',
    specialty        = 'Manicure e Pedicure',
    is_active        = true,
    onboarding_completed = true
  WHERE id = v_profile_id;

  -- --------------------------------------------------------
  -- Serviços
  -- --------------------------------------------------------
  INSERT INTO public.services (id, professional_id, name, description, duration_minutes, price_cents, deposit_type, deposit_value, is_active)
  VALUES
    (v_svc_manicure,   v_profile_id, 'Manicure Completa',     'Cutícula, esmaltação gel e acabamento premium', 60,  5000, 'percent', 50, true),
    (v_svc_pedicure,   v_profile_id, 'Pedicure Completa',     'Tratamento completo dos pés com esfoliação',    75,  6000, 'percent', 50, true),
    (v_svc_sobrancelha,v_profile_id, 'Design de Sobrancelhas','Modelagem com linha e henna',                   30,  4500, 'none',    0,  true),
    (v_svc_hidratacao, v_profile_id, 'Hidratação Capilar',    'Máscara reconstrutora com finalização',         90,  8000, 'percent', 30, true),
    (v_svc_progressiva,v_profile_id, 'Progressiva Premium',   'Alisamento com proteção e brilho intenso',     150, 15000, 'fixed', 5000, true)
  ON CONFLICT (id) DO NOTHING;

  -- --------------------------------------------------------
  -- Horários de funcionamento (Segunda a Sábado, 9h–18h)
  -- --------------------------------------------------------
  INSERT INTO public.working_hours (professional_id, day_of_week, is_open, start_time, end_time, break_start, break_end)
  VALUES
    (v_profile_id, 0, false, NULL,    NULL,    NULL,    NULL),    -- Domingo
    (v_profile_id, 1, true,  '09:00', '18:00', '12:00', '13:00'), -- Segunda
    (v_profile_id, 2, true,  '09:00', '18:00', '12:00', '13:00'), -- Terça
    (v_profile_id, 3, true,  '09:00', '18:00', '12:00', '13:00'), -- Quarta
    (v_profile_id, 4, true,  '09:00', '18:00', '12:00', '13:00'), -- Quinta
    (v_profile_id, 5, true,  '09:00', '18:00', '12:00', '13:00'), -- Sexta
    (v_profile_id, 6, true,  '09:00', '14:00', NULL,    NULL)     -- Sábado (meio período)
  ON CONFLICT (professional_id, day_of_week) DO NOTHING;

  -- --------------------------------------------------------
  -- Clientes
  -- --------------------------------------------------------
  INSERT INTO public.clients (id, professional_id, name, phone, email, notes)
  VALUES
    (v_client_1,  v_profile_id, 'Ana Clara Souza',     '11999990001', 'ana@email.com',    'Prefere esmalte nude'),
    (v_client_2,  v_profile_id, 'Beatriz Lima',        '11999990002', 'bea@email.com',    NULL),
    (v_client_3,  v_profile_id, 'Carla Mendes',        '11999990003', NULL,               'Alérgica a acetona'),
    (v_client_4,  v_profile_id, 'Daniela Ferreira',    '11999990004', 'dani@email.com',   NULL),
    (v_client_5,  v_profile_id, 'Eduarda Rocha',       '11999990005', NULL,               'Adora cores vibrantes'),
    (v_client_6,  v_profile_id, 'Fernanda Alves',      '11999990006', 'fer@email.com',    NULL),
    (v_client_7,  v_profile_id, 'Gabriela Oliveira',   '11999990007', NULL,               NULL),
    (v_client_8,  v_profile_id, 'Helena Costa',        '11999990008', 'hele@email.com',   NULL),
    (v_client_9,  v_profile_id, 'Isabela Martins',     '11999990009', NULL,               NULL),
    (v_client_10, v_profile_id, 'Julia Santos',        '11999990010', 'ju@email.com',     NULL)
  ON CONFLICT (id) DO NOTHING;

  -- --------------------------------------------------------
  -- Agendamentos — próximos 30 dias
  -- --------------------------------------------------------
  INSERT INTO public.appointments (professional_id, client_id, service_id, scheduled_at, duration_minutes, status, price_cents, deposit_cents, deposit_paid)
  VALUES
    -- Hoje
    (v_profile_id, v_client_1,  v_svc_manicure,    now()::date + '09:00'::time, 60,  'confirmed', 5000, 2500, true),
    (v_profile_id, v_client_2,  v_svc_pedicure,    now()::date + '10:30'::time, 75,  'confirmed', 6000, 3000, true),
    (v_profile_id, v_client_3,  v_svc_sobrancelha, now()::date + '13:00'::time, 30,  'pending',   4500, 0,    false),
    (v_profile_id, v_client_4,  v_svc_manicure,    now()::date + '14:00'::time, 60,  'confirmed', 5000, 2500, false),
    (v_profile_id, v_client_5,  v_svc_hidratacao,  now()::date + '15:30'::time, 90,  'pending',   8000, 2400, false),

    -- Amanhã
    (v_profile_id, v_client_6,  v_svc_manicure,    now()::date + 1 + '09:00'::time, 60,  'confirmed', 5000, 2500, true),
    (v_profile_id, v_client_7,  v_svc_sobrancelha, now()::date + 1 + '11:00'::time, 30,  'confirmed', 4500, 0,    false),
    (v_profile_id, v_client_8,  v_svc_progressiva, now()::date + 1 + '13:00'::time, 150, 'confirmed', 15000,5000, true),

    -- Esta semana
    (v_profile_id, v_client_9,  v_svc_pedicure,    now()::date + 2 + '10:00'::time, 75,  'pending',  6000, 3000, false),
    (v_profile_id, v_client_10, v_svc_manicure,    now()::date + 2 + '14:00'::time, 60,  'pending',  5000, 2500, false),
    (v_profile_id, v_client_1,  v_svc_hidratacao,  now()::date + 3 + '09:00'::time, 90,  'confirmed',8000, 2400, true),
    (v_profile_id, v_client_2,  v_svc_manicure,    now()::date + 3 + '11:30'::time, 60,  'confirmed',5000, 2500, true),
    (v_profile_id, v_client_3,  v_svc_pedicure,    now()::date + 4 + '09:00'::time, 75,  'pending',  6000, 3000, false),
    (v_profile_id, v_client_4,  v_svc_sobrancelha, now()::date + 4 + '14:00'::time, 30,  'confirmed',4500, 0,    false),

    -- Próxima semana
    (v_profile_id, v_client_5,  v_svc_progressiva, now()::date + 7 + '10:00'::time, 150, 'confirmed',15000,5000, true),
    (v_profile_id, v_client_6,  v_svc_manicure,    now()::date + 7 + '14:00'::time, 60,  'pending',  5000, 2500, false),
    (v_profile_id, v_client_7,  v_svc_pedicure,    now()::date + 8 + '09:00'::time, 75,  'confirmed',6000, 3000, true),
    (v_profile_id, v_client_8,  v_svc_hidratacao,  now()::date + 8 + '13:00'::time, 90,  'pending',  8000, 2400, false),

    -- Agendamentos passados (para analytics)
    (v_profile_id, v_client_9,  v_svc_manicure,    now()::date - 1 + '09:00'::time, 60,  'completed',5000, 2500, true),
    (v_profile_id, v_client_10, v_svc_sobrancelha, now()::date - 1 + '11:00'::time, 30,  'completed',4500, 0,    false),
    (v_profile_id, v_client_1,  v_svc_pedicure,    now()::date - 2 + '10:00'::time, 75,  'completed',6000, 3000, true),
    (v_profile_id, v_client_2,  v_svc_progressiva, now()::date - 3 + '09:00'::time, 150, 'completed',15000,5000, true),
    (v_profile_id, v_client_3,  v_svc_manicure,    now()::date - 4 + '14:00'::time, 60,  'cancelled',5000, 2500, false),
    (v_profile_id, v_client_4,  v_svc_hidratacao,  now()::date - 5 + '09:00'::time, 90,  'completed',8000, 2400, true),
    (v_profile_id, v_client_5,  v_svc_manicure,    now()::date - 7 + '10:00'::time, 60,  'completed',5000, 2500, true),
    (v_profile_id, v_client_6,  v_svc_sobrancelha, now()::date - 7 + '14:00'::time, 30,  'no_show',  4500, 0,    false),
    (v_profile_id, v_client_7,  v_svc_pedicure,    now()::date -10 + '09:00'::time, 75,  'completed',6000, 3000, true),
    (v_profile_id, v_client_8,  v_svc_manicure,    now()::date -14 + '11:00'::time, 60,  'completed',5000, 2500, true),
    (v_profile_id, v_client_9,  v_svc_hidratacao,  now()::date -21 + '09:00'::time, 90,  'completed',8000, 2400, true),
    (v_profile_id, v_client_10, v_svc_manicure,    now()::date -28 + '10:00'::time, 60,  'completed',5000, 2500, false)
  ON CONFLICT DO NOTHING;

  -- Atualizar stats dos clientes manualmente para os completed (trigger só roda no UPDATE)
  UPDATE public.clients SET
    total_appointments = 3, total_spent_cents = 16000,
    last_appointment_at = now()::date - 2 + '10:00'::time
  WHERE id = v_client_1;
  UPDATE public.clients SET
    total_appointments = 2, total_spent_cents = 20000,
    last_appointment_at = now()::date - 3 + '09:00'::time
  WHERE id = v_client_2;
  UPDATE public.clients SET
    total_appointments = 1, total_spent_cents = 6000,
    last_appointment_at = now()::date - 1 + '10:00'::time -- pedicure no dia -2 no INSERT
  WHERE id = v_client_3;
  UPDATE public.clients SET
    total_appointments = 2, total_spent_cents = 13000,
    last_appointment_at = now()::date - 5 + '09:00'::time
  WHERE id = v_client_4;
  UPDATE public.clients SET
    total_appointments = 2, total_spent_cents = 20000,
    last_appointment_at = now()::date - 7 + '10:00'::time
  WHERE id = v_client_5;
  UPDATE public.clients SET
    total_appointments = 1, total_spent_cents = 6000,
    last_appointment_at = now()::date -10 + '09:00'::time
  WHERE id = v_client_7;
  UPDATE public.clients SET
    total_appointments = 2, total_spent_cents = 11000,
    last_appointment_at = now()::date -14 + '11:00'::time
  WHERE id = v_client_8;
  UPDATE public.clients SET
    total_appointments = 2, total_spent_cents = 13000,
    last_appointment_at = now()::date -21 + '09:00'::time
  WHERE id = v_client_9;
  UPDATE public.clients SET
    total_appointments = 2, total_spent_cents = 10000,
    last_appointment_at = now()::date -28 + '10:00'::time
  WHERE id = v_client_10;

  RAISE NOTICE 'Seed aplicado com sucesso! Usuário: joana@suaagenda.dev / senha123';
END $$;
