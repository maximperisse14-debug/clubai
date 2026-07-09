'use client'
import { useRef, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Chart, registerables } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useDailyData } from '@/hooks/useDailyData'
import type { JourData } from '@/lib/analytics/daily-data'
import type { SoireePredite } from '@/lib/predicteur/types'

Chart.register(...registerables, annotationPlugin)

interface Props {
  metric: 'freq' | 'ca'
  onMetricChange: (m: 'freq' | 'ca') => void
  soireePredite: SoireePredite | null
}

const FONT        = '"Plus Jakarta Sans"'
const WINDOW_SIZE = 45   // jours ouverts simultanément (~11 semaines)
const STEP        = 12   // pas de navigation (3 semaines)
const SIM_DS_IDX  = 4    // index du dataset simulation

export default function GraphiquePrincipal({ metric, onMetricChange, soireePredite }: Props) {
  const { data: jours, isLoading } = useDailyData()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<Chart | null>(null)
  const isFreq    = metric === 'freq'

  const [windowStart, setWindowStart] = useState(0)

  // ── Refs pour les callbacks Chart.js (évite les stale closures) ─────────────
  const joursVisiblesRef  = useRef<JourData[]>([])
  const soireePrediteRef  = useRef<SoireePredite | null>(null)
  const isFreqRef         = useRef(isFreq)

  // ── Jours complets incluant l'entrée synthétique si date hors plage HW ──────
  const joursPlusSimulation = useMemo((): JourData[] => {
    if (!jours) return []
    if (!soireePredite) return jours
    const simDateStr = format(soireePredite.date, 'yyyy-MM-dd')
    if (jours.some(j => j.date === simDateStr)) return jours
    const synth: JourData = {
      date:  simDateStr,
      label: format(soireePredite.date, 'EEE d MMM', { locale: fr }),
      type:  'futur',
    }
    return [...jours, synth].sort((a, b) => a.date.localeCompare(b.date))
  }, [jours, soireePredite])

  // ── Fenêtre centrée sur JOUR_J au chargement initial ────────────────────────
  useEffect(() => {
    if (!joursPlusSimulation.length) return
    const TODAY = format(new Date(), 'yyyy-MM-dd')
    const idx   = joursPlusSimulation.findIndex(j => j.date >= TODAY)
    const pivot = idx !== -1 ? idx : joursPlusSimulation.length - 1
    setWindowStart(Math.max(0, pivot - Math.floor(WINDOW_SIZE / 2)))
  }, [jours])  // seulement quand les données de base arrivent

  // ── Fenêtre visible ──────────────────────────────────────────────────────────
  const joursVisibles = useMemo(
    () => joursPlusSimulation.slice(windowStart, windowStart + WINDOW_SIZE),
    [joursPlusSimulation, windowStart],
  )

  // Mettre les refs à jour à chaque render (avant les effets)
  joursVisiblesRef.current  = joursVisibles
  soireePrediteRef.current  = soireePredite
  isFreqRef.current         = isFreq

  // ── Auto-scroll vers la date simulée ────────────────────────────────────────
  useEffect(() => {
    if (!soireePredite || !joursPlusSimulation.length) return
    const simDateStr = format(soireePredite.date, 'yyyy-MM-dd')
    const simIdx     = joursPlusSimulation.findIndex(j => j.date === simDateStr)
    if (simIdx === -1) return
    const alreadyVisible = simIdx >= windowStart && simIdx < windowStart + WINDOW_SIZE
    if (alreadyVisible) return
    setWindowStart(Math.max(0, Math.min(
      joursPlusSimulation.length - WINDOW_SIZE,
      simIdx - Math.floor(WINDOW_SIZE / 2),
    )))
  }, [soireePredite, joursPlusSimulation])
  // windowStart absent des deps → pas de boucle infinie

  // ── Helper : mettre à jour le dataset simulation ─────────────────────────────
  function updateSimulationPoint() {
    const chart  = chartRef.current
    if (!chart) return
    const simDs  = chart.data.datasets[SIM_DS_IDX]
    const jours  = joursVisiblesRef.current
    const soiree = soireePrediteRef.current
    const isF    = isFreqRef.current

    if (!soiree) {
      ;(simDs as any).data = []
      simDs.label = '⭐ Soirée simulée'
      return
    }

    const dateStr = format(soiree.date, 'yyyy-MM-dd')
    const idx     = jours.findIndex(j => j.date.slice(0, 10) === dateStr)

    if (idx === -1) {
      ;(simDs as any).data = []
      simDs.label = '⭐ Soirée simulée'
      return
    }

    const label = jours[idx].label
    const val   = isF ? soiree.freq : soiree.ca

    // Label dynamique avec l'écart vs prévision standard
    const prevStd = isF ? jours[idx]?.prev_freq : jours[idx]?.prev_ca
    if (prevStd) {
      const ecart    = val - prevStd
      const ecartPct = (ecart / prevStd * 100).toFixed(1)
      const signe    = ecart >= 0 ? '+' : ''
      simDs.label = `⭐ ${soiree.nomEvenement || 'Soirée simulée'} (${signe}${ecartPct}% vs std)`
    }

    // Dataset scatter : un seul point {x: label, y: valeur}
    ;(simDs as any).data = [{ x: label, y: val }]
  }

  // ── useEffect 1 : créer le chart UNE SEULE FOIS ──────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Import dynamique pour éviter l'accès à window côté serveur (SSR)
    let cancelled = false
    void import('chartjs-plugin-zoom').then(({ default: ZoomPlugin }) => {
      if (cancelled || !canvasRef.current) return
      Chart.register(ZoomPlugin)

      chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          // [0] IC haut
          { label: '_ic_high', data: [], borderColor: 'transparent', fill: '+1' as any, backgroundColor: 'rgba(123,92,229,0.10)', pointRadius: 0, tension: 0.4 },
          // [1] IC bas
          { label: '_ic_low',  data: [], borderColor: 'transparent', fill: false as any, backgroundColor: 'transparent', pointRadius: 0, tension: 0.4 },
          // [2] Prévision HW × scoring (ligne violette pointillée)
          { label: 'Prévision HW × scoring', data: [], borderColor: '#7b5ce5', borderWidth: 2.5, borderDash: [7, 3], backgroundColor: 'transparent', fill: false as any, pointRadius: 0, pointHoverRadius: 5, tension: 0.3 },
          // [3] Réalisé (ligne bleue)
          {
            label: 'Réalisé',
            data: [],
            borderColor: '#4fa3e8',
            borderWidth: 2.5,
            backgroundColor: (sCtx: any) => {
              const { ctx: c, chartArea } = sCtx.chart
              if (!chartArea) return 'rgba(79,163,232,0.10)'
              const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
              g.addColorStop(0, 'rgba(79,163,232,0.20)')
              g.addColorStop(1, 'rgba(79,163,232,0)')
              return g
            },
            fill: true,
            // Utilise la ref pour éviter la stale closure
            pointRadius: (sCtx: any) => {
              const j = joursVisiblesRef.current[sCtx.dataIndex]
              if (!j || sCtx.parsed.y === null || sCtx.parsed.y === undefined) return 0
              return j.type === 'passe_avec_soiree' ? 5 : 2
            },
            pointBackgroundColor: (sCtx: any) =>
              joursVisiblesRef.current[sCtx.dataIndex]?.type === 'passe_avec_soiree'
                ? '#4fa3e8'
                : 'rgba(79,163,232,0.45)',
            pointBorderColor: '#0d0d14',
            pointBorderWidth: 2,
            pointHoverRadius: 7,
            tension: 0.3,
          },
          // [4] Soirée simulée ⭐ — dataset scatter pour garantir l'affichage immédiat
          {
            type: 'scatter' as any,
            label: '⭐ Soirée simulée',
            data: [],
            borderColor: '#FFD700',
            backgroundColor: '#FFD700',
            pointRadius: 14,
            pointHoverRadius: 16,
            pointStyle: 'star',
            pointBorderColor: '#FFD700',
            pointBorderWidth: 0,
            xAxisID: 'x',
            yAxisID: 'y',
            order: 99,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false, axis: 'x' },
        animation: false,
        plugins: {
          zoom: {
            pan:  { enabled: true, mode: 'x', threshold: 5 },
            zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: 'rgba(240,240,248,0.4)',
              font: { size: 11, family: FONT },
              boxWidth: 16,
              padding: 12,
              filter: (item: any) => !item.text.startsWith('_'),
            },
          },
          tooltip: {
            backgroundColor: '#1a1a2e',
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            padding: 12,
            titleColor: 'rgba(240,240,248,0.5)',
            titleFont: { size: 11, family: FONT },
            bodyColor: '#f0f0f8',
            bodyFont: { size: 12, family: FONT },
            filter: (item: any) => {
              if (item.dataset.label?.startsWith('_')) return false
              if (item.parsed.y == null) return false
              return true
            },
            callbacks: {
              title: (items: any[]) => {
                // item.label = la chaîne de l'axe X (fonctionne pour line et scatter)
                const lbl = items[0].label
                const j   = lbl
                  ? joursVisiblesRef.current.find(jj => jj.label === lbl)
                  : joursVisiblesRef.current[items[0].dataIndex]
                return j ? format(new Date(j.date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr }) : ''
              },
              beforeBody: (items: any[]) => {
                // N'afficher les infos soirée que sur les points réalisés (pas l'étoile)
                const nonSim = items.filter((i: any) => !i.dataset.label?.startsWith('⭐'))
                if (nonSim.length === 0) return []
                const j = joursVisiblesRef.current[nonSim[0].dataIndex]
                if (!j || j.type !== 'passe_avec_soiree') return []
                const lines: string[] = []
                if (j.nom_evenement)  lines.push(`🎵  ${j.nom_evenement}`)
                if (j.dj_nom)         lines.push(`🎧  ${j.dj_nom}`)
                if (j.type_evenement) lines.push(`📌  ${j.type_evenement}`)
                if (lines.length)     lines.push('─────────────────')
                return lines
              },
              label: (item: any) => {
                const name = item.dataset.label ?? ''
                if (name.startsWith('_')) return ''
                const val = item.parsed.y
                if (val == null) return ''
                const isF = isFreqRef.current
                const fmt = isF
                  ? `${Math.round(val)} pers.`
                  : `${Math.round(val).toLocaleString('fr-FR')} €`
                return `${name} : ${fmt}`
              },
              afterBody: (items: any[]) => {
                const isF   = isFreqRef.current
                const lines: string[] = []

                // Précision pour les soirées réalisées
                const realise = items.find((i: any) => i.dataset.label === 'Réalisé')
                if (realise) {
                  const j = joursVisiblesRef.current[realise.dataIndex]
                  if (j?.precision_freq != null) {
                    const e = j.precision_freq >= 90 ? '🟢' : j.precision_freq >= 75 ? '🟡' : '🔴'
                    lines.push('', `${e}  Précision fréquentation : ${j.precision_freq.toFixed(1)}%`)
                  }
                  if (j?.precision_ca != null) {
                    const e = j.precision_ca >= 90 ? '🟢' : j.precision_ca >= 75 ? '🟡' : '🔴'
                    lines.push(`${e}  Précision CA : ${j.precision_ca.toFixed(1)}%`)
                  }
                }

                // IC 90% pour les jours futurs
                const prevision = items.find((i: any) => i.dataset.label === 'Prévision HW × scoring')
                if (prevision) {
                  const j = joursVisiblesRef.current[prevision.dataIndex]
                  if (j?.type === 'futur' && j.prev_freq_low && j.prev_freq_high) {
                    lines.push('', `IC 90% : ${isF
                      ? `${j.prev_freq_low} – ${j.prev_freq_high} pers.`
                      : `${((j.prev_ca_low ?? 0) / 1000).toFixed(1)}k – ${((j.prev_ca_high ?? 0) / 1000).toFixed(1)}k €`
                    }`)
                  }
                }

                return lines
              },
            },
          } as any,
          annotation: {
            annotations: {
              jourJ: {
                type: 'line',
                xMin: '' as any,
                xMax: '' as any,
                borderColor: 'rgba(255,255,255,0.25)',
                borderWidth: 1.5,
                borderDash: [5, 4],
                label: {
                  display: false,
                  content: "Aujourd'hui",
                  position: 'start',
                  color: 'rgba(240,240,248,0.4)',
                  font: { size: 10, family: FONT },
                  backgroundColor: 'transparent',
                  padding: { top: 0, bottom: 0, left: 4, right: 4 },
                  yAdjust: -14,
                },
              },
            },
          } as any,
        },
        scales: {
          x: {
            ticks: { color: 'rgba(240,240,248,0.35)', font: { size: 10, family: FONT }, maxTicksLimit: 12, maxRotation: 0 },
            grid:   { color: 'rgba(255,255,255,0.04)' },
            border: { display: false },
          },
          y: {
            ticks: {
              color: 'rgba(240,240,248,0.35)',
              font: { size: 11, family: FONT },
              callback: (v: any) => isFreqRef.current
                ? `${Math.round(v)}`
                : `${(Number(v) / 1000).toFixed(1)}k`,
            },
            grid:   { color: 'rgba(255,255,255,0.04)' },
            border: { display: false },
          },
        },
      },
    } as any)
  })  // ferme .then()

  return () => {
    cancelled = true
    chartRef.current?.destroy()
    chartRef.current = null
  }
}, [])  // ← tableau vide : créé UNE SEULE FOIS, jamais reconstruit

  // ── useEffect 2 : mettre à jour les données quand la fenêtre ou la métrique change
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !joursVisibles.length) return

    const isF = isFreq

    chart.data.labels = joursVisibles.map(j => j.label)

    // [0] IC haut
    chart.data.datasets[0].data = joursVisibles.map(j =>
      j.type === 'futur' ? (isF ? (j.prev_freq_high ?? null) : (j.prev_ca_high ?? null)) : null
    )
    // [1] IC bas
    chart.data.datasets[1].data = joursVisibles.map(j =>
      j.type === 'futur' ? (isF ? (j.prev_freq_low ?? null) : (j.prev_ca_low ?? null)) : null
    )
    // [2] Prévision : prediction_freq stockée (passé) ou prev_freq HW (futur)
    chart.data.datasets[2].data = joursVisibles.map(j => {
      if (j.type === 'passe_avec_soiree') {
        return isF ? (j.pred_freq_passe ?? null) : (j.pred_ca_passe ?? null)
      }
      if (j.type === 'futur') {
        return isF ? (j.prev_freq ?? null) : (j.prev_ca ?? null)
      }
      return null
    })
    // [3] Réalisé — uniquement les soirées avec freq_reelle depuis Supabase
    chart.data.datasets[3].data = joursVisibles.map(j =>
      j.type === 'passe_avec_soiree' ? (isF ? (j.freq_reelle ?? null) : (j.ca_reel ?? null)) : null
    )

    // Mettre à jour l'annotation "Aujourd'hui"
    const todayStr   = format(new Date(), 'yyyy-MM-dd')
    const todayLabel = joursVisibles.find(j => j.date >= todayStr)?.label ?? ''
    const ann = (chart.options as any).plugins.annotation.annotations.jourJ
    ann.xMin = todayLabel
    ann.xMax = todayLabel
    ann.label.display = !!todayLabel

    updateSimulationPoint()
    chart.update('active')
    requestAnimationFrame(() => { chartRef.current?.draw() })
  }, [joursVisibles, isFreq])

  // ── useEffect 3 : mettre à jour UNIQUEMENT le point simulé sans rebuild ──────
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    updateSimulationPoint()
    chart.update('active')
    requestAnimationFrame(() => { chartRef.current?.draw() })
  }, [soireePredite, joursVisibles, isFreq])

  // ── Helpers navigation ────────────────────────────────────────────────────────
  const maxStart   = Math.max(0, joursPlusSimulation.length - WINDOW_SIZE)
  const canBack    = windowStart > 0
  const canForward = windowStart < maxStart

  const centerOnJourJ = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const idx      = joursPlusSimulation.findIndex(j => j.date >= todayStr)
    const pivot    = idx !== -1 ? idx : joursPlusSimulation.length - 1
    setWindowStart(Math.max(0, pivot - Math.floor(WINDOW_SIZE / 2)))
  }

  const rangeLabel = joursVisibles.length
    ? `${joursVisibles[0].label} — ${joursVisibles[joursVisibles.length - 1].label}`
    : ''

  const btnStyle = (disabled: boolean): CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: disabled ? 'rgba(240,240,248,0.2)' : 'rgba(240,240,248,0.5)',
    fontSize: 11,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: FONT,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#f0f0f8' }}>
            {isFreq ? 'Fréquentation — vue journalière' : 'CA — vue journalière'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.35)', marginTop: 2 }}>
            Survol · molette pour zoomer · glisser pour naviguer
          </div>
        </div>

        <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 10, background: '#1a1a2e' }}>
          {(['freq', 'ca'] as const).map(m => (
            <button key={m} onClick={() => onMetricChange(m)} style={{
              padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontFamily: FONT, fontSize: 12, fontWeight: 600,
              background: metric === m ? 'linear-gradient(135deg,#4fa3e8,#7b5ce5)' : 'transparent',
              color: metric === m ? '#fff' : 'rgba(240,240,248,0.4)',
            }}>
              {m === 'freq' ? 'Fréquentation' : 'CA'}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(240,240,248,0.3)', fontSize: 13 }}>
          Chargement des données...
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <canvas ref={canvasRef} />
        </div>
      )}

      {/* Navigation fenêtre temporelle */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          style={btnStyle(!canBack)}
          disabled={!canBack}
          onClick={() => setWindowStart(s => Math.max(0, s - STEP))}
        >
          ← 3 sem.
        </button>

        <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(240,240,248,0.35)' }}>
          {rangeLabel}
        </span>

        <button style={btnStyle(false)} onClick={centerOnJourJ}>
          Centrer
        </button>

        <button
          style={btnStyle(!canForward)}
          disabled={!canForward}
          onClick={() => setWindowStart(s => Math.min(maxStart, s + STEP))}
        >
          3 sem. →
        </button>
      </div>
    </div>
  )
}
