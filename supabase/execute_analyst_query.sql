-- Analyst query runner — wraps arbitrary SELECT in JSON aggregation.
-- Called via supabaseAdmin.rpc() from the /api/query route (server-only).
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
  execute format(
    'select jsonb_agg(row_to_json(t)) from (%s) t',
    query_text
  ) into result;
  return coalesce(result, '[]'::jsonb);
exception
  when others then
    raise exception 'Query error: %', sqlerrm;
end;
$$;
