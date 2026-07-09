import { type PredictionResult } from '@/lib/analytics/predicteur'

interface Props {
  scenarios: { label: string; color: string; result: PredictionResult }[]
}

const METRICS = [
  { key: 'freq_estimee' as const, label: 'Fréquentation', fmt: (v: number) => `${v} pers.` },
  { key: 'taux_remplissage' as const, label: 'Taux remplissage', fmt: (v: number) => `${v}%` },
  { key: 'ca_estime' as const, label: 'CA estimé', fmt: (v: number) => `${(v / 1000).toFixed(1)}k €` },
  { key: 'marge_estimee' as const, label: 'Marge estimée', fmt: (v: number) => `${(v / 1000).toFixed(1)}k €` },
]

export default function CompareResult({ scenarios }: Props) {
  const maxValues = METRICS.reduce((acc, m) => ({
    ...acc,
    [m.key]: Math.max(...scenarios.map(s => s.result[m.key])),
  }), {} as Record<string, number>)

  return (
    <div className="space-y-4">
      {METRICS.map(({ key, label, fmt }) => (
        <div key={key} className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          {scenarios.map(({ label: sLabel, color, result }) => {
            const val = result[key]
            const pct = maxValues[key] > 0 ? (val / maxValues[key]) * 100 : 0
            return (
              <div key={sLabel} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-xs w-24 text-muted-foreground">{sLabel}</span>
                <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full rounded flex items-center px-2 text-[10px] text-white font-medium"
                    style={{ width: `${pct}%`, background: color + 'cc' }}
                  >
                    {pct > 20 ? fmt(val) : ''}
                  </div>
                </div>
                <span className="text-sm font-medium w-20 text-right">{fmt(val)}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
