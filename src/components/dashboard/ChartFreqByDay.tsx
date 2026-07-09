'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CHART_DEFAULTS } from '@/lib/chart-theme'

interface Props {
  data: { jour: string; freq: number; color: string }[]
}

export default function ChartFreqByDay({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }} barSize={32}>
        <CartesianGrid
          strokeDasharray={CHART_DEFAULTS.gridStyle.strokeDasharray}
          stroke={CHART_DEFAULTS.gridStyle.stroke}
          vertical={false}
        />
        <XAxis
          dataKey="jour"
          tick={CHART_DEFAULTS.axisStyle.tick}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => v.slice(0, 3)}
        />
        <YAxis
          tick={CHART_DEFAULTS.axisStyle.tick}
          axisLine={false}
          tickLine={false}
          domain={[0, 'auto']}
        />
        <Tooltip
          {...CHART_DEFAULTS.tooltipStyle}
          formatter={(v) => [`${v} pers.`, 'Fréquentation moy.']}
        />
        <Bar dataKey="freq" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
