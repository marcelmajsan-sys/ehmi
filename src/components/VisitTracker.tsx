'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Records a page_view per navigation for logged-in users (admin analytics).
// Fire-and-forget; deduped per path within a session render.
export function VisitTracker() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (pathname === '/login' || pathname === lastPath.current) return
    lastPath.current = pathname
    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'page_view', path: pathname }),
    }).catch(() => {})
  }, [pathname])

  return null
}
