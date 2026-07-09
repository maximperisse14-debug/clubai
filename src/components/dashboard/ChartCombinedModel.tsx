'use client'
import {
  ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Legend,
} from 'recharts'
import {
  SCORES_HEBDO, FREQ_HEBDO,
  FORECAST_SCORES_24, FORECAST_FREQ_COMBINED_24,
  CI_FREQ_LOW_24, CI_FREQ_HIGH_24,
  ALL_LABELS, MODEL_STATS, SCORE_NEUTRE,
} from '@/lib/analytics/combined-model-data'

const N = 52

const chartData = ALL_LABELS.map((semaine, i) => {
  if (i < N) {
    return { semaine, freq_histo: FREQ_HEBDO[i], score: SCORES_HEBDO[i] }
  }
  const fi = i - N
  return {
    semaine,
    freq_prevision:  FORECAST_FREQ_COMBINED_24[fi],
    score_prevision: FORECAST_SCORES_24[fi],
    ci_low:          CI_FREQ_LOW_24[fi],
    ci_high:         CI_FREQ_HIGH_24[fi],
  }
})

const TICK = { fill: 'rgba(240,240,248,0.35)', fontSize: 11 }

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#1a1a2e',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 12,
  },
  labelStyle: { color: 'rgba(240,240,248,0.5)', fontSize: 11, marginBottom: 4 },
}

const LABEL_MAP: Record<string, string> = {
  freq_histo:      'Fréquentation réelle',
  score:           'Score conditions',
  freq_prevision:  'Prévision combinée',
  score_prevision: 'Score prévu',
  ci_high:         'Borne haute IC 90%',
  ci_low:          'Borne basse IC 90%',
}

export default function ChartCombinedModel() {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--t1)' }}>
            Modèle combiné — Holt-Winters × Score
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>
            Fréquentation historique + score de conditions + prévision 6 mois
          </div>
        </div>
        <div className="flex gap-5">
          {[
            { label: 'MAPE',        value: `${MODEL_STATS.mape_combined}%` },
            { label: 'Corr. r',     value: MODEL_STATS.correlation_score_freq.toFixed(2) },
            { label: 'Score neutre',value: `${SCORE_NEUTRE}/100` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--t1)' }}>{value}</div>
              <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--t3)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 50, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="freqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#4fa3e8" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#4fa3e8" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

          <XAxis
            dataKey="semaine"
            tick={TICK}
            axisLine={false}
            tickLine={false}
            interval={Math.floor(ALL_LABELS.length / 14)}
          />

          {/* Axe Y gauche — fréquentation */}
          <YAxis
            yAxisId="freq"
            tick={TICK}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${Math.round(v)}`}
            domain={[0, 340]}
            label={{ value: 'Pers.', angle: -90, position: 'insideLeft', fill: 'rgba(240,240,248,0.22)', fontSize: 10 }}
          />

          {/* Axe Y droit — score */}
          <YAxis
            yAxisId="score"
            orientation="right"
            tick={TICK}
            axisLine={false}
            tickLine={false}
            domain={[55, 92]}
            label={{ value: 'Score', angle: 90, position: 'insideRight', fill: 'rgba(240,240,248,0.22)', fontSize: 10 }}
          />

          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={((value: any, name: string) => {
              const v = Number(value ?? 0)
              if (name === 'score' || name === 'score_prevision')
                return [`${v.toFixed(1)}/100`, LABEL_MAP[name] ?? name]
              return [`${Math.round(v)} pers.`, LABEL_MAP[name] ?? name]
            }) as any}
          />

          {/* Séparateur historique / prévision */}
          <ReferenceLine
            yAxisId="freq"
            x="S52"
            stroke="rgba(255,255,255,0.18)"
            strokeDasharray="4 4"
            label={{ value: 'Aujourd\'hui', fill: 'rgba(240,240,248,0.28)', fontSize: 10, position: 'insideTopRight' }}
          />

          {/* Zone IC 90% — remplie par superposition */}
          <Area yAxisId="freq" dataKey="ci_high" stroke="none" fill="#7b5ce5" fillOpacity={0.07}
            legendType="none" connectNulls />
          <Area yAxisId="freq" dataKey="ci_low"  stroke="none" fill="#13131f" fillOpacity={1}
            legendType="none" connectNulls />

          {/* Fréquentation historique */}
          <Area
            yAxisId="freq"
            dataKey="freq_histo"
            type="monotone"
            stroke="#4fa3e8"
            strokeWidth={2}
            fill="url(#freqGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#4fa3e8', stroke: '#1a1a2e', strokeWidth: 2 }}
            name="freq_histo"
            connectNulls
          />

          {/* Score historique */}
          <Line
            yAxisId="score"
            dataKey="score"
            type="monotone"
            stroke="#f0954a"
            strokeWidth={1.5}
            strokeOpacity={0.65}
            dot={false}
            name="score"
            connectNulls
          />

          {/* Prévision combinée */}
          <Line
            yAxisId="freq"
            dataKey="freq_prevision"
            type="monotone"
            stroke="#7b5ce5"
            strokeWidth={2.5}
            strokeDasharray="7 3"
            dot={false}
            activeDot={{ r: 4, fill: '#7b5ce5', stroke: '#1a1a2e', strokeWidth: 2 }}
            name="freq_prevision"
            connectNulls
          />

          {/* Score prévu */}
          <Line
            yAxisId="score"
            dataKey="score_prevision"
            type="monotone"
            stroke="#f0954a"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            strokeOpacity={0.45}
            dot={false}
            name="score_prevision"
            connectNulls
          />

          <Legend
            wrapperStyle={{ fontSize: 11, color: 'rgba(240,240,248,0.35)', paddingTop: 8 }}
            formatter={(value) => LABEL_MAP[value as string] ?? value}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-3 pt-3 text-[11px] leading-relaxed"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(240,240,248,0.32)' }}>
        La courbe orange (score de conditions) fluctue selon la météo, la concurrence et le type d'événement.
        Elle module la base Holt-Winters pour produire la prévision violette.
        Zone semi-transparente = intervalle de confiance 90% (bootstrap × 1000).
      </div>
    </div>
  )
}
