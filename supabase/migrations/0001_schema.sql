-- 0001_schema.sql  (generirano import_survey.py) — SIGURNO za git
-- Tablice + uloge (admin/partner) + RLS.

create extension if not exists "pgcrypto";

-- ============ KORISNICI / ULOGE ============
create table if not exists app_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  role       text not null default 'partner' check (role in ('admin','partner')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- helper: je li trenutni korisnik admin (SECURITY DEFINER da izbjegne RLS rekurziju)
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_users where user_id = auth.uid() and role = 'admin');
$$;

create or replace function is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_users where user_id = auth.uid());
$$;

-- bootstrap: prvi admin se kreira automatski kad se taj email registrira
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into app_users (user_id, email, role)
  values (new.id, new.email,
          case when new.email = 'marcel.majsan@gmail.com' then 'admin' else 'partner' end)
  on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- ============ PITANJA ============
create table if not exists questions (
  key      text primary key,
  ordinal  int not null,
  label    text not null,
  type     text not null check (type in ('single','multi','text')),
  options  jsonb not null default '[]'::jsonb
);

-- ============ ODGOVORI (wide; admin-only) ============
create table if not exists responses (
  respondent_id uuid primary key,
  submitted_at  timestamptz,
  q01_prodajete_li_robu_usluge_van_rh text,
  q02_imate_li_fizicku_poslovnicu text,
  q03_koliko_fizickih_poslovnica_imate text,
  q06_koliko_proizvoda_imate_u_ponudi text,
  q12_koliko_naplacujete_dostavu text,
  q21_koliko_posjeta_imate_mjesecno text,
  q23_jeste_li_certificirali_svoj_webshop text,
  q24_koristite_li_ai_alate_za_posao text,
  q26_na_vasem_webshopu_radi text,
  q27_koji_vam_je_prosjecni_iznos_kosarice text,
  q28_koliki_vam_je_udio_web_trgovine_u_ukupno text,
  q29_godisnji_bruto_promet_vaseg_webshopa_izn text,
  q30_jeste_li_clan_udruge_ecommerce_hrvatska text,
  q31_zelite_li_da_vam_posaljemo_kod_za_20_pop text,
  q33_zasto_ne_poslujete_van_granica_rh text,
  q34_zasto_ste_se_uclanili_u_udrugu_ecommerce text
);

-- ============ MULTI-SELECT (long; admin-only) ============
create table if not exists response_options (
  respondent_id uuid not null references responses(respondent_id) on delete cascade,
  question_key  text not null references questions(key),
  option_value  text not null,
  primary key (respondent_id, question_key, option_value)
);
create index if not exists idx_ro_qkey on response_options(question_key);

-- ============ AGREGATI (partner-safe) ============
create table if not exists question_aggregates (
  question_key text not null references questions(key),
  option_value text not null,
  count        int  not null,
  primary key (question_key, option_value)
);

-- ============ PII (samo admin, izdvojeno) ============
create table if not exists respondent_pii (
  respondent_id uuid primary key references responses(respondent_id) on delete cascade,
  email       text,
  first_name  text,
  last_name   text,
  ip_address  text,
  webshop_url text
);

-- ============ RLS ============
alter table app_users           enable row level security;
alter table questions           enable row level security;
alter table responses           enable row level security;
alter table response_options    enable row level security;
alter table question_aggregates enable row level security;
alter table respondent_pii      enable row level security;

-- app_users: vidiš svoj red; admin vidi/uređuje sve
drop policy if exists au_select on app_users;
create policy au_select on app_users for select using (user_id = auth.uid() or is_admin());
drop policy if exists au_write on app_users;
create policy au_write on app_users for all using (is_admin()) with check (is_admin());

-- questions + aggregates: čita svaki prijavljeni korisnik (admin i partner)
drop policy if exists q_select on questions;
create policy q_select on questions for select using (is_member());
drop policy if exists qa_select on question_aggregates;
create policy qa_select on question_aggregates for select using (is_member());

-- responses / response_options / pii: SAMO admin
drop policy if exists r_admin on responses;
create policy r_admin on responses for select using (is_admin());
drop policy if exists ro_admin on response_options;
create policy ro_admin on response_options for select using (is_admin());
drop policy if exists pii_admin on respondent_pii;
create policy pii_admin on respondent_pii for select using (is_admin());
