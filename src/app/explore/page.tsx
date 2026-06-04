'use client'

import { useState } from 'react'
import { useLang } from '@/lib/lang-context'

const EXAMPLES = [
  {
    hr: 'Koje načine dostave biraju trgovci ovisno o prosječnom iznosu košarice?',
    en: 'Which delivery methods do merchants choose by average cart value?',
  },
  {
    hr: 'Koji hosting koriste WooCommerce trgovci?',
    en: 'Which hosting providers do WooCommerce merchants use?',
  },
  {
    hr: 'Koji se kanali oglašavanja koriste po broju mjesečnih posjeta?',
    en: 'Which advertising channels are used by monthly visit count?',
  },
  {
    hr: 'Koje AI alate i za što koriste trgovci ovisno o godišnjem prometu?',
    en: 'What AI tools do merchants use by annual revenue level?',
  },
  {
    hr: 'Koliko trgovaca koristi WooCommerce?',
    en: 'How many merchants use WooCommerce?',
  },
  {
    hr: 'Koji je prosječni godišnji promet po platformi?',
    en: 'What is the average annual revenue per platform?',
  },
]

type QueryResult = {
  sql: string
  rows: Record<string, unknown>[]
  analysis: string
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <p className="text-sm text-gray-500">No results.</p>
  const keys = Object.keys(rows[0])
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {keys.map(k => (
              <th key={k} className="text-left py-2 pr-6 font-medium text-gray-500 whitespace-nowrap">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0">
              {keys.map(k => (
                <td key={k} className="py-1.5 pr-6 text-gray-800">
                  {String(row[k] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ExplorePage() {
  const { lang } = useLang()
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState('')

  async function ask(q: string) {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Error')
      else setResult(data as QueryResult)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const isEn = lang === 'en'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {isEn ? 'Explore — ask anything about the data' : 'Istraži — pitaj bilo što o podacima'}
      </h1>
      <p className="text-gray-500 mb-8 text-sm">
        {isEn
          ? 'Ask whatever you want about the research data — from simple numbers to correlations. Claude writes the SQL, fetches the data and explains it.'
          : 'Pitaj što god te zanima o podacima — od jednostavnih brojki do korelacija. Claude piše SQL, dohvaća podatke i objašnjava ih.'}
      </p>

      {/* Example correlations */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {isEn ? 'Example questions' : 'Primjeri pitanja'}
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => { setQuestion(ex.hr); ask(ex.hr) }}
              disabled={loading}
              className="text-left px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {isEn ? ex.en : ex.hr}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask(question)}
          placeholder={isEn ? 'Ask a correlation question…' : 'Postavi pitanje o korelacijama…'}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => ask(question)}
          disabled={loading || !question.trim()}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors min-w-[80px]"
        >
          {loading ? '…' : isEn ? 'Ask' : 'Pitaj'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-500 py-6">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          {isEn ? 'Generating query and analysing results…' : 'Generiram upit i analiziram rezultate…'}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {isEn ? 'Analysis' : 'Analiza'}
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">{result.analysis}</p>
          </div>

          {/* Data table */}
          {Array.isArray(result.rows) && result.rows.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {isEn ? `Data (${result.rows.length} rows)` : `Podaci (${result.rows.length} redaka)`}
              </p>
              <DataTable rows={result.rows} />
            </div>
          )}

          {/* SQL (collapsible) */}
          <details className="bg-gray-50 rounded-xl border border-gray-200">
            <summary className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none">
              SQL
            </summary>
            <pre className="px-4 pb-4 text-xs text-gray-700 overflow-x-auto leading-relaxed">
              {result.sql}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
