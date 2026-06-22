UPDATE auth.users SET
  instance_id            = '00000000-0000-0000-0000-000000000000',
  raw_app_meta_data      = '{"provider":"email","providers":["email"]}'::jsonb,
  raw_user_meta_data     = '{"full_name":"Joana Beleza"}'::jsonb,
  confirmation_token     = '',
  recovery_token         = '',
  email_change_token_new = '',
  email_change           = '',
  is_super_admin         = false,
  is_sso_user            = false,
  is_anonymous           = false,
  updated_at             = now()
WHERE email = 'joana@suaagenda.dev';

SELECT id, email, instance_id, raw_app_meta_data FROM auth.users WHERE email = 'joana@suaagenda.dev';
