-- Avaliações do app feitas pelas profissionais
CREATE TABLE public.app_ratings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      INTEGER     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id),
  CONSTRAINT app_ratings_comment_len CHECK (comment IS NULL OR char_length(comment) <= 1000)
);

ALTER TABLE public.app_ratings ENABLE ROW LEVEL SECURITY;

-- Profissional pode ler/inserir/atualizar apenas sua própria avaliação
CREATE POLICY "app_ratings_own"
  ON public.app_ratings FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.app_ratings TO authenticated;
GRANT ALL ON public.app_ratings TO service_role;
