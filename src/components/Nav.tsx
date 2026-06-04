'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang-context'
import { Logo } from '@/components/Logo'

type NavProps = { email: string; role: 'admin' | 'partner' }

export function Nav({ email, role }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { lang, setLang, t } = useLang()
  const [menuOpen, setMenuOpen] = useState(false)

  const tabs = [
    { href: '/', label: t.nav.overview, adminOnly: false },
    { href: '/pitanja', label: t.nav.questions, adminOnly: false },
    { href: '/explore', label: t.nav.explore, adminOnly: false },
    { href: '/admin/users', label: t.nav.users, adminOnly: true },
    { href: '/admin/settings', label: t.nav.settings, adminOnly: true },
  ].filter(tab => !tab.adminOnly || role === 'admin')

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function handleTabClick() {
    setMenuOpen(false)
  }

  const LangToggle = () => (
    <div className="flex items-center gap-0.5 rounded-md border border-gray-200 overflow-hidden text-xs font-medium shrink-0">
      <button
        onClick={() => setLang('en')}
        className={`px-2 py-1 transition-colors ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('hr')}
        className={`px-2 py-1 transition-colors ${lang === 'hr' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
      >
        HR
      </button>
    </div>
  )

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Logo */}
          <Logo />

          {/* Desktop tabs */}
          <nav className="hidden md:flex gap-0.5 flex-1">
            {tabs.map(tab => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === tab.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* Right side: lang + email + sign out */}
          <div className="flex items-center gap-2 shrink-0">
            <LangToggle />
            <span className="text-xs text-gray-400 hidden lg:block truncate max-w-[160px]">
              {email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block"
            >
              {t.nav.signOut}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="md:hidden p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {menuOpen
                ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                : <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <nav className="px-4 py-3 space-y-1">
            {tabs.map(tab => (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={handleTabClick}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === tab.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400 truncate max-w-[200px]">{email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              {t.nav.signOut}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
