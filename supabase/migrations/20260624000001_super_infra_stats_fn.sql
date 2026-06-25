-- Função usada pelo super admin para monitorar métricas de infraestrutura do Supabase.
-- Executa com SECURITY DEFINER para poder acessar pg_stat_* e auth.users.
CREATE OR REPLACE FUNCTION public.get_infra_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'db_bytes',           pg_database_size(current_database()),
    'auth_users',         (SELECT COUNT(*) FROM auth.users),
    'total_connections',  (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()),
    'active_connections', (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active'),
    'idle_connections',   (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle'),
    'tables', (
      SELECT COALESCE(json_agg(t ORDER BY t.total_bytes DESC), '[]'::json)
      FROM (
        SELECT
          s.relname                            AS table_name,
          s.n_live_tup                         AS row_count,
          pg_total_relation_size(s.relid)      AS total_bytes
        FROM pg_stat_user_tables s
        WHERE s.schemaname = 'public'
        ORDER BY total_bytes DESC
        LIMIT 15
      ) t
    ),
    'buckets', (
      SELECT COALESCE(json_agg(b ORDER BY b.size_bytes DESC), '[]'::json)
      FROM (
        SELECT
          bk.name                                                             AS bucket,
          COUNT(o.id)                                                         AS file_count,
          COALESCE(SUM((o.metadata->>'size')::bigint), 0)                    AS size_bytes
        FROM storage.buckets bk
        LEFT JOIN storage.objects o ON o.bucket_id = bk.id
        GROUP BY bk.name
      ) b
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Apenas super admins com service role podem chamar
REVOKE ALL ON FUNCTION public.get_infra_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_infra_stats() TO service_role;
