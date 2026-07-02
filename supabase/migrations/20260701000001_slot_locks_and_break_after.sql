-- ============================================================
-- P0-B: slot_locks — previne double-booking
-- P1-C: break_after_minutes — pausa entre atendimentos
-- ============================================================

-- Tabela de travas temporárias de horário
CREATE TABLE IF NOT EXISTS public.slot_locks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  locked_date       DATE NOT NULL,
  locked_time       TIME NOT NULL,
  duration_minutes  INTEGER NOT NULL,
  held_until        TIMESTAMPTZ NOT NULL,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS slot_locks_lookup
  ON public.slot_locks (professional_id, locked_date, held_until);

-- RLS: anon pode inserir (booking público), service_role vê tudo
ALTER TABLE public.slot_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slot_locks_insert_anon"
  ON public.slot_locks FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "slot_locks_select_anon"
  ON public.slot_locks FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "slot_locks_delete_service"
  ON public.slot_locks FOR DELETE TO service_role
  USING (true);

GRANT SELECT, INSERT ON public.slot_locks TO anon;
GRANT SELECT, INSERT ON public.slot_locks TO authenticated;
GRANT ALL ON public.slot_locks TO service_role;

-- P1-C: coluna de pausa entre atendimentos
ALTER TABLE public.working_hours
  ADD COLUMN IF NOT EXISTS break_after_minutes INTEGER NOT NULL DEFAULT 0
    CONSTRAINT break_after_non_negative CHECK (break_after_minutes >= 0 AND break_after_minutes <= 120);

-- Atualiza get_available_slots para:
-- 1. Excluir slots travados (slot_locks com held_until > now())
-- 2. Incluir break_after_minutes no cálculo de conflito
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_professional_id UUID,
  p_date            DATE,
  p_duration_min    INTEGER DEFAULT 60,
  p_interval_min    INTEGER DEFAULT 30
)
RETURNS TABLE (slot_time TIME) AS $$
DECLARE
  wh            RECORD;
  slot          TIME;
  slot_end      TIME;
  is_occupied   BOOLEAN;
  is_locked     BOOLEAN;
BEGIN
  SELECT * INTO wh
  FROM public.working_hours
  WHERE professional_id = p_professional_id
    AND day_of_week = EXTRACT(DOW FROM p_date)::SMALLINT
    AND is_open = true;

  IF NOT FOUND THEN RETURN; END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocked_dates
    WHERE professional_id = p_professional_id AND blocked_date = p_date
  ) THEN RETURN; END IF;

  -- Também verificar schedule_blocks
  IF EXISTS (
    SELECT 1 FROM public.schedule_blocks
    WHERE professional_id = p_professional_id
      AND p_date::text >= start_date
      AND p_date::text <= end_date
  ) THEN RETURN; END IF;

  slot := wh.start_time;

  WHILE slot + (p_duration_min || ' minutes')::INTERVAL <= wh.end_time LOOP
    slot_end := slot + (p_duration_min || ' minutes')::INTERVAL;

    -- Pausa do almoço
    IF wh.break_start IS NOT NULL AND wh.break_end IS NOT NULL THEN
      IF slot < wh.break_end AND slot_end > wh.break_start THEN
        slot := slot + (p_interval_min || ' minutes')::INTERVAL;
        CONTINUE;
      END IF;
    END IF;

    -- Conflito com agendamentos existentes (inclui break_after_minutes)
    SELECT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.professional_id = p_professional_id
        AND a.scheduled_at::date = p_date
        AND a.status NOT IN ('cancelled', 'no_show')
        AND a.scheduled_at::time < slot_end
        AND (a.scheduled_at + ((a.duration_minutes + COALESCE(wh.break_after_minutes, 0)) || ' minutes')::INTERVAL)::time > slot
    ) INTO is_occupied;

    IF is_occupied THEN
      slot := slot + (p_interval_min || ' minutes')::INTERVAL;
      CONTINUE;
    END IF;

    -- Conflito com slot_locks ativos (held_until > now())
    SELECT EXISTS (
      SELECT 1 FROM public.slot_locks sl
      WHERE sl.professional_id = p_professional_id
        AND sl.locked_date = p_date
        AND sl.held_until > now()
        AND sl.locked_time < slot_end
        AND (sl.locked_time + (sl.duration_minutes || ' minutes')::INTERVAL)::time > slot
    ) INTO is_locked;

    IF NOT is_locked THEN
      slot_time := slot;
      RETURN NEXT;
    END IF;

    slot := slot + (p_interval_min || ' minutes')::INTERVAL;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_available_slots(UUID, DATE, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_slots(UUID, DATE, INTEGER, INTEGER) TO anon;

-- Limpa locks expirados (chamado pelo pg_cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_slot_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM public.slot_locks WHERE held_until < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
