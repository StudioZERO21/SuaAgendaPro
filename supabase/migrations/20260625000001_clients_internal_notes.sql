-- Adiciona coluna internal_notes na tabela clients
-- Campo privado da profissional, não exposto ao cliente

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD CONSTRAINT clients_internal_notes_len
    CHECK (internal_notes IS NULL OR char_length(internal_notes) <= 1000);
