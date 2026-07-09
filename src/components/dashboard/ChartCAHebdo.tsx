'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CHART_COLORS, CHART_DEFAULTS } from '@/lib/chart-theme'

interface Props {
  data: { semaine: string; caMoyen: number; nbSoirees: number }[]
}

export default function ChartCAHebdo({ data }: Props) {
  if (!data.length) return (
    <div className="h-[220px] flex items-center justify-center text-sm" style={{ color: 'var(--t3)' }}>
      Pas encore assez de données pour afficher cette tendance.
    </div>
  )

  const interval = Math.max(1, Math.floor(data.length / 12))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="caHebdoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={CHART_COLORS.c2} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.c2} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray={CHART_DEFAULTS.gridStyle.strokeDasharray}
          stroke={CHART_DEFAULTS.gridStyle.stroke}
          vertical={false}
        />
        <XAxis
          dataKey="semaine"
          tick={CHART_DEFAULTS.axisStyle.tick}
          tickFormatter={(v: string) => `S${v.split('-S')[1]}`}
          interval={interval}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={CHART_DEFAULTS.axisStyle.tick}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          {...CHART_DEFAULTS.tooltipStyle}
          formatter={((value: any, _: string, props: any) => [
            `${Math.round(Number(value)).toLocaleString('fr-FR')} €`,
            `CA moy. (${props.payload.nbSoirees} soirée${props.payload.nbSoirees > 1 ? 's' : ''})`,
          ]) as any}
          labelFormatter={((label: any) => {
            const [an, s] = String(label).split('-S')
            return `Semaine ${s} — ${an}`
          }) as any}
        />
        <Area
          type="monotone"
          dataKey="caMoyen"
          stroke={CHART_COLORS.c2}
          strokeWidth={2}
          fill="url(#caHebdoGrad)"
          connectNulls
          dot={false}
          activeDot={{ r: 4, fill: CHART_COLORS.c2, stroke: '#13131f', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
