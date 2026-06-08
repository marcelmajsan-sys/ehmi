// Precompute the Explore example answers and write them to
// src/data/explore-cache.json so the UI can render them instantly.
//
// Run with:  node --experimental-strip-types scripts/precompute-explore.ts
// (or: npm run precompute:explore)
//
// Re-run whenever the example list, the analyst prompt, or the underlying data
// changes. Answers are computed for the admin role (full data); the examples are
// all aggregate-level and contain no PII, so they are safe to show to partners.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { runAnalystQuery } from '../src/lib/analyst.ts'
import { EXAMPLES, type CachedAnswer } from '../src/data/explore-examples.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const env = Object.fromEntries(
  readFileSync(root + '.env.local', 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

const out: CachedAnswer[] = []
for (const ex of EXAMPLES) {
  process.stdout.write(`• ${ex.hr} … `)
  const { sql, rows, analysis } = await runAnalystQuery({
    question: ex.hr, role: 'admin', admin, anthropic,
  })
  out.push({ question: ex.hr, sql, rows, analysis })
  console.log(`ok (${rows.length} rows)`)
}

const dest = root + 'src/data/explore-cache.json'
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n')
console.log(`\nWrote ${out.length} cached answers → ${dest}`)
