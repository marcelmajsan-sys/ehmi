import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { Nav } from '@/components/Nav'
import { VisitTracker } from '@/components/VisitTracker'
import { LangProvider } from '@/lib/lang-context'
import { getCurrentUser } from '@/lib/auth'
import type { Lang } from '@/translations'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'eCommerce Hrvatska Market Insights',
  description: 'Croatian web shop survey 2026 — eCommerce Hrvatska',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser()
  const cookieStore = await cookies()
  const langCookie = cookieStore.get('ehmi_lang')?.value
  const initialLang: Lang = langCookie === 'en' ? 'en' : 'hr'

  return (
    <html lang={initialLang} className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <LangProvider initial={initialLang}>
          {currentUser && (
            <>
              <Nav email={currentUser.user.email ?? ''} role={currentUser.role} />
              <VisitTracker />
            </>
          )}
          <main className="flex-1">{children}</main>
        </LangProvider>
      </body>
    </html>
  )
}
