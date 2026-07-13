#!/usr/bin/env node
// Sigurnosne provjere (vidi SECURITY.md §5). Pokreće se ručno ili u CI / pre-deploy:
//   npm run sec:check
//
// Env: uzima iz process.env (CI/secrets), pa fallback na .env.local (lokalno).
// Potrebno: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//           NEXT_PUBLIC_SUPABASE_ANON_KEY (ili NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).
// Exit kod: 0 ako sve prođe, 1 ako bilo koja provjera padne (gate-a deploy).

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const env = { ...process.env }
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      if (!line.includes('=') || line.trim().startsWith('#')) continue
      const i = line.indexOf('=')
      const k = line.slice(0, i).trim()
      if (env[k] == null) env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
  } catch { /* .env.local optional in CI */ }
  return env
}

const env = loadEnv()
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!URL || !SERVICE || !ANON) {
  console.error('✖ Nedostaju env varijable (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY).')
  process.exit(2)
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })
const anon  = createClient(URL, ANON,    { auth: { persistSession: false } })
const rpc = (c, sql) => c.rpc('execute_analyst_query', { query_text: sql })

let failures = 0
function check(name, passed, detail = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL'
  if (!passed) failures++
  console.log(`${status}  ${name}${detail ? `  — ${detail}` : ''}`)
}

// ---- MORA BITI BLOKIRANO ----
{
  const r = await rpc(anon, 'select count(*) from respondent_pii')
  check('anon ne može pozvati execute_analyst_query', !!r.error, r.error?.message ?? `LEAKED ${JSON.stringify(r.data)}`)
}
for (const [label, sql] of [
  ['respondent_pii', 'select email from respondent_pii limit 1'],
  ['app_users',      'select email from app_users limit 1'],
  ['auth.users',     'select id from auth.users limit 1'],
  ['pg_catalog',     'select usename from pg_user limit 1'],
]) {
  const r = await rpc(admin, sql)
  check(`funkcija blokira ${label}`, !!r.error, r.error?.message ?? 'LEAKED')
}
{
  const r = await rpc(admin, 'select 1; drop table responses')
  check('funkcija blokira write/DDL (stacked)', !!r.error, r.error?.message ?? 'NOT BLOCKED')
}
for (const tbl of ['respondent_pii', 'responses', 'response_options']) {
  const r = await anon.from(tbl).select('*').limit(1)
  const safe = !!r.error || (r.data?.length ?? 0) === 0
  check(`anon izravni select na ${tbl} odbijen/prazan`, safe, r.error?.message ?? `rows=${r.data?.length}`)
}
// NAPOMENA: provjera ACL-a novih definer RPC-ova (SECURITY.md §5 t.6) ne može ići
// kroz execute_analyst_query jer guard blokira pg_proc — pokreni je ručno u
// Supabase SQL Editoru kad dodaješ novi RPC.

// ---- MORA RADITI (service_role) ----
for (const [label, sql] of [
  ['partner-agregati',   'select question_key, option_value, count from question_aggregates limit 3'],
  ['admin responses',    'select count(*)::int as n from responses'],
  ['"Ostalo" rekonstrukcija',
    `with markers as (select q.key qk, m.value marker from questions q, lateral jsonb_array_elements_text(q.options) m(value) where m.value ~* 'ostalo|drugo|drugi')
     select count(*)::int n from response_options ro join markers mk on mk.qk=ro.question_key and ro.option_value=mk.marker`],
]) {
  const r = await rpc(admin, sql)
  check(`legitiman upit radi: ${label}`, !r.error && Array.isArray(r.data), r.error?.message ?? `${r.data?.length} redaka`)
}

console.log(`\n${failures === 0 ? '✓ Sve sigurnosne provjere prošle.' : `✖ ${failures} provjera palo.`}`)
process.exit(failures === 0 ? 0 : 1)
