'use client'
import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { type NormalisedEntry, getRankShift } from '@/lib/analytics/normalisation'
import JourPips from './JourPips'
import ShiftBadge from './ShiftBadge'
import InsightBox from './InsightBox'

type SortMode = 'norm' | 'brut'
type Metric = 'freq' | 'ca' | 'panier'

interface Props {
  entries: NormalisedEntry[]
  metric: Metric
  insight: string
  normLabel: string
  brutLabel: string
  normFmt: (v: number) => string
  brutFmt: (v: number) => string
  showJourPips?: boolean
  showCtx?: boolean
}

const RANK_COLORS = ['#f0954a', 'rgba(240,240,248,0.48)', '#d45fa8']

export default function NormalisedRanking({
  entries, metric, insight, normLabel, brutLabel, normFmt, brutFmt,
  showJourPips = false, showCtx = false,
}: Props) {
  const [sortMode, setSortMode] = useState<SortMode>('norm')

  const normKey = `impact_pct_${metric}` as keyof NormalisedEntry
  const brutKey = metric === 'freq' ? 'freq_brute' : metric === 'ca' ? 'ca_brut' : 'panier_brut'

  const normRanks = useMemo(() => {
    return [...entries]
      .sort((a, b) => (b[normKey] as number) - (a[normKey] as number))
      .reduce((acc, e, i) => ({ ...acc, [e.label]: i + 1 }), {} as Record<string, number>)
  }, [entries, normKey])

  const brutRanks = useMemo(() => {
    return [...entries]
      .sort((a, b) => (b[brutKey] as number) - (a[brutKey] as number))
      .reduce((acc, e, i) => ({ ...acc, [e.label]: i + 1 }), {} as Record<string, number>)
  }, [entries, brutKey])

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) =>
      sortMode === 'norm'
        ? (b[normKey] as number) - (a[normKey] as number)
        : (b[brutKey] as number) - (a[brutKey] as number)
    )
  }, [entries, sortMode, normKey, brutKey])

  const allNormVals = entries.map(e => e[normKey] as number)
  const maxAbs = Math.max(...allNormVals.map(Math.abs), 1)
  const maxBrut = Math.max(...entries.map(e => e[brutKey] as number), 1)
  const hasNeg = allNormVals.some(v => v < 0)

  return (
    <div className="space-y-4">
      {/* Boutons toggle */}
      <div className="flex gap-2">
        {(['norm', 'brut'] as SortMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: sortMode === mode ? 'rgba(123,92,229,0.2)' : 'transparent',
              border: sortMode === mode ? '1px solid rgba(123,92,229,0.4)' : '1px solid var(--b1)',
              color: sortMode === mode ? 'var(--c2)' : 'var(--t2)',
            }}
          >
            {mode === 'norm' ? 'Score normalisé' : 'Valeur brute'}
          </button>
        ))}
      </div>

      <InsightBox>{insight}</InsightBox>

      <div className="space-y-1">
        {sorted.map((entry, i) => {
          const rank     = i + 1
          const normVal  = entry[normKey] as number
          const brutVal  = entry[brutKey] as number
          const isPos    = normVal >= 0
          const pct      = (Math.abs(normVal) / maxAbs) * 100
          const bpct     = (brutVal / maxBrut) * 100
          const shift    = getRankShift(entry.label, normRanks, brutRanks, sortMode)
          const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : 'var(--t3)'

          return (
            <div
              key={entry.label}
              className="flex items-center gap-3 py-2.5 rounded-xl px-2 mb-1"
              style={{
                background: isPos ? 'rgba(79,232,130,0.04)' : 'rgba(240,149,74,0.04)',
                border: isPos
                  ? '1px solid rgba(79,232,130,0.10)'
                  : '1px solid rgba(240,149,74,0.10)',
              }}
            >
              {/* Rang */}
              <div className="w-7 text-right text-base font-bold shrink-0" style={{ color: rankColor }}>
                {rank}
              </div>

              {/* Label */}
              <div className="min-w-[130px] shrink-0">
                <div className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--t1)' }}>
                  {entry.label}
                  {rank === 1 && sortMode === 'norm' && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                      style={{ borderColor: 'rgba(240,149,74,0.5)', color: '#f0954a' }}
                    >
                      Top
                    </Badge>
                  )}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>
                  {entry.nb_soirees} soirées
                  {entry.sat && ` · ★${entry.sat.toFixed(1)}`}
                </div>
                {showCtx && entry.ctx && (
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>{entry.ctx}</div>
                )}
                {showJourPips && entry.jours && <JourPips jours={entry.jours} />}
              </div>

              {/* Barres */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--t3)' }}>{normLabel}</div>
                {hasNeg ? (
                  <div className="relative h-5 rounded overflow-hidden" style={{ background: 'var(--s3)' }}>
                    <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: 'var(--b2)' }} />
                    {isPos ? (
                      <div
                        className="absolute left-1/2 top-0 h-full rounded-r"
                        style={{
                          width: `${pct / 2}%`,
                          background: 'linear-gradient(90deg,#4fe882,#30c98e)',
                          transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                        }}
                      />
                    ) : (
                      <div
                        className="absolute right-1/2 top-0 h-full rounded-l"
                        style={{
                          width: `${pct / 2}%`,
                          background: 'linear-gradient(270deg,#f09595,#e05555)',
                          transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="h-5 rounded overflow-hidden" style={{ background: 'var(--s3)' }}>
                    <div
                      className="h-full rounded flex items-center justify-end pr-2 text-[10px] font-semibold text-white"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: isPos
                          ? 'linear-gradient(90deg,#4fe882,#30c98e)'
                          : 'linear-gradient(90deg,#f09595,#e05555)',
                        transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                      }}
                    >
                      {pct > 25 ? normFmt(normVal) : ''}
                    </div>
                  </div>
                )}
                <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--t3)' }}>{brutLabel}</div>
                <div className="h-2 rounded overflow-hidden" style={{ background: 'var(--s3)' }}>
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${bpct}%`,
                      background: 'rgba(255,255,255,0.15)',
                      transition: 'width 0.4s',
                    }}
                  />
                </div>
              </div>

              {/* Valeurs */}
              <div className="text-right min-w-[68px] shrink-0">
                <div className="text-sm font-semibold" style={{ color: isPos ? '#4fe882' : '#f09595' }}>
                  {normFmt(normVal)}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{brutFmt(brutVal)}</div>
              </div>

              <ShiftBadge shift={shift} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
