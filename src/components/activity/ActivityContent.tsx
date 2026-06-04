'use client'

import { useMemo, useState } from 'react'
import { useLang } from '@/lib/lang-context'
import type { QueryLog, VisitLog, AppUserRow } from '@/app/admin/activity/page'

type Props = {
  queries: QueryLog[]
  visits: VisitLog[]
  users: AppUserRow[]
}

type View = 'visits' | 'queries'
type RoleFilter = 'partner' | 'all'

const T = {
  title:        { hr: 'Aktivnost', en: 'Activity' },
  subtitle:     { hr: 'Posjeti i upiti korisnika.', en: 'User visits and queries.' },
  visits:       { hr: 'Posjeti', en: 'Visits' },
  queries:      { hr: 'Upiti (Istraži korelacije)', en: 'Queries (Explore)' },
  partnersOnly: { hr: 'Samo partneri', en: 'Partners only' },
  all:          { hr: 'Svi', en: 'All' },
  logins:       { hr: 'logina', en: 'logins' },
  pageViews:    { hr: 'pregleda', en: 'page views' },
  queriesCount: { hr: 'upita', en: 'queries' },
  lastSeen:     { hr: 'Zadnji put', en: 'Last seen' },
  firstSeen:    { hr: 'Prvi put', en: 'First seen' },
  never:        { hr: 'Nikad', en: 'Never' },
  noVisits:     { hr: 'Nema zabilježenih posjeta.', en: 'No visits recorded.' },
  noQueries:    { hr: 'Nema zabilježenih upita.', en: 'No queries recorded.' },
  rows:         { hr: 'redaka', en: 'rows' },
  failed:       { hr: 'Neuspjeh', en: 'Failed' },
  login:        { hr: 'Login', en: 'Login' },
  pageView:     { hr: 'Pregled', en: 'Page view' },
  recentEvents: { hr: 'Nedavni događaji', en: 'Recent events' },
}

function fmt(iso: string, isEn: boolean): string {
  return new Date(iso).toLocaleString(isEn ? 'en-GB' : 'hr-HR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function RoleBadge({ role }: { role: string | null }) {
  const admin = role === 'admin'
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      admin ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {admin ? 'Admin' : 'Partner'}
    </span>
  )
}

export function ActivityContent({ queries, visits, users }: Props) {
  const { lang } = useLang()
  const isEn = lang === 'en'
  const tr = (k: keyof typeof T) => T[k][lang]

  const [view, setView] = useState<View>('visits')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('partner')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const roleByUser = useMemo(() => {
    const m = new Map<string, 'admin' | 'partner'>()
    users.forEach(u => m.set(u.user_id, u.role))
    return m
  }, [users])

  // Identify a user by user_id when present, otherwise fall back to email.
  const keyOf = (r: { user_id: string | null; email: string | null }) =>
    r.user_id ?? r.email ?? 'unknown'

  const roleOf = (r: { user_id: string | null; role: string | null }) =>
    (r.user_id && roleByUser.get(r.user_id)) || r.role || 'partner'

  const passesFilter = (role: string) => roleFilter === 'all' || role === 'partner'

  // ---- Visits grouped by user ----
  const visitGroups = useMemo(() => {
    const map = new Map<string, { email: string; role: string; logins: number; views: number; events: VisitLog[] }>()
    for (const v of visits) {
      const role = roleOf(v)
      if (!passesFilter(role)) continue
      const k = keyOf(v)
      const g = map.get(k) ?? { email: v.email ?? '—', role, logins: 0, views: 0, events: [] }
      if (v.event_type === 'login') g.logins++
      else g.views++
      g.events.push(v)
      map.set(k, g)
    }
    return [...map.entries()]
      .map(([k, g]) => ({ key: k, ...g }))
      .sort((a, b) => {
        const la = a.events[0]?.created_at ?? ''
        const lb = b.events[0]?.created_at ?? ''
        return lb.localeCompare(la)
      })
  }, [visits, roleFilter, roleByUser])

  // ---- Queries grouped by user ----
  const queryGroups = useMemo(() => {
    const map = new Map<string, { email: string; role: string; items: QueryLog[] }>()
    for (const q of queries) {
      const role = roleOf(q)
      if (!passesFilter(role)) continue
      const k = keyOf(q)
      const g = map.get(k) ?? { email: q.email ?? '—', role, items: [] }
      g.items.push(q)
      map.set(k, g)
    }
    return [...map.entries()]
      .map(([k, g]) => ({ key: k, ...g }))
      .sort((a, b) => {
        const la = a.items[0]?.created_at ?? ''
        const lb = b.items[0]?.created_at ?? ''
        return lb.localeCompare(la)
      })
  }, [queries, roleFilter, roleByUser])

  const toggle = (k: string) => setExpanded(p => ({ ...p, [k]: !p[k] }))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{tr('title')}</h1>
      <p className="text-gray-500 mb-6 text-sm">{tr('subtitle')}</p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
          {(['visits', 'queries'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 transition-colors ${
                view === v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v === 'visits' ? tr('visits') : tr('queries')}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
          {(['partner', 'all'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 transition-colors ${
                roleFilter === r ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {r === 'partner' ? tr('partnersOnly') : tr('all')}
            </button>
          ))}
        </div>
      </div>

      {/* ---- VISITS ---- */}
      {view === 'visits' && (
        visitGroups.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">{tr('noVisits')}</p>
        ) : (
          <div className="space-y-3">
            {visitGroups.map(g => {
              const open = expanded['v_' + g.key]
              const last = g.events[0]?.created_at
              const first = g.events[g.events.length - 1]?.created_at
              return (
                <div key={g.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggle('v_' + g.key)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-400 text-xs w-4">{open ? '▾' : '▸'}</span>
                    <span className="text-sm font-medium text-gray-900 flex-1 truncate">{g.email}</span>
                    <RoleBadge role={g.role} />
                    <span className="text-xs text-gray-500 tabular-nums hidden sm:inline">
                      <strong className="text-gray-900">{g.logins}</strong> {tr('logins')} · <strong className="text-gray-900">{g.views}</strong> {tr('pageViews')}
                    </span>
                    <span className="text-xs text-gray-400 tabular-nums hidden md:inline whitespace-nowrap">
                      {last ? fmt(last, isEn) : tr('never')}
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-gray-100 px-5 py-3">
                      <div className="flex gap-6 text-xs text-gray-500 mb-3 sm:hidden">
                        <span><strong className="text-gray-900">{g.logins}</strong> {tr('logins')}</span>
                        <span><strong className="text-gray-900">{g.views}</strong> {tr('pageViews')}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 mb-3">
                        <span>{tr('firstSeen')}: <span className="text-gray-700">{first ? fmt(first, isEn) : '—'}</span></span>
                        <span>{tr('lastSeen')}: <span className="text-gray-700">{last ? fmt(last, isEn) : '—'}</span></span>
                      </div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{tr('recentEvents')}</p>
                      <ul className="space-y-1">
                        {g.events.slice(0, 30).map(e => (
                          <li key={e.id} className="flex items-center gap-3 text-xs">
                            <span className={`px-1.5 py-0.5 rounded font-medium ${
                              e.event_type === 'login' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {e.event_type === 'login' ? tr('login') : tr('pageView')}
                            </span>
                            <span className="text-gray-600 flex-1 truncate">{e.path ?? '—'}</span>
                            <span className="text-gray-400 tabular-nums whitespace-nowrap">{fmt(e.created_at, isEn)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ---- QUERIES ---- */}
      {view === 'queries' && (
        queryGroups.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">{tr('noQueries')}</p>
        ) : (
          <div className="space-y-3">
            {queryGroups.map(g => {
              const open = expanded['q_' + g.key]
              return (
                <div key={g.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggle('q_' + g.key)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-400 text-xs w-4">{open ? '▾' : '▸'}</span>
                    <span className="text-sm font-medium text-gray-900 flex-1 truncate">{g.email}</span>
                    <RoleBadge role={g.role} />
                    <span className="text-xs text-gray-500 tabular-nums">
                      <strong className="text-gray-900">{g.items.length}</strong> {tr('queriesCount')}
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-gray-100 divide-y divide-gray-100">
                      {g.items.map(q => (
                        <div key={q.id} className="px-5 py-3">
                          <div className="flex items-start gap-3">
                            <p className="text-sm text-gray-800 flex-1">{q.question}</p>
                            {!q.success && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 whitespace-nowrap">
                                {tr('failed')}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400 tabular-nums">
                            <span>{fmt(q.created_at, isEn)}</span>
                            {q.success && q.row_count != null && (
                              <span>{q.row_count} {tr('rows')}</span>
                            )}
                            {q.error && <span className="text-red-400 normal-nums">{q.error}</span>}
                          </div>
                          {q.sql && (
                            <details className="mt-2">
                              <summary className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none">SQL</summary>
                              <pre className="mt-1.5 text-[11px] text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto leading-relaxed">{q.sql}</pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
