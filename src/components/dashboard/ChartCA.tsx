'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CHART_COLORS, CHART_DEFAULTS } from '@/lib/chart-theme'

interface Props {
  data: { mois: string; ca: number }[]
}

export default function ChartCA({ data }: Props) {
  const maxCA = Math.max(...data.map(d => d.ca), 1)

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }} barSize={28}>
        <CartesianGrid
          strokeDasharray={CHART_DEFAULTS.gridStyle.strokeDasharray}
          stroke={CHART_DEFAULTS.gridStyle.stroke}
          vertical={false}
        />
        <XAxis
          dataKey="mois"
          tick={CHART_DEFAULTS.axisStyle.tick}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={CHART_DEFAULTS.axisStyle.tick}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
          domain={[0, 'auto']}
        />
        <Tooltip
          {...CHART_DEFAULTS.tooltipStyle}
          formatter={(v) => [`${(Number(v) / 1000).toFixed(1)}k €`, 'CA']}
        />
        <Bar dataKey="ca" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={CHART_COLORS.c2}
              fillOpacity={0.3 + 0.7 * (entry.ca / maxCA)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
