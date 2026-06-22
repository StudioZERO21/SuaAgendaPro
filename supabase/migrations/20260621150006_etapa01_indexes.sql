-- ============================================================
-- ETAPA 01 — Índices de Performance
-- ============================================================

-- profiles
CREATE INDEX profiles_slug_idx ON public.profiles (slug);
CREATE INDEX profiles_is_active_idx ON public.profiles (is_active) WHERE is_active = true;

-- services
CREATE INDEX services_professional_active_idx
  ON public.services (professional_id, is_active);

-- working_hours
CREATE INDEX working_hours_professional_idx
  ON public.working_hours (professional_id, day_of_week);

-- blocked_dates
CREATE INDEX blocked_dates_professional_date_idx
  ON public.blocked_dates (professional_id, blocked_date);

-- clients
CREATE INDEX clients_professional_name_idx
  ON public.clients (professional_id, name);

CREATE INDEX clients_professional_phone_idx
  ON public.clients (professional_id, phone);

-- appointments — os mais críticos para performance
CREATE INDEX appointments_professional_scheduled_idx
  ON public.appointments (professional_id, scheduled_at);

CREATE INDEX appointments_professional_status_idx
  ON public.appointments (professional_id, status);

CREATE INDEX appointments_professional_date_idx
  ON public.appointments (professional_id, (scheduled_at::date));

CREATE INDEX appointments_client_idx
  ON public.appointments (client_id);

-- notifications
CREATE INDEX notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

-- portfolio_items
CREATE INDEX portfolio_professional_order_idx
  ON public.portfolio_items (professional_id, order_index);
