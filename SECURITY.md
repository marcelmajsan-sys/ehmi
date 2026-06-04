# Sigurnosni model — eCommerce Hrvatska Market Insights

Cilj: **podaci ispitanika ankete, a posebno PII (`respondent_pii`), ne smiju se moći izvući** ni od neautenticiranih korisnika, ni od partnera, ni preko text-to-SQL alata.

Ovaj dokument opisuje model prijetnji, slojeve obrane i konkretne provjere koje treba pokrenuti nakon svake izmjene koja dira bazu, RLS, RPC funkcije ili API rute.

---

## 1. Klasifikacija podataka

| Razina | Tablice | Tko smije čitati |
|--------|---------|------------------|
| **PII (najosjetljivije)** | `respondent_pii` (email, ime, IP, webshop_url) | **samo server** (service_role) |
| **Pojedinačni odgovori** | `responses`, `response_options` | admin (preko service_role na admin stranicama) |
| **Operativni logovi** | `query_log`, `visit_log` | admin (preko service_role) |
| **Korisnici/uloge** | `app_users` | vlastiti red (RLS) + admin |
| **Agregati (partner-safe)** | `question_aggregates`, `questions` | svaki prijavljeni (admin + partner) |

> Slobodni "Ostalo" odgovori prikazani na `/pitanja` rekonstruiraju se na serveru iz `response_options` i vraćaju **agregirano** (bez `respondent_id`) — namjerno vidljivo i partnerima.

---

## 2. Model prijetnji

Napadač ima **javni `anon` ključ** (šalje se u browser, nije tajna) i može:
- pozivati PostgREST REST/RPC endpointe izravno (ne samo kroz našu aplikaciju),
- registrirati se ako su javni signupovi uključeni (postaje `partner`),
- slati proizvoljna pitanja u `/api/query` pokušavajući navesti Claude da generira SQL koji čita PII.

Glavni povijesni incident: `execute_analyst_query` je SECURITY DEFINER (zaobilazi RLS) i imao je `EXECUTE` za `anon`/`authenticated` → bilo tko je s javnim ključem mogao pročitati `respondent_pii`. Zatvoreno migracijom `0004` (vidi §4).

---

## 3. Slojevi obrane (defense in depth)

### Sloj A — RLS na svim tablicama (autoritativno)
- RLS uključen na **svim** tablicama u `public`.
- `respondent_pii`, `responses`, `response_options`, `query_log`, `visit_log`: politika samo `is_admin()`; `anon`/`partner` dobivaju 0 redaka.
- `questions`, `question_aggregates`: `is_member()` (svaki prijavljeni).
- `app_users`: vlastiti red ili admin.
- Helperi `is_admin()`/`is_member()` su SECURITY DEFINER i ovise o `auth.uid()` (za anon vraćaju `false`).

### Sloj B — Oduzeti grantovi (obrana u dubinu)
Iznad RLS-a, izravne privilegije su oduzete (`0004`):
- `anon`/`authenticated` nemaju **nikakav** pristup `respondent_pii`, `responses`, `response_options`, `query_log`, `visit_log`.
- Write privilegije (`insert/update/delete/truncate`) oduzete `anon`/`authenticated` na svim tablicama — svi write-ovi idu preko `service_role`.
- `questions`, `question_aggregates`, `app_users` zadržavaju samo `SELECT` (gate-a ih RLS).

### Sloj C — `execute_analyst_query` (text-to-SQL backstop)
- `EXECUTE` **samo `service_role`** — klijent ne može pozvati RPC izravno. Sav pristup ide kroz `/api/query`.
- In-function guard: dopušta samo `SELECT`/`WITH`; odbija `respondent_pii`, `app_users`, `auth.`, `pg_`, `information_schema`, log-tablice i sve write/DDL.
- `statement_timeout = 10s`.

### Sloj D — API sloj (`/api/query`)
- Provjera auth + uloge (`admin`/`partner`) prije bilo čega.
- Partner: system prompt samo `question_aggregates` + blacklist `responses|response_options`.
- Blacklist (svi): `insert|update|delete|drop|alter|create|grant|truncate|copy|respondent_pii`.
- `service_role` ključ samo na serveru; nikad u Client Componentama.

### Sloj E — Middleware / rute
- Neautenticirani → redirect na `/login`.
- `/admin/*` i `/chat` → samo `admin` (UX gate; prava zaštita je RLS).

---

## 4. Relevantne migracije

| Datoteka | Sadržaj |
|----------|---------|
| `0001_schema.sql` | Tablice, RLS politike, `is_admin()`/`is_member()`, trigger `handle_new_user` |
| `0003_activity_logs.sql` | `query_log`, `visit_log` (admin-only RLS) |
| `0004_secure_analyst_query.sql` | **Zaključavanje `execute_analyst_query` + hardening grantova** |
| `execute_analyst_query.sql` | Izvor funkcije (sinkroniziran s `0004`) |

---

## 5. Provjere nakon izmjena (regression checklist)

Pokreni nakon svake promjene koja dira bazu, RLS, `execute_analyst_query`, `/api/query`, ili dodavanja nove tablice/RPC-a. Koristi `SUPABASE_SERVICE_ROLE_KEY` i `NEXT_PUBLIC_SUPABASE_ANON_KEY` iz `.env.local`.

**Mora biti BLOKIRANO:**
1. `anon` poziva `execute_analyst_query(...)` → `permission denied for function`.
2. Kroz funkciju (i kao service_role): `select ... from respondent_pii` → `disallowed objects`.
3. Kroz funkciju: `app_users`, `auth.users`, `pg_*` → `disallowed objects`.
4. Kroz funkciju: write/DDL (`insert/update/delete/drop/...`, stacked `;`) → odbijeno.
5. `anon` izravni `select` na `respondent_pii`/`responses`/`response_options` → `permission denied` (ili 0 redaka).
6. Svaki **novi** RPC: provjeri `proacl` — ne smije imati `anon`/`authenticated` `EXECUTE` osim ako je dokazano siguran.
7. Svaka **nova** tablica s osjetljivim podacima: RLS uključen + politika + oduzeti grantovi anon/authenticated.

**Mora i dalje RADITI (preko service_role):**
8. `select ... from question_aggregates` (partner-agregati).
9. `select count(*) from responses` (admin pregledi).
10. "Ostalo" rekonstrukcija (`response_options` ⨝ `questions`).

Brza provjera `proacl` novog RPC-a:
```sql
select p.proname, p.prosecdef,
       pg_catalog.array_to_string(coalesce(p.proacl, array[]::aclitem[]),' | ') as acl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef;
```

---

## 6. Pravila pri razvoju

- **Nove SECURITY DEFINER funkcije**: po defaultu `revoke all ... from public, anon, authenticated;` pa `grant execute ... to service_role;` osim ako je javni pristup nužan i dokazano siguran.
- **Nove tablice**: odmah `enable row level security`, dodaj politiku, oduzmi anon/authenticated grantove za osjetljive podatke.
- **`respondent_pii` nikad** ne ide u Claude system prompt ni u odgovor klijentu.
- **`service_role` ključ** samo u Server Actions / route handlerima (`src/lib/supabase/admin.ts`) — nikad u `'use client'` komponenti.
- **Nova `/api/*` ruta** koja dira podatke: provjeri auth + ulogu prvom linijom.

---

## 7. Konfiguracija (Supabase Dashboard — izvan migracija)

- **Onemogući javnu registraciju** (Authentication → Sign In/Providers → Email → Enable Signup = off). Inače `handle_new_user` automatski daje `partner` ulogu svakom novom auth korisniku.
- **Rotiraj** `service_role` ključ / access tokene ako su ikad izloženi; ažuriraj `SUPABASE_SERVICE_ROLE_KEY` u Vercelu i `.env.local`.
- `.env.local` i `supabase/seed_private.sql` (PII) **nikad** u git.
