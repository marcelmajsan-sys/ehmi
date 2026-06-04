'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'

export type ChartItem = { option_value: string; count: number; pct: number }

type Props = {
  data: ChartItem[]
  title?: string
  color?: string
}

export function SurveyBarChart({ data, title, color = '#2563eb' }: Props) {
  const height = Math.max(data.length * 40 + 20, 120)
  return (
    <div>
      {title && (
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 52, top: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="option_value"
            width={170}
            tick={{ fontSize: 12, fill: '#374151' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) => [`${v}`, 'Odgovori']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="count" fill={color} radius={[0, 3, 3, 0]}>
            <LabelList
              dataKey="pct"
              position="right"
              formatter={(v) => `${v}%`}
              style={{ fontSize: 11, fill: '#6b7280' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
