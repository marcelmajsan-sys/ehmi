'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export type ChartItem = { option_value: string; count: number; pct: number }

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#7c3aed', '#0891b2']

type Props = {
  data: ChartItem[]
  title?: string
}

export function SurveyPieChart({ data, title }: Props) {
  return (
    <div>
      {title && (
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="option_value"
            cx="50%"
            cy="50%"
            outerRadius={75}
            innerRadius={38}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name, item) => [`${v} (${item?.payload?.pct ?? 0}%)`, name]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="mt-3 space-y-1.5">
        {data.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
            <span
              className="inline-block w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="flex-1 truncate">{item.option_value}</span>
            <span className="text-gray-400 tabular-nums">{item.count}</span>
            <span className="font-semibold text-gray-900 tabular-nums w-10 text-right">
              {item.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
