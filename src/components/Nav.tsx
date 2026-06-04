'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang-context'

type NavProps = { email: string; role: 'admin' | 'partner' }

export function Nav({ email, role }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { lang, setLang, t } = useLang()

  const tabs = [
    { href: '/', label: 'Overview', adminOnly: false },
    { href: '/pitanja', label: t.nav.questions, adminOnly: false },
    { href: '/explore', label: t.nav.explore, adminOnly: true },
    { href: '/admin/users', label: t.nav.users, adminOnly: true },
    { href: '/admin/settings', label: t.nav.settings, adminOnly: true },
  ].filter(tab => !tab.adminOnly || role === 'admin')

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6 min-w-0">
            <span className="font-semibold text-gray-900 text-sm whitespace-nowrap hidden sm:block">
              eCommerce Hrvatska MI
            </span>
            <nav className="flex gap-0.5">
              {tabs.map(tab => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === tab.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Language toggle */}
            <div className="flex items-center gap-0.5 rounded-md border border-gray-200 overflow-hidden text-xs font-medium">
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
            <span className="text-xs text-gray-400 hidden md:block truncate max-w-[200px]">
              {email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {t.nav.signOut}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
