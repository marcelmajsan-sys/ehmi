'use client'
import { useLang } from '@/lib/lang-context'
export default function ExplorePage() {
  const { t } = useLang()
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.explore.title}</h1>
      <p className="text-gray-500">{t.explore.subtitle}</p>
    </div>
  )
}
