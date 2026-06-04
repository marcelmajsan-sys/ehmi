# eCommerce Hrvatska Market Insights — CLAUDE.md

Aplikacija **eCommerce Hrvatska Market Insights** za prikaz rezultata istraživanja
"Istraživanje web trgovina 2026" (eCommerce Hrvatska) s login pristupom, dvije
uloge (admin / partner), uvodnim **Overview** tabom i chatom za korelacije.

Privremena domena: **ehmi.vercel.app**

> Ovaj file je izvor istine za Claude Code. Radi feature-po-feature redom iz
> sekcije 8 i commitaj nakon svakog koraka.

---

## 1. Uloge i pristup (KLJUČNO)

| Uloga    | Vidi                                                                 | Ne vidi                                        |
|----------|----------------------------------------------------------------------|------------------------------------------------|
| **admin**   | Sve: pojedinačni odgovori trgovina, PII, agregati, **chat/korelacije** | —                                              |
| **partner** | Samo **anonimizirane agregate** (grafovi po pitanju)                 | Pojedinačne odgovore trgovina, PII, chat       |

- Prvi admin: `marcel.majsan@gmail.com` (seeda se automatski na registraciju).
- Admin kreira ostale korisnike i bira im ulogu (admin ili partner).
- Partner login postoji, ali su podaci trgovina na razini ispitanika
  skriveni — partneri dobivaju isključivo zbirne rezultate.
- Zaštita je dvoslojna: **RLS u bazi** (primarno) + provjera uloge u
  middleware-u / route handlerima (UX). Nikad se ne oslanjaj samo na frontend.

## 2. Stack

- Next.js 14+ (App Router, TypeScript, Server Actions)
- Supabase (Postgres + Auth + RLS)
- Vercel (deploy) — privremena domena **ehmi.vercel.app**; GitHub (repo)
- Anthropic API (chat, samo admin) — provjeri aktualni model string
- Tailwind + recharts (ili chart.js) za grafove

## 3. Podaci — već pripremljeni

Sirovi CSV je očišćen i pretvoren u migracije skriptom `import_survey.py`.
Ne diraj ručno; ako stigne novi export, ponovo pokreni skriptu.

Generirani fileovi:
- `supabase/migrations/0001_schema.sql` — tablice, uloge, helperi, RLS  → **git**
- `supabase/migrations/0002_seed_data.sql` — anketni podaci bez PII       → **git**
- `supabase/seed_private.sql` — PII (email/ime/IP/URL)                    → **NIKAD u git**

Što je skripta napravila:
- Uklonila `"...\n\nScore: x/3"` sufikse iz svih vrijednosti.
- Klasificirala pitanja: 14 single-select, 17 multi-select, 2 slobodni tekst.
- PII (email, ime, prezime, IP, adresa webshopa) izdvojila u zasebnu,
  admin-only tablicu `respondent_pii`.

## 4. Shema baze

- **`app_users`** (`user_id`, `email`, `role` ∈ {admin, partner}, `created_by`) —
  tko ima pristup i s kojom ulogom.
- **`questions`** (`key`, `ordinal`, `label`, `type`, `options` jsonb) —
  metapodaci; koriste ih i UI i LLM (zna nazive pitanja i dozvoljene opcije).
- **`responses`** (1 red = 1 ispitanik) — single-select pitanja kao text stupci
  (npr. `q29_godisnji_bruto_promet_...`, `q02_imate_li_fizicku_poslovnicu`) +
  2 text stupca. **RLS: samo admin.**
- **`response_options`** (`respondent_id`, `question_key`, `option_value`) —
  long tablica za multi-select (jedan red po odabranoj opciji). **RLS: samo admin.**
- **`question_aggregates`** (`question_key`, `option_value`, `count`) —
  prebrojano, anonimno. **RLS: čita svaki prijavljeni (admin i partner).**
- **`respondent_pii`** (`respondent_id`, `email`, ..., `webshop_url`) —
  **RLS: samo admin**, izvan dosega chata.

Helper funkcije u bazi: `is_admin()`, `is_member()` (SECURITY DEFINER,
koriste se u RLS politikama).

## 5. Auth & upravljanje korisnicima

- Supabase Auth (email + password ili magic link).
- Trigger na `auth.users` automatski ubaci red u `app_users`; ako je email
  jednak bootstrap adminu → role `admin`, inače `partner`.
- Stranica `/admin/users` (samo admin):
  - lista korisnika i uloga,
  - "Dodaj korisnika" → Server Action: `supabaseAdmin.auth.admin.inviteUserByEmail`
    + postavi ulogu u `app_users` (`created_by = auth.uid()`). `service_role`
    ključ SAMO na serveru.
  - promjena uloge / deaktivacija (osim bootstrap admina).
- Middleware: sve osim `/login` traži sesiju; admin rute dodatno traže `is_admin`.

## 6. Stranice / tabovi

Glavna navigacija: **Overview · Pitanja · Istraži (admin) · Chat (admin) · Korisnici (admin)**

### 6.1 Overview (`/`) — vidljiv admin + partner
Uvodni, editorijalni prikaz po temama, kao narativni "Croatia eCommerce overview",
ali isključivo s **agregiranim** podacima iz istraživanja (iz `question_aggregates`,
nikad iz `responses`). Struktura:

- **Hero / top-line KPI kartice:** ukupno ispitanika (173), % s godišnjim prometom
  > 500.000 € (q29), % koji prodaje van RH (q01), % s fizičkom poslovnicom (q02),
  % koji koristi AI alate (q24).
- **Tematske sekcije** (svaka = kratki opisni odlomak + 1–2 grafa/“stat callout”
  iz agregata):
  1. **Profil trgovina:** promet `q29`, udio web trgovine u prodaji `q28`,
     broj proizvoda `q06`, prosječna košarica `q27`, mjesečni posjeti `q21`.
  2. **Platforme i hosting:** `q04` (platforma), `q05` (hosting) — top N + “ostalo”.
  3. **Plaćanje:** mogućnosti `q15`, gateway `q16`, najvažnije kod providera `q17`,
     izazovi naplate `q18`.
  4. **Dostava i logistika:** način dostave `q10`, naplata dostave `q12`,
     skladištenje `q13`, izazovi fulfillmenta `q14`, prednosti paketomata `q11`.
  5. **Marketing i kupci:** oglašavanje `q19`, kanali komunikacije `q20`,
     recenzije `q22`, fizičke poslovnice `q02`/`q03`.
  6. **Tehnologija i zajednica:** AI da/ne `q24`, za što AI `q25`,
     certifikacija `q23`, članstvo u udruzi `q30`.
- Opisni tekst sekcija je kuriran (statičan), a brojke se interpoliraju iz
  agregata — tako je uvijek točno i brzo, bez LLM poziva. Visok-kardinalna
  multi pitanja (hosting, kategorije, AI namjene) prikaži kao **Top 8 + “ostalo”**.
- Postotak = `count / Σ count po pitanju`.

### 6.2 Pitanja (`/pitanja`) — vidljiv admin + partner
Kartica po pitanju iz `questions` s grafom iz `question_aggregates` (pregled svih
pitanja, bez narativa).

### 6.3 Istraži (`/explore`) — SAMO admin
Tablica/filtri nad `responses` + join na `response_options` za uvid po ispitaniku.

### 6.4 Chat (`/chat`) — SAMO admin
Vidi sekciju 7.

### 6.5 Korisnici (`/admin/users`) — SAMO admin
Vidi sekciju 5.

## 7. Chat za korelacije — `/api/chat` (SAMO ADMIN)

Route handler na početku provjeri `is_admin()` (server-side); partner dobije 403.

Tijek (text-to-SQL):
1. Učitaj shemu iz `questions` (key → label → type → options) u system prompt,
   plus mapu: single-select = stupac u `responses`; multi-select = redovi u
   `response_options` (filtriraj `question_key` + `option_value`).
2. Pozovi Claude API → generira **jedan read-only PostgreSQL SELECT**.
3. Validacija prije izvršavanja:
   - mora počinjati sa `select`, jedan statement,
   - blacklist `insert|update|delete|drop|alter|create|grant|truncate|copy`,
   - izvrši kroz **read-only Postgres role** (ili RPC sa `SET TRANSACTION READ ONLY`),
     uz `statement_timeout` i `LIMIT`.
4. Drugi poziv Claudeu: proslijedi rezultat → odgovor na hrvatskom + brojevi.
5. `respondent_pii` NIKAD ne ulazi u shemu koju chat vidi.

Provjereni primjer (radi nad ovom shemom):
> "Koliko trgovina s prometom > 500.000 € ima fizičku poslovnicu?"
> → 55 trgovina s prometom > 500k; od toga 38 ima poslovnicu (DA), 16 nema, 1 planira.
```sql
select q02_imate_li_fizicku_poslovnicu, count(*)
from responses
where q29_godisnji_bruto_promet_vaseg_webshopa_izn
      in ('500.000 - 1.000.000 eura','Više od 1.000.000 eura')
group by 1;
```

> Anthropic API se NIKAD ne zove iz clienta. Ključ u Vercel env varijabli.
> Rate-limit `/api/chat` po korisniku da se ne troši budžet.

## 8. Tijek rada u Claude Code

1. `create-next-app` (TS, App Router, Tailwind) + Supabase klijent
   (browser + server) + middleware skeleton.
2. Primijeni migracije: `0001_schema.sql`, `0002_seed_data.sql`
   (`supabase db push` ili kroz SQL editor). PII učitaj lokalno:
   `supabase db execute --file supabase/seed_private.sql`. Dodaj
   `supabase/seed_private.sql` u `.gitignore`.
3. Auth flow: `/login`, middleware (sesija + uloga iz `app_users`).
4. **Overview tab** (`/`) iz `question_aggregates`: hero KPI + tematske sekcije
   (sekcija 6.1) + `/pitanja` pregled. Ovo je prvi vidljivi milestone na ehmi.vercel.app.
5. `/admin/users`: lista + invite + uloga + deaktivacija.
6. `/explore` (admin): tablica nad `responses` + join na `response_options`.
7. Chat `/api/chat` (admin-only, text-to-SQL po sekciji 7).
8. Polish, error handling, rate limit, deploy na Vercel.

## 9. Sigurnost (praksa kao na EventOrganizzeru)

- RLS uključen na SVIM tablicama u `public` schemi (već u `0001_schema.sql`).
- `service_role` ključ samo na serveru.
- Read-only role + blacklist + timeout + LIMIT za text-to-SQL.
- `seed_private.sql` (PII) nikad u git; razmotri brisanje/maskiranje IP-a ako
  nije potreban (GDPR — minimizacija podataka).
- Rate-limit na `/api/chat`.
