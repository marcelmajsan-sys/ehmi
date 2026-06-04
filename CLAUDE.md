# eCommerce Hrvatska Market Insights — CLAUDE.md

Aplikacija za prikaz rezultata istraživanja "Istraživanje web trgovina 2026" (eCommerce Hrvatska).
Login pristup, dvije uloge (admin / partner), višejezično sučelje (HR/EN).

**Live:** https://research.ecommerce.hr  
**Backup:** https://ehmi.vercel.app  
**Repo:** https://github.com/marcelmajsan-sys/ehmi

> Ovaj file je izvor istine za Claude Code. Radi feature-po-feature i commitaj nakon svakog koraka.

---

## 1. Uloge i pristup

| Uloga    | Tabovi                                                        |
|----------|---------------------------------------------------------------|
| **admin**   | Sažetak · Svi rezultati · Istraži korelacije · Korisnici · Postavke |
| **partner** | Sažetak · Svi rezultati · Istraži korelacije (samo agregati)  |

- Zaštita: **RLS u bazi** (primarno) + middleware route-gating (UX).
- Prvi admin: `marcel.majsan@gmail.com` — trigger dodjeljuje ulogu automatski.
- Admini kreiraju korisnike u `/admin/settings`.

## 2. Stack

- **Next.js 16** (App Router, TypeScript, Tailwind, `src/`, `vercel.json` s `"framework":"nextjs"`)
- **Supabase** (Postgres + Auth + RLS) — projekt `titurqsqvgkwkbmzzujq`
- **Vercel** — automatski deploy iz GitHub `main` grane
- **Anthropic API** — `claude-sonnet-4-6`, text-to-SQL na `/api/query`
- **recharts** — grafovi u Overview i Svi rezultati

## 3. Env varijable

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=          # legacy JWT key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # novi sb_publishable_... key
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

Postavljene na Vercelu (Production + Preview) i lokalno u `.env.local`.

## 4. Shema baze

| Tablica | Opis | RLS |
|---------|------|-----|
| `app_users` | user_id, email, role (admin/partner), created_by | vlastiti red + admin vidi sve |
| `questions` | key, ordinal, label, type, options jsonb | čita svaki prijavljeni |
| `responses` | 1 red = 1 ispitanik, single-select stupci | **samo admin** |
| `response_options` | respondent_id, question_key, option_value (multi-select) | **samo admin** |
| `question_aggregates` | question_key, option_value, count | čita svaki prijavljeni |
| `respondent_pii` | email, ime, IP, webshop_url | **samo admin** |

Helper funkcije: `is_admin()`, `is_member()` (SECURITY DEFINER).  
RPC funkcija: `execute_analyst_query(query_text text) returns jsonb` — izvršava read-only SQL bez PostgREST row-limit ograničenja.

## 5. Stranice

### Sažetak (`/`) — admin + partner
- 5 hero KPI kartica: Ispitanika · Promet>500k€ · Posjeti>100k/mj · Prodaju van RH · Imaju poslovnicu
- 6 tematskih sekcija s opisnim tekstom + recharts grafovi iz `question_aggregates`
- Sekcije: Profil · Platforme i hosting · Plaćanje · Dostava · Marketing · Tehnologija

### Svi rezultati (`/pitanja`) — admin + partner
- Grid kartica po pitanju s grafom iz `question_aggregates`
- Pie za ≤4 opcije, Bar za više

### Istraži korelacije (`/explore`) — admin + partner
- Text-to-SQL via Claude API → `/api/query`
- Admin: puni pristup (`responses`, `response_options`, `question_aggregates`)
- Partner: samo `question_aggregates`
- 4 primjera korelacija kao kliktabilne kartice
- Prikazuje: analiza (tekst) + tablica podataka + SQL (collapsible)
- SQL validacija: blacklist `respondent_pii`, destructive statements; za partnera + blacklist `responses`/`response_options`

### Korisnici (`/admin/users`) — samo admin
- Tablica 173 ispitanika s filtri: Promet · Posjeti · Košarica · Član udruge
- Pretraga po email/URL
- Klik na red → prošireni prikaz SVIH odgovora Q1–Q30 (Q31 skriven)
- Multi-select odgovori iz `response_options` — učitava se via RPC (zaobilazi PostgREST 1000-row cap)

### Postavke (`/admin/settings`) — samo admin
- Forma za dodavanje korisnika: email + privremena lozinka + uloga (Admin/Partner)
- Lista svih korisnika s ulogom i datumom kreiranja

## 6. i18n (HR/EN)

- `src/translations/index.ts` — UI stringovi (nav, KPI labeli, sekcijski opisi)
- `src/translations/survey-data.ts` — mapa opcija ankete HR→EN + nazivi pitanja
- `src/lib/lang-context.tsx` — cookie-based, default **HR**
- Toggle EN|HR u navigaciji, pamti se u cookieju (`ehmi_lang`)

## 7. API rute

### POST `/api/query`
- Auth check: prijavljeni korisnik s rolom (admin ili partner)
- Učitava schema iz `questions` tablice
- Claude generira SQL → validacija → `execute_analyst_query` RPC → Claude formatira odgovor
- Partner: ograničeni system prompt (samo `question_aggregates`) + SQL blacklist

## 8. Navigacija

Logo (SVG chart ikona + naziv) → klik vodi na `/`  
Stavke: **Sažetak · Svi rezultati · Istraži korelacije** (svi) | **Korisnici · Postavke** (admin)  
Mobile: hamburger meni (≥768px desktop layout)

## 9. Sigurnost

- RLS na SVIM tablicama
- `service_role` ključ samo na serveru (Server Actions, `/api/query`, `/admin/settings`)
- `respondent_pii` nikad u Claude system promptu
- SQL blacklist: `insert|update|delete|drop|alter|create|grant|truncate|copy|respondent_pii`
- `seed_private.sql` nikad u gitu (`.gitignore`)

## 10. Migracije i seed

```
supabase/migrations/0001_schema.sql     # tablice, RLS, trigeri → git
supabase/migrations/0002_seed_data.sql  # pitanja, odgovori, agregati → git
supabase/seed_private.sql              # PII → NIKAD u git
supabase/execute_analyst_query.sql     # RPC funkcija → git
```

Primjena: `npx supabase db push --linked` (token u `SUPABASE_ACCESS_TOKEN`)

## 11. Sljedeći milestoni

- `/admin/users` — promjena uloge / deaktivacija korisnika
- `/explore` — rate limiting po korisniku
- `/explore` — povijest upita (conversation memory)
- Polish: error boundaries, loading skeletons
