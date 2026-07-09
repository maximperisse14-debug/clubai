'use client'
import {
  ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import {
  CA_HEBDO, FORECAST_CA_COMBINED_24,
  FORECAST_SCORES_24, SCORES_HEBDO,
  ALL_LABELS, MODEL_STATS,
} from '@/lib/analytics/combined-model-data'

const N = 52

const chartData = ALL_LABELS.map((semaine, i) => {
  if (i < N) return { semaine, ca_histo: CA_HEBDO[i], score: SCORES_HEBDO[i] }
  const fi = i - N
  return { semaine, ca_prevision: FORECAST_CA_COMBINED_24[fi], score_prevision: FORECAST_SCORES_24[fi] }
})

const TICK = { fill: 'rgba(240,240,248,0.35)', fontSize: 11 }

export default function ChartCACombined() {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--t1)' }}>
            CA hebdomadaire — prévision combinée 6 mois
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>
            Holt-Winters × Score de conditions · MAPE ≈ {MODEL_STATS.mape_combined}%
          </div>
        </div>
        <div className="flex gap-5">
          {[
            { label: 'MAPE CA', value: '~10.6%' },
            { label: 'Semaines', value: `${MODEL_STATS.n_semaines}` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--t1)' }}>{value}</div>
              <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--t3)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 50, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7b5ce5" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#7b5ce5" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

          <XAxis dataKey="semaine" tick={TICK} axisLine={false} tickLine={false}
            interval={Math.floor(ALL_LABELS.length / 14)} />

          <YAxis yAxisId="ca" tick={TICK} axisLine={false} tickLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
            label={{ value: '€', angle: -90, position: 'insideLeft', fill: 'rgba(240,240,248,0.22)', fontSize: 10 }}
          />
          <YAxis yAxisId="score" orientation="right" tick={TICK} axisLine={false} tickLine={false}
            domain={[55, 92]} tickFormatter={v => `${v}`}
            label={{ value: 'Score', angle: 90, position: 'insideRight', fill: 'rgba(240,240,248,0.22)', fontSize: 10 }}
          />

          <Tooltip
            contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 12, padding: '10px 14px', fontSize: 12 }}
            labelStyle={{ color: 'rgba(240,240,248,0.5)', fontSize: 11, marginBottom: 4 }}
            formatter={((value: any, name: string) => {
              const v = Number(value ?? 0)
              if (name === 'score' || name === 'score_prevision')
                return [`${v.toFixed(1)}/100`, 'Score conditions']
              if (name === 'ca_histo')
                return [`${Math.round(v).toLocaleString('fr-FR')} €`, 'CA réel']
              return [`${Math.round(v).toLocaleString('fr-FR')} €`, 'CA prévu']
            }) as any}
          />

          <ReferenceLine yAxisId="ca" x="S52" stroke="rgba(255,255,255,0.18)" strokeDasharray="4 4"
            label={{ value: 'Aujourd\'hui', fill: 'rgba(240,240,248,0.28)', fontSize: 10, position: 'insideTopRight' }} />

          {/* CA historique */}
          <Area yAxisId="ca" dataKey="ca_histo" type="monotone"
            stroke="#7b5ce5" strokeWidth={2} fill="url(#caGrad)"
            dot={false} name="ca_histo" connectNulls />

          {/* Score historique */}
          <Line yAxisId="score" dataKey="score" type="monotone"
            stroke="#f0954a" strokeWidth={1.5} strokeOpacity={0.65} dot={false} connectNulls />

          {/* CA prévu */}
          <Line yAxisId="ca" dataKey="ca_prevision" type="monotone"
            stroke="#d45fa8" strokeWidth={2.5} strokeDasharray="7 3"
            dot={false} name="ca_prevision" connectNulls />

          {/* Score prévu */}
          <Line yAxisId="score" dataKey="score_prevision" type="monotone"
            stroke="#f0954a" strokeWidth={1.5} strokeDasharray="4 3"
            strokeOpacity={0.45} dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
