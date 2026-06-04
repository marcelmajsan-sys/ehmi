'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
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
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="option_value"
            cx="50%"
            cy="45%"
            outerRadius={75}
            innerRadius={38}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => [`${v}`, name]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend
            formatter={v => v}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
