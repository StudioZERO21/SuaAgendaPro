-- Anti-fraude de re-cadastro: bloqueia novo cadastro com telefone já usado.
-- Função SECURITY DEFINER que retorna apenas booleano (sem vazar dados),
-- chamável pelo anon (cadastro acontece deslogado).

create or replace function public.phone_in_use(p text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where regexp_replace(coalesce(phone, ''), '\D', '', 'g') = regexp_replace(coalesce(p, ''), '\D', '', 'g')
      and regexp_replace(coalesce(p, ''), '\D', '', 'g') <> ''
  );
$$;

revoke all on function public.phone_in_use(text) from public;
grant execute on function public.phone_in_use(text) to anon, authenticated;
