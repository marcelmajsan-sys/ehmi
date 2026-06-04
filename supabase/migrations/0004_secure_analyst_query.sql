-- 0004_secure_analyst_query.sql — SIGURNOSNI POPRAVAK
--
-- Problem: execute_analyst_query je SECURITY DEFINER (zaobilazi RLS) i EXECUTE je
-- imao PUBLIC/anon/authenticated. Posljedica: bilo tko s javnim anon ključem mogao
-- je pozvati RPC i pročitati respondent_pii (email, IP, webshop_url) zaobilazeći RLS.
--
-- Popravak:
--  1) EXECUTE samo za service_role (poziva se isključivo sa servera preko supabaseAdmin).
--  2) Tvrdi guard unutar funkcije: samo SELECT/WITH, blokirane osjetljive tablice/sheme.

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

  -- Obrana u dubinu: funkcija zaobilazi RLS, pa eksplicitno zabranjujemo
  -- pristup osjetljivim objektima i sve write/DDL operacije.
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

-- Samo server (service_role) smije pozvati ovu funkciju. Klijenti (anon/authenticated)
-- nikako — sav legitiman pristup ide kroz /api/query (auth + uloga + validacija).
revoke all on function execute_analyst_query(text) from public;
revoke all on function execute_analyst_query(text) from anon;
revoke all on function execute_analyst_query(text) from authenticated;
grant execute on function execute_analyst_query(text) to service_role;

-- ============ HARDENING TABLE GRANTS (obrana u dubinu) ============
-- Klijent (anon/authenticated) nikad ne piše u tablice — svi write-ovi idu
-- preko service_role (Server Actions / API rute). Oduzmi write privilegije.
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke insert, update, delete, truncate on all tables in schema public from authenticated;

-- Ove tablice klijent nikad ne čita izravno (admin ih dohvaća preko service_role,
-- a RLS ionako odbija anon/partner). Oduzmi SVE — PII i osjetljivi podaci ostaju
-- dostupni isključivo serveru.
revoke all on respondent_pii   from anon, authenticated;
revoke all on responses        from anon, authenticated;
revoke all on response_options from anon, authenticated;
revoke all on query_log        from anon, authenticated;
revoke all on visit_log        from anon, authenticated;
-- questions, question_aggregates, app_users zadržavaju SELECT (čitaju ih partneri
-- i middleware kroz RLS), ali bez write privilegija (gore oduzeto).
