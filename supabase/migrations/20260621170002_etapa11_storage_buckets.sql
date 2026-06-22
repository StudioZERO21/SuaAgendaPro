-- ============================================================
-- ETAPA 11 — Supabase Storage: buckets e políticas
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',   'avatars',   true, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('portfolio', 'portfolio', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('covers',    'covers',    true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- avatars
CREATE POLICY IF NOT EXISTS "avatars_upload_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "avatars_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "avatars_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "avatars_read_public"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- portfolio
CREATE POLICY IF NOT EXISTS "portfolio_upload_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "portfolio_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "portfolio_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "portfolio_read_public"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'portfolio');

-- covers
CREATE POLICY IF NOT EXISTS "covers_upload_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "covers_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "covers_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "covers_read_public"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'covers');
