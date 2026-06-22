-- ============================================================
-- ETAPA 01 — Função de Disponibilidade de Horários
-- ============================================================

-- Retorna os slots disponíveis para um profissional em uma data,
-- dado um serviço com duração específica.
-- Usada tanto no booking público quanto na agenda interna.
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
BEGIN
  -- Buscar horário de funcionamento do dia da semana
  SELECT * INTO wh
  FROM public.working_hours
  WHERE professional_id = p_professional_id
    AND day_of_week = EXTRACT(DOW FROM p_date)::SMALLINT
    AND is_open = true;

  -- Se não há horário configurado para o dia, retorna vazio
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Se a data está bloqueada, retorna vazio
  IF EXISTS (
    SELECT 1 FROM public.blocked_dates
    WHERE professional_id = p_professional_id
      AND blocked_date = p_date
  ) THEN
    RETURN;
  END IF;

  -- Gerar slots do dia
  slot := wh.start_time;

  WHILE slot + (p_duration_min || ' minutes')::INTERVAL <= wh.end_time LOOP

    slot_end := slot + (p_duration_min || ' minutes')::INTERVAL;

    -- Verificar se slot conflita com a pausa
    IF wh.break_start IS NOT NULL AND wh.break_end IS NOT NULL THEN
      IF slot < wh.break_end AND slot_end > wh.break_start THEN
        slot := slot + (p_interval_min || ' minutes')::INTERVAL;
        CONTINUE;
      END IF;
    END IF;

    -- Verificar se o slot está ocupado por algum agendamento existente
    SELECT EXISTS (
      SELECT 1 FROM public.appointments
      WHERE professional_id = p_professional_id
        AND scheduled_at::date = p_date
        AND status NOT IN ('cancelled', 'no_show')
        AND scheduled_at::time < slot_end
        AND (scheduled_at + (duration_minutes || ' minutes')::INTERVAL)::time > slot
    ) INTO is_occupied;

    IF NOT is_occupied THEN
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

-- ------------------------------------------------------------
-- TRIGGER: criar notificação ao receber novo agendamento
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS TRIGGER AS $$
DECLARE
  client_name   TEXT;
  service_name  TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO client_name FROM public.clients WHERE id = NEW.client_id;
    SELECT name INTO service_name FROM public.services WHERE id = NEW.service_id;

    INSERT INTO public.notifications (user_id, type, title, body, appointment_id)
    VALUES (
      NEW.professional_id,
      'new_appointment',
      'Novo agendamento recebido! 🎉',
      client_name || ' agendou ' || service_name || ' para ' ||
        to_char(NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY às HH24:MI'),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER appointments_notify_new
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_appointment();
