CREATE TABLE public.special_access_grants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by  TEXT NOT NULL,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at  TIMESTAMPTZ,
  revoked_by  TEXT
);

CREATE INDEX special_access_grants_user_idx    ON public.special_access_grants (user_id)    WHERE revoked_at IS NULL;
CREATE INDEX special_access_grants_grantor_idx ON public.special_access_grants (granted_by) WHERE revoked_at IS NULL;

ALTER TABLE public.special_access_grants ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.special_access_grants TO service_role;
