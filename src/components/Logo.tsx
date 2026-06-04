'use client'

import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group shrink-0">
      {/* Icon: rising bar chart */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect x="2"  y="16" width="6" height="10" rx="1.5" fill="#2563eb" opacity="0.5" />
        <rect x="11" y="10" width="6" height="16" rx="1.5" fill="#2563eb" opacity="0.75" />
        <rect x="20" y="4"  width="6" height="22" rx="1.5" fill="#2563eb" />
      </svg>

      {/* Name */}
      <div className="leading-tight">
        <span className="block text-[13px] font-bold text-gray-900 tracking-tight group-hover:text-blue-700 transition-colors">
          eCommerce Hrvatska
        </span>
        <span className="block text-[10px] font-semibold text-blue-600 tracking-widest uppercase">
          Market Insights
        </span>
      </div>
    </Link>
  )
}
