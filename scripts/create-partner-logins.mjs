// One-off: provision PARTNER logins for all survey-respondent emails and export an Excel sheet.
// Reads creds from .env.local (service-role). Idempotent: reuses existing auth users.
// Run: node scripts/create-partner-logins.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'

const PASSWORD = 'eCommerceHrvatskaResearchPortal!'
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

// --- load env ---
const env = Object.fromEntries(
  readFileSync(`${ROOT}/.env.local`, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')]
    })
)
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Missing Supabase env')

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

// --- emails ---
const emails = readFileSync(`${ROOT}/scripts/partner-emails.txt`, 'utf8')
  .split('\n')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)
const unique = [...new Set(emails)]
console.log(`Loaded ${unique.length} unique emails`)

// --- map existing auth users (paginate) ---
const existing = new Map()
for (let page = 1; ; page++) {
  const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) throw error
  data.users.forEach((u) => u.email && existing.set(u.email.toLowerCase(), u.id))
  if (data.users.length < 1000) break
}
console.log(`Existing auth users: ${existing.size}`)

// --- created_by = first admin; protect existing admins from downgrade/reset ---
const { data: admins } = await sb.from('app_users').select('user_id, email').eq('role', 'admin')
const adminEmails = new Set((admins ?? []).map((a) => a.email?.toLowerCase()))
const createdBy =
  admins?.find((a) => a.email === 'marcel.majsan@gmail.com')?.user_id ?? admins?.[0]?.user_id ?? null

// --- provision ---
const results = []
for (const email of unique) {
  let status = ''
  let userId = existing.get(email) ?? null
  if (adminEmails.has(email)) {
    results.push({ email, role: 'admin', password: '(unchanged)', status: 'skipped (admin)' })
    console.log(`${'skipped (admin)'.padEnd(18)} ${email}`)
    continue
  }
  try {
    if (userId) {
      // ensure password matches the shared one
      await sb.auth.admin.updateUserById(userId, { password: PASSWORD, email_confirm: true })
      status = 'updated (existed)'
    } else {
      const { data, error } = await sb.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
      })
      if (error) throw error
      userId = data.user.id
      status = 'created'
    }
    const { error: upErr } = await sb
      .from('app_users')
      .upsert({ user_id: userId, email, role: 'partner', created_by: createdBy }, { onConflict: 'user_id' })
    if (upErr) throw upErr
  } catch (e) {
    status = `ERROR: ${e.message}`
  }
  results.push({ email, role: 'partner', password: PASSWORD, status })
  console.log(`${status.padEnd(18)} ${email}`)
}

// --- Excel export ---
const wb = new ExcelJS.Workbook()
wb.creator = 'eCommerce Hrvatska — research portal'
wb.created = new Date()
const ws = wb.addWorksheet('Partner logins')
ws.columns = [
  { header: 'Email', key: 'email', width: 42 },
  { header: 'Lozinka', key: 'password', width: 34 },
  { header: 'Uloga', key: 'role', width: 12 },
  { header: 'Status', key: 'status', width: 22 },
]
ws.getRow(1).font = { bold: true }
ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
results.forEach((r) => ws.addRow(r))
ws.autoFilter = { from: 'A1', to: 'D1' }
ws.views = [{ state: 'frozen', ySplit: 1 }]

const outPath = `${ROOT}/scripts/partner-logins.xlsx`
await wb.xlsx.writeFile(outPath)

const ok = results.filter((r) => !r.status.startsWith('ERROR')).length
console.log(`\nDone. ${ok}/${results.length} provisioned. Excel: ${outPath}`)
const errs = results.filter((r) => r.status.startsWith('ERROR'))
if (errs.length) console.log('Errors:\n' + errs.map((e) => `  ${e.email}: ${e.status}`).join('\n'))
