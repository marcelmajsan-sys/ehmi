'use client'

import { useState, useMemo } from 'react'
import { useLang } from '@/lib/lang-context'
import { translateOption, translateLabel } from '@/translations/survey-data'
import type { Question, ROption, Pii, Response } from '@/app/admin/users/page'

type Props = { responses: Response[]; rOptions: ROption[]; pii: Pii[]; questions: Question[] }

// Key columns shown in the summary row
const SUMMARY_KEYS = [
  'q29_godisnji_bruto_promet_vaseg_webshopa_izn',
  'q04_na_kojoj_platformi_se_nalazi_vas_webshop', // multi-select
  'q21_koliko_posjeta_imate_mjesecno',
  'q27_koji_vam_je_prosjecni_iznos_kosarice',
  'q24_koristite_li_ai_alate_za_posao',
]

const SUMMARY_HEADERS: Record<string, { en: string; hr: string }> = {
  q29_godisnji_bruto_promet_vaseg_webshopa_izn: { en: 'Revenue', hr: 'Promet' },
  q04_na_kojoj_platformi_se_nalazi_vas_webshop:  { en: 'Platform', hr: 'Platforma' },
  q21_koliko_posjeta_imate_mjesecno:              { en: 'Visits/mo', hr: 'Posjeti/mj' },
  q27_koji_vam_je_prosjecni_iznos_kosarice:       { en: 'Avg cart', hr: 'Košarica' },
  q24_koristite_li_ai_alate_za_posao:             { en: 'AI', hr: 'AI' },
}

function cell(value: string | string[], lang: string): string {
  const arr = Array.isArray(value) ? value : [value]
  return arr
    .filter(Boolean)
    .map(v => lang === 'en' ? translateOption(v) : v)
    .join(', ') || '—'
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

  // Index data
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

  // Filtered rows
  const filtered = useMemo(() => {
    if (!search.trim()) return responses
    const q = search.toLowerCase()
    return responses.filter(r => {
      const p = piiMap[r.respondent_id]
      return (
        p?.email?.toLowerCase().includes(q) ||
        p?.webshop_url?.toLowerCase().includes(q)
      )
    })
  }, [responses, search, piiMap])

  function getAnswer(r: Response, key: string): string {
    const opts = optionsMap[r.respondent_id]?.[key]
    if (opts) return cell(opts, lang)
    const v = r[key]
    if (typeof v === 'string' && v) return isEn ? translateOption(v) : v
    return '—'
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 gap-4">
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
          className="w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-500 w-8">#</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  {isEn ? 'Webshop' : 'Webshop'}
                </th>
                {SUMMARY_KEYS.map(key => (
                  <th key={key} className="text-left py-3 px-4 font-medium text-gray-500 whitespace-nowrap">
                    {SUMMARY_HEADERS[key]?.[lang] ?? key}
                  </th>
                ))}
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r, idx) => {
                const p = piiMap[r.respondent_id]
                const isOpen = expandedId === r.respondent_id
                const identifier = p?.webshop_url || p?.email || r.respondent_id.slice(0, 8) + '…'

                return [
                  // Summary row
                  <tr
                    key={r.respondent_id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${isOpen ? 'bg-blue-50' : ''}`}
                    onClick={() => toggleExpand(r.respondent_id)}
                  >
                    <td className="py-3 px-4 text-gray-400">{filtered.length - idx}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 max-w-[200px] truncate" title={identifier}>
                        {identifier}
                      </div>
                      <div className="text-xs text-gray-400">{shortDate(r.submitted_at)}</div>
                    </td>
                    {SUMMARY_KEYS.map(key => (
                      <td key={key} className="py-3 px-4 text-gray-700 max-w-[160px]">
                        <span className="line-clamp-1 block" title={getAnswer(r, key)}>
                          {getAnswer(r, key)}
                        </span>
                      </td>
                    ))}
                    <td className="py-3 px-4 text-gray-400 text-center">
                      <span className={`transition-transform inline-block ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                    </td>
                  </tr>,

                  // Expanded detail row
                  isOpen && (
                    <tr key={`${r.respondent_id}-detail`}>
                      <td colSpan={SUMMARY_KEYS.length + 3} className="bg-blue-50 border-t border-blue-100 px-4 py-5">
                        <div className="max-w-4xl">
                          {/* PII block */}
                          {p && (
                            <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4 text-xs text-gray-500">
                              {p.email && <span>✉ {p.email}</span>}
                              {p.webshop_url && <span>🌐 {p.webshop_url}</span>}
                              <span>📅 {shortDate(r.submitted_at)}</span>
                            </div>
                          )}

                          {/* All answers */}
                          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                            {questions.filter(q => q.type !== 'text').map(q => {
                              const answer = getAnswer(r, q.key)
                              if (answer === '—') return null
                              const label = isEn ? translateLabel(q.label) : q.label
                              return (
                                <div key={q.key}>
                                  <p className="text-xs font-medium text-gray-500 mb-0.5">
                                    Q{q.ordinal} · {label}
                                  </p>
                                  <p className="text-sm text-gray-900">{answer}</p>
                                </div>
                              )
                            })}
                            {/* Free text questions */}
                            {questions.filter(q => q.type === 'text').map(q => {
                              const v = r[q.key]
                              if (!v || typeof v !== 'string') return null
                              const label = isEn ? translateLabel(q.label) : q.label
                              return (
                                <div key={q.key} className="sm:col-span-2">
                                  <p className="text-xs font-medium text-gray-500 mb-0.5">
                                    Q{q.ordinal} · {label}
                                  </p>
                                  <p className="text-sm text-gray-900 italic">"{v}"</p>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
