-- Analyst query runner — wraps arbitrary SELECT in JSON aggregation.
-- Called via supabaseAdmin.rpc() from the server only (service_role).
--
-- SIGURNOST (vidi SECURITY.md i migraciju 0004):
--  • EXECUTE samo za service_role — klijent (anon/authenticated) ne smije pozvati.
--  • SECURITY DEFINER zaobilazi RLS, pa funkcija sama tvrdo blokira osjetljive
--    objekte i sve write/DDL operacije (obrana u dubinu).
create or replace function execute_analyst_query(query_text text)
returns jsonb
language plpgsql
security definer
set search_path = public
set statement_timeout = '10s'
as $$
declare
  result jsonb;
begin
  -- Mora biti read-only SELECT (ili CTE koji počinje s WITH).
  if query_text !~* '^\s*(with|select)\s' then
    raise exception 'Only SELECT queries are allowed';
  end if;

  -- Eksplicitno zabranjeni osjetljivi objekti + write/DDL.
  if query_text ~* '\m(respondent_pii|app_users|visit_log|query_log|information_schema)\M'
     or query_text ~* '\mpg_'
     or query_text ~* '\mauth\.'
     or query_text ~* '\m(insert|update|delete|drop|alter|create|grant|revoke|truncate|copy|vacuum|reindex|comment|call)\M' then
    raise exception 'Query references disallowed objects';
  end if;

  execute format('select jsonb_agg(row_to_json(t)) from (%s) t', query_text) into result;
  return coalesce(result, '[]'::jsonb);
exception
  when others then
    raise exception 'Query error: %', sqlerrm;
end;
$$;

-- Samo server (service_role) smije pozvati ovu funkciju.
revoke all on function execute_analyst_query(text) from public;
revoke all on function execute_analyst_query(text) from anon;
revoke all on function execute_analyst_query(text) from authenticated;
grant execute on function execute_analyst_query(text) to service_role;
