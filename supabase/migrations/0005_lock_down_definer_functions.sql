-- 0005_lock_down_definer_functions.sql — SIGURNOSNA HIGIJENA
--
-- Supabase Security Advisor (lint 0028/0029) javlja da su SECURITY DEFINER
-- funkcije pozive preko PostgREST RPC-a (/rest/v1/rpc/...). Same po sebi nisu
-- rupa (vraćaju samo status pozivatelja), ali maknemo nepotrebnu izloženost.
--
-- VAŽNO: is_admin()/is_member() se koriste UNUTAR RLS policy-ja, pa EXECUTE za
-- `authenticated` MORA ostati — inače prijavljeni korisnik ne može čitati
-- questions/question_aggregates. Oduzimamo samo `anon` (nikad ne hita te policy-je).

-- handle_new_user: čista trigger funkcija — nitko je ne smije zvati izravno.
revoke all on function handle_new_user() from public;
revoke all on function handle_new_user() from anon;
revoke all on function handle_new_user() from authenticated;

-- is_admin / is_member: maknemo anon (0028), zadržimo authenticated (RLS ga treba).
revoke execute on function is_admin()  from anon;
revoke execute on function is_member() from anon;

-- Napomena: preostala 0029 upozorenja za is_admin/is_member su NAMJERNA i sigurna
-- (funkcije vraćaju samo status pozivatelja). Mogu se "dismiss"-ati u Advisoru.
