'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CHART_DEFAULTS } from '@/lib/chart-theme'

interface Props {
  data: { mois: string; precision: number | null }[]
}

export default function ChartPrecision({ data }: Props) {
  const filtered = data.filter(d => d.precision != null)
  if (!filtered.length) return (
    <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'var(--t3)' }}>
      Pas encore de prédictions pour construire la courbe
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={filtered} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="precGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4fe882" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4fe882" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          domain={[60, 100]}
          ticks={[60, 70, 80, 90, 100]}
          tick={CHART_DEFAULTS.axisStyle.tick}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip
          {...CHART_DEFAULTS.tooltipStyle}
          formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Précision']}
        />
        <Area
          type="monotone"
          dataKey="precision"
          stroke="#4fe882"
          strokeWidth={2.5}
          fill="url(#precGrad)"
          dot={{ fill: '#4fe882', r: 3, strokeWidth: 2, stroke: '#13131f' }}
          activeDot={{ r: 5, fill: '#4fe882', stroke: '#13131f', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
