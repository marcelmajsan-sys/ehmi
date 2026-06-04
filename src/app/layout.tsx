import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/Nav'
import { getCurrentUser } from '@/lib/auth'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'eCommerce Hrvatska Market Insights',
  description: 'Istraživanje web trgovina 2026 — eCommerce Hrvatska',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser()

  return (
    <html lang="hr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        {currentUser && (
          <Nav email={currentUser.user.email ?? ''} role={currentUser.role} />
        )}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
