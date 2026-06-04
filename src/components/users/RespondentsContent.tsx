'use client'

import { useState, useMemo } from 'react'
import { useLang } from '@/lib/lang-context'
import { translateOption, translateLabel } from '@/translations/survey-data'
import type { Question, ROption, Pii, Response } from '@/app/admin/users/page'

type Props = { responses: Response[]; rOptions: ROption[]; pii: Pii[]; questions: Question[] }

const SUMMARY_KEYS = [
  'q29_godisnji_bruto_promet_vaseg_webshopa_izn',
  'q21_koliko_posjeta_imate_mjesecno',
  'q27_koji_vam_je_prosjecni_iznos_kosarice',
  'q30_jeste_li_clan_udruge_ecommerce_hrvatska',
] as const

type SummaryKey = typeof SUMMARY_KEYS[number]

const HEADERS: Record<SummaryKey, { en: string; hr: string }> = {
  q29_godisnji_bruto_promet_vaseg_webshopa_izn: { en: 'Revenue',      hr: 'Promet'       },
  q21_koliko_posjeta_imate_mjesecno:            { en: 'Visits/mo',    hr: 'Posjeti'      },
  q27_koji_vam_je_prosjecni_iznos_kosarice:     { en: 'Avg cart',     hr: 'Košarica'     },
  q30_jeste_li_clan_udruge_ecommerce_hrvatska:  { en: 'Association',  hr: 'Član udruge'  },
}

// Preferred sort order for revenue and visits (coarse → fine is default, but we want smallest → largest)
const REVENUE_ORDER = [
  'do 40.000 eura',
  '40.000 - 100.000 eura',
  '100.000 - 200.000 eura',
  '200.000 - 500.000 eura',
  '500.000 - 1.000.000 eura',
  'Više od 1.000.000 eura',
]
const VISITS_ORDER = [
  'Do 10.000', '10.000 - 20.000', '20.000 - 50.000',
  '50.000 - 100.000', 'Više od 100.000', 'Ne znam/nisam siguran',
]
const CART_ORDER = [
  'Do 50 €', '50 do 100 €', '100 do 200€', '200 do 500€',
  '500 do 1000€', 'Više od 1000€', 'Ne znam/nisam siguran',
]

const SORT_ORDERS: Partial<Record<SummaryKey, string[]>> = {
  q29_godisnji_bruto_promet_vaseg_webshopa_izn: REVENUE_ORDER,
  q21_koliko_posjeta_imate_mjesecno: VISITS_ORDER,
  q27_koji_vam_je_prosjecni_iznos_kosarice: CART_ORDER,
}

function getAnswer(r: Response, key: string, optMap: Record<string, Record<string, string[]>>, lang: string): string {
  const opts = optMap[r.respondent_id]?.[key]
  if (opts) {
    return opts.map(v => lang === 'en' ? translateOption(v) : v).join(', ') || '—'
  }
  const v = r[key]
  if (typeof v === 'string' && v) return lang === 'en' ? translateOption(v) : v
  return '—'
}

function shortDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function RespondentsContent({ responses, rOptions, pii, questions }: Props) {
  const { lang } = useLang()
  const isEn = lang === 'en'

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Partial<Record<SummaryKey, string>>>({})

  const piiMap = useMemo(() =>
    Object.fromEntries(pii.map(p => [p.respondent_id, p])), [pii])

  const optionsMap = useMemo(() => {
    const m: Record<string, Record<string, string[]>> = {}
    for (const o of rOptions) {
      if (!m[o.respondent_id]) m[o.respondent_id] = {}
      if (!m[o.respondent_id][o.question_key]) m[o.respondent_id][o.question_key] = []
      m[o.respondent_id][o.question_key].push(o.option_value)
    }
    return m
  }, [rOptions])

  // Build unique filter options (in Croatian, translate on render)
  const filterOptions = useMemo(() => {
    const result: Partial<Record<SummaryKey, string[]>> = {}
    for (const key of SUMMARY_KEYS) {
      const valuesSet = new Set<string>()
      for (const r of responses) {
        const v = r[key]
        if (typeof v === 'string' && v) valuesSet.add(v)
      }
      const sortOrder = SORT_ORDERS[key]
      const sorted = sortOrder
        ? sortOrder.filter(v => valuesSet.has(v))
        : [...valuesSet].sort()
      result[key] = sorted
    }
    return result
  }, [responses])

  const filtered = useMemo(() => {
    return responses.filter(r => {
      // Text search
      if (search.trim()) {
        const q = search.toLowerCase()
        const p = piiMap[r.respondent_id]
        const matches = p?.email?.toLowerCase().includes(q) || p?.webshop_url?.toLowerCase().includes(q)
        if (!matches) return false
      }
      // Dropdown filters (match on Croatian raw value)
      for (const key of SUMMARY_KEYS) {
        const selected = filters[key]
        if (!selected) continue
        const v = r[key]
        if (typeof v !== 'string' || v !== selected) return false
      }
      return true
    })
  }, [responses, search, filters, piiMap])

  function setFilter(key: SummaryKey, value: string) {
    setFilters(prev => ({ ...prev, [key]: value || undefined }))
  }

  function clearFilters() {
    setFilters({})
    setSearch('')
  }

  const hasFilters = search.trim() || Object.values(filters).some(Boolean)

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEn ? 'Respondents' : 'Ispitanici'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEn
              ? `${filtered.length} of ${responses.length} respondents`
              : `${filtered.length} od ${responses.length} ispitanika`}
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isEn ? 'Filter by email or URL…' : 'Filtriraj po emailu ili URL-u…'}
          className="w-60 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {SUMMARY_KEYS.map(key => {
          const opts = filterOptions[key] ?? []
          const selected = filters[key] ?? ''
          return (
            <select
              key={key}
              value={selected}
              onChange={e => setFilter(key, e.target.value)}
              className={`text-sm rounded-lg border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                selected ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-300 text-gray-600 bg-white'
              }`}
            >
              <option value="">
                {isEn ? `All — ${HEADERS[key].en}` : `Sve — ${HEADERS[key].hr}`}
              </option>
              {opts.map(v => (
                <option key={v} value={v}>
                  {isEn ? translateOption(v) : v}
                </option>
              ))}
            </select>
          )
        })}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-900 px-2 py-1.5 underline underline-offset-2"
          >
            {isEn ? 'Clear' : 'Poništi'}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-500 w-10">#</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  {isEn ? 'Webshop' : 'Webshop'}
                </th>
                {SUMMARY_KEYS.map(key => (
                  <th key={key} className="text-left py-3 px-4 font-medium text-gray-500 whitespace-nowrap">
                    {HEADERS[key][lang]}
                  </th>
                ))}
                <th className="py-3 px-4 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r, idx) => {
                const p = piiMap[r.respondent_id]
                const isOpen = expandedId === r.respondent_id
                const identifier = p?.webshop_url || p?.email || r.respondent_id.slice(0, 8) + '…'

                return [
                  <tr
                    key={r.respondent_id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${isOpen ? 'bg-blue-50' : ''}`}
                    onClick={() => setExpandedId(isOpen ? null : r.respondent_id)}
                  >
                    <td className="py-3 px-4 text-gray-400 tabular-nums">
                      {filtered.length - idx}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 max-w-[220px] truncate" title={identifier}>
                        {identifier}
                      </div>
                      <div className="text-xs text-gray-400">{shortDate(r.submitted_at)}</div>
                    </td>
                    {SUMMARY_KEYS.map(key => (
                      <td key={key} className="py-3 px-4 text-gray-700">
                        {getAnswer(r, key, optionsMap, lang)}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center text-gray-400">
                      <span className={`inline-block transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </td>
                  </tr>,

                  isOpen && (
                    <tr key={`${r.respondent_id}-exp`}>
                      <td colSpan={SUMMARY_KEYS.length + 3} className="bg-blue-50 border-t border-blue-100 px-4 py-5">
                        <div className="max-w-4xl">
                          {/* PII */}
                          {p && (
                            <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4 text-xs text-gray-500">
                              {p.email && <span>✉ {p.email}</span>}
                              {p.webshop_url && <span>🌐 {p.webshop_url}</span>}
                              <span>📅 {shortDate(r.submitted_at)}</span>
                            </div>
                          )}
                          {/* All answers in ordinal order (Q31 hidden) */}
                          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                            {questions.filter(q => !q.key.startsWith('q31_')).map(q => {
                              const label = isEn ? translateLabel(q.label) : q.label
                              if (q.type === 'text') {
                                const v = r[q.key]
                                if (!v || typeof v !== 'string') return null
                                return (
                                  <div key={q.key} className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500 mb-0.5">
                                      Q{q.ordinal} · {label}
                                    </p>
                                    <p className="text-sm text-gray-900 italic">"{v}"</p>
                                  </div>
                                )
                              }
                              const ans = getAnswer(r, q.key, optionsMap, lang)
                              if (ans === '—') return null
                              return (
                                <div key={q.key}>
                                  <p className="text-xs font-medium text-gray-500 mb-0.5">
                                    Q{q.ordinal} · {label}
                                  </p>
                                  <p className="text-sm text-gray-900">{ans}</p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ),
                ]
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={SUMMARY_KEYS.length + 3} className="py-12 text-center text-gray-400 text-sm">
                    {isEn ? 'No respondents match the current filters.' : 'Nema ispitanika koji odgovaraju filteru.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
