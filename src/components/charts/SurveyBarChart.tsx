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

const MAX_LABEL = 30

// Skrati duge labele (npr. slobodni "Ostalo" odgovori) na granici riječi.
function truncate(s: string): string {
  if (s.length <= MAX_LABEL) return s
  const cut = s.slice(0, MAX_LABEL)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > MAX_LABEL * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

type TickProps = { x?: number; y?: number; payload?: { value?: string } }

function YAxisTick({ x = 0, y = 0, payload }: TickProps) {
  const full = String(payload?.value ?? '')
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill="#374151">
      {truncate(full)}
      <title>{full}</title>
    </text>
  )
}

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
            width={185}
            tick={<YAxisTick />}
            tickLine={false}
            axisLine={false}
            interval={0}
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
