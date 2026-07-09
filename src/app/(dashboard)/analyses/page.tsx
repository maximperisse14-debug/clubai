'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useClub } from '@/hooks/useClub'
import { useCoefficients } from '@/hooks/useCoefficients'

const ICONES_TYPES: Record<string, string> = {
  'Étudiante':       '🎓',
  'Latino':          '💃',
  'Techno':          '🎛',
  'Années 80/90':    '📼',
  'House':           '🎧',
  'Afterwork':       '🍹',
  'Match & DJ set':  '⚽',
  'Open format':     '🔀',
  'Blind test':      '🎤',
  'Live acoustique': '🎸',
  'Généraliste':     '🎵',
  'Karaoké':         '🎙',
}

interface RankEntry {
  label: string
  icon?: string
  impact_freq: number
  impact_ca: number
  brut_freq: number
  brut_ca: number
  nb: number
}

function mapCoeff(c: any, isDJ: boolean): RankEntry {
  return {
    label:       c.valeur,
    icon:        isDJ ? undefined : ICONES_TYPES[c.valeur],
    impact_freq: Number(c.impact_pct_freq ?? 0),
    impact_ca:   Number(c.impact_pct_ca   ?? 0),
    brut_freq:   Number(c.freq_brute_moy  ?? 0),
    brut_ca:     Number(c.ca_brut_moy     ?? 0),
    nb:          Number(c.nb_soirees      ?? 0),
  }
}

function djInitials(label: string) {
  return label.replace('DJ ', '').replace('Sans ', 'S.').slice(0, 2)
}

interface RankColumnProps {
  title: string
  entries: RankEntry[]
  isDJ: boolean
  isLoading: boolean
}

function RankColumn({ title, entries, isDJ, isLoading }: RankColumnProps) {
  const [metric, setMetric] = useState<'freq' | 'ca'>('freq')

  if (isLoading) {
    return (
      <Card className="p-5 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-7 w-40" />
        </div>
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </Card>
    )
  }

  if (!entries.length) {
    return (
      <Card className="p-5">
        <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--t1)' }}>{title}</h3>
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Pas encore assez de données.</p>
          <p className="text-xs" style={{ color: 'var(--t3)' }}>Ajoute au moins 10 soirées par DJ / type pour un classement fiable.</p>
        </div>
      </Card>
    )
  }

  const sorted = [...entries].sort((a, b) =>
    metric === 'freq' ? b.impact_freq - a.impact_freq : b.impact_ca - a.impact_ca
  )
  const maxAbs  = Math.max(...entries.map(e => Math.abs(metric === 'freq' ? e.impact_freq : e.impact_ca)), 1)
  const maxBrut = Math.max(...entries.map(e => metric === 'freq' ? e.brut_freq : e.brut_ca), 1)
  const normFmt = (v: number) => (v > 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + '%'
  const brutFmt = (v: number) =>
    metric === 'freq'
      ? Math.round(v) + ' pers.'
      : (v / 1000).toFixed(1).replace('.', ',') + 'k €'

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{title}</h3>
        <div className="flex gap-1.5">
          {(['freq', 'ca'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className="h-7 px-3 rounded-full text-xs font-semibold transition-all"
              style={{
                background: metric === m ? 'rgba(123,92,229,0.2)' : 'transparent',
                border:     metric === m ? '1px solid rgba(123,92,229,0.4)' : '1px solid var(--b1)',
                color:      metric === m ? 'var(--c2)' : 'var(--t2)',
              }}
            >
              {m === 'freq' ? 'Fréquentation' : 'CA'}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {sorted.map((e, i) => {
          const impact = metric === 'freq' ? e.impact_freq : e.impact_ca
          const brut   = metric === 'freq' ? e.brut_freq   : e.brut_ca
          const isPos  = impact >= 0
          const pct    = Math.min((Math.abs(impact) / maxAbs) * 100, 100)
          const bpct   = (brut / maxBrut) * 100

          return (
            <div
              key={e.label}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors"
              style={{
                background: isPos ? 'rgba(79,232,130,0.05)' : 'rgba(240,149,74,0.05)',
                border:     isPos ? '1px solid rgba(79,232,130,0.10)' : '1px solid rgba(240,149,74,0.10)',
              }}
            >
              {/* Rang */}
              <div className="w-4 text-right text-xs tabular-nums shrink-0" style={{ color: 'var(--t3)' }}>
                {i + 1}
              </div>

              {/* Avatar */}
              {isDJ ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 select-none"
                  style={{ background: 'var(--s3)', color: 'var(--t2)' }}
                >
                  {djInitials(e.label)}
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 select-none"
                  style={{ background: 'var(--s3)' }}
                >
                  {e.icon}
                </div>
              )}

              {/* Label */}
              <div className="w-[100px] shrink-0">
                <div className="text-[13px] font-semibold leading-tight truncate" style={{ color: 'var(--t1)' }}>
                  {e.label}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>{e.nb} soirées</div>
              </div>

              {/* Barres */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="h-4 rounded overflow-hidden" style={{ background: 'var(--s3)' }}>
                  <div
                    className="h-full rounded transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      background: isPos
                        ? 'linear-gradient(90deg,#4fe882,#30c98e)'
                        : 'linear-gradient(90deg,#f09595,#e05555)',
                    }}
                  />
                </div>
                <div className="h-1.5 rounded overflow-hidden" style={{ background: 'var(--s3)' }}>
                  <div
                    className="h-full rounded transition-all duration-300"
                    style={{ width: `${bpct}%`, background: 'rgba(255,255,255,0.18)' }}
                  />
                </div>
              </div>

              {/* Valeurs */}
              <div className="text-right min-w-[62px] shrink-0">
                <div
                  className="text-[13px] font-bold tabular-nums"
                  style={{ color: isPos ? '#4fe882' : '#f09595' }}
                >
                  {normFmt(impact)}
                </div>
                <div className="text-[10px] mt-0.5 tabular-nums" style={{ color: 'var(--t3)' }}>
                  {brutFmt(brut)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: '1px solid var(--b1)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded" style={{ background: 'linear-gradient(90deg,#4fe882,#30c98e)' }} />
          <span className="text-[10px]" style={{ color: 'var(--t3)' }}>Effet normalisé positif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded" style={{ background: 'linear-gradient(90deg,#f09595,#e05555)' }} />
          <span className="text-[10px]" style={{ color: 'var(--t3)' }}>Effet normalisé négatif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded" style={{ background: 'rgba(255,255,255,0.18)' }} />
          <span className="text-[10px]" style={{ color: 'var(--t3)' }}>Valeur brute</span>
        </div>
      </div>
    </Card>
  )
}

export default function AnalysesPage() {
  const { data: club } = useClub()
  const { data: djCoeffs,   isLoading: djLoading }   = useCoefficients(club?.id ?? '', 'dj')
  const { data: typeCoeffs, isLoading: typeLoading } = useCoefficients(club?.id ?? '', 'type')

  const djEntries   = (djCoeffs   ?? []).map(c => mapCoeff(c, true))
  const typeEntries = (typeCoeffs ?? []).map(c => mapCoeff(c, false))

  return (
    <div className="space-y-5 p-6">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-grad">
          Analyses normalisées
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--t1)' }}>
          Classement à conditions équivalentes
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--t2)' }}>
          Jour, mois, météo et concurrence neutralisés — seul l'effet propre au DJ ou au thème compte.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <RankColumn title="DJs" entries={djEntries} isDJ={true} isLoading={djLoading} />
        <RankColumn title="Événements" entries={typeEntries} isDJ={false} isLoading={typeLoading} />
      </div>
    </div>
  )
}
