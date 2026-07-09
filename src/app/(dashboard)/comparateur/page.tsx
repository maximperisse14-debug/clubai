'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PredicteurForm, { type PredicteurFormValues } from '@/components/predicteur/PredicteurForm'
import { useClub } from '@/hooks/useClub'
import { useDJs } from '@/hooks/useDJs'
import type { PredictionScoreResult } from '@/lib/predicteur/scoring-engine'

const SCENARIOS = [
  { label: 'Scénario A', color: '#7c5cfc' },
  { label: 'Scénario B', color: '#30c98e' },
  { label: 'Scénario C', color: '#f5a623' },
]

type ScenarioResult = PredictionScoreResult & { label: string; color: string; nomEvenement: string }

const METRICS: { key: keyof PredictionScoreResult; label: string; fmt: (v: number) => string }[] = [
  { key: 'frequentationEstimee', label: 'Fréquentation', fmt: v => `${Math.round(v)} pers.` },
  { key: 'caEstime',             label: 'CA estimé',     fmt: v => `${Math.round(v).toLocaleString('fr-FR')} €` },
  { key: 'scoreGlobal',         label: 'Score thème',   fmt: v => `${v.toFixed(1)}/100` },
]

export default function ComparateurPage() {
  const { data: club } = useClub()
  const { data: djs = [] } = useDJs(club?.id)
  const [results, setResults]   = useState<(ScenarioResult | null)[]>([null, null, null])
  const [loading, setLoading]   = useState([false, false, false])
  const [errors, setErrors]     = useState<(string | null)[]>([null, null, null])

  async function handleSubmit(index: number, values: PredicteurFormValues) {
    setLoading(prev => { const n = [...prev]; n[index] = true; return n })
    setErrors(prev => { const n = [...prev]; n[index] = null; return n })
    try {
      const res = await fetch('/api/predicteur/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date:          format(values.date, 'yyyy-MM-dd'),
          typeEvenement: values.typeEvenement,
          nomEvenement:  values.nomEvenement,
          djId:          values.djId,
          djNom:         values.djNom,
        }),
      })
      if (!res.ok) {
        const e = await res.json() as { error?: string }
        setErrors(prev => { const n = [...prev]; n[index] = e.error ?? 'Erreur serveur'; return n })
        return
      }
      const data = await res.json() as PredictionScoreResult
      setResults(prev => {
        const n = [...prev]
        n[index] = { ...data, label: SCENARIOS[index].label, color: SCENARIOS[index].color, nomEvenement: values.nomEvenement }
        return n
      })
    } catch {
      setErrors(prev => { const n = [...prev]; n[index] = 'Erreur réseau'; return n })
    } finally {
      setLoading(prev => { const n = [...prev]; n[index] = false; return n })
    }
  }

  const filled = results.filter((r): r is ScenarioResult => r !== null)
  const maxima = METRICS.reduce((acc, m) => ({
    ...acc,
    [m.key]: Math.max(...filled.map(r => r[m.key] as number), 1),
  }), {} as Record<string, number>)

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-grad">Multi-scénarios</div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--t1)' }}>Comparateur</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>
          Compare jusqu'à 3 configurations de soirée côte à côte.
        </p>
      </div>

      {/* 3 scenario cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {SCENARIOS.map((s, i) => (
          <Card key={s.label} style={{ borderTop: `3px solid ${s.color}` }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm" style={{ color: s.color }}>{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <PredicteurForm
                djs={djs}
                onSubmit={v => handleSubmit(i, v)}
                loading={loading[i]}
                submitLabel="Calculer"
              />
              {errors[i] && <p className="text-xs text-red-400 text-center mt-2">{errors[i]}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison table */}
      {filled.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparaison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Headers */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `120px repeat(${filled.length}, 1fr)` }}>
              <div />
              {filled.map(r => (
                <div key={r.label} className="text-center">
                  <div className="text-xs font-semibold" style={{ color: r.color }}>{r.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{r.nomEvenement}</div>
                </div>
              ))}
            </div>

            {/* Metrics */}
            {METRICS.map(m => (
              <div key={m.key} className="space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</div>
                {filled.map(r => {
                  const val = r[m.key] as number
                  const pct = maxima[m.key] > 0 ? (val / maxima[m.key]) * 100 : 0
                  return (
                    <div key={r.label} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-muted-foreground shrink-0">{r.label}</div>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full rounded flex items-center px-2 text-xs font-medium text-white transition-all"
                          style={{ width: `${Math.max(pct, 8)}%`, background: r.color }}
                        >
                          {m.fmt(val)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Score thème comparison */}
            <div className="pt-2 border-t border-border space-y-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Score thème × Prévision std</div>
              {filled.map(r => {
                const col = r.scoreTheme >= 75 ? '#30c98e' : r.scoreTheme >= 65 ? '#f5a623' : '#ff6b6b'
                return (
                  <div key={r.label} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-muted-foreground shrink-0">{r.label}</div>
                    <div className="flex-1 text-xs">
                      <span style={{ color: col }} className="font-semibold">{r.scoreTheme.toFixed(1)}/100</span>
                      <span className="text-muted-foreground ml-2">
                        std {r.hwBase.freq} pers. × {r.coeff >= 1 ? '+' : ''}{((r.coeff - 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
