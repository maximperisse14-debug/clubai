'use client'
import { useState } from 'react'
import { addDays, differenceInDays, format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { useClub } from '@/hooks/useClub'
import { useDJs } from '@/hooks/useDJs'
import { useDailyData } from '@/hooks/useDailyData'
import type { SoireePredite } from '@/lib/predicteur/types'
import type { PredictionScoreResult } from '@/lib/predicteur/scoring-engine'

const TYPES_EVENEMENT = [
  'Étudiante', 'Latino', 'Techno', 'Années 80/90', 'House', 'Afterwork',
  'Match & DJ set', 'Open format', 'Blind test', 'Live acoustique',
  'Généraliste', 'Karaoké', 'Fête de la musique', 'Spéciale Halloween', 'Nouvel an',
  'Autre',
]

interface Props {
  metric: 'freq' | 'ca'
  onPredict: (s: SoireePredite | null) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
  color: '#f0f0f8', fontFamily: '"Plus Jakarta Sans"', fontSize: 12, outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em',
  color: 'rgba(240,240,248,0.35)', display: 'block', marginBottom: 6,
}

function normaliserDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)
}

export default function PanneauLateral({ metric, onPredict }: Props) {
  const { data: club } = useClub()
  const { data: djs } = useDJs(club?.id)
  const { data: jours } = useDailyData()

  const [date, setDate]           = useState<Date>(addDays(new Date(), 7))
  const [typeEv, setTypeEv]       = useState('')
  const [typeLibre, setTypeLibre] = useState('')
  const [nomEv, setNomEv]         = useState('')
  const [djId, setDjId]           = useState('none')
  const [djMode, setDjMode]       = useState<'liste' | 'nouveau'>('liste')
  const [nouveauDj, setNouveauDj] = useState('')
  const [result, setResult]       = useState<PredictionScoreResult | null>(null)
  const [soiree, setSoiree]       = useState<SoireePredite | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const joursAvant = differenceInDays(date, new Date())

  async function handleCalculer() {
    const typeFinal = typeEv === 'Autre' ? typeLibre.trim() : typeEv
    if (!typeFinal) return
    setLoading(true)
    setError(null)

    try {
      const djNom = djMode === 'nouveau'
        ? nouveauDj.trim() || null
        : (djs?.find(d => d.id === djId)?.nom ?? null)

      const dateStr  = format(normaliserDate(date), 'yyyy-MM-dd')
      const jourData = jours?.find(j => j.date === dateStr)

      const res = await fetch('/api/predicteur/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date:           dateStr,
          typeEvenement:  typeFinal,
          nomEvenement:   nomEv,
          djId:           djId === 'none' ? null : djId,
          djNom,
          prevStandard:   jourData?.prev_freq   ?? undefined,
          prevStandardCA: jourData?.prev_ca     ?? undefined,
        }),
      })
      if (!res.ok) {
        const e = await res.json() as { error?: string }
        setError(e.error ?? 'Erreur serveur')
        return
      }
      const pred = await res.json() as PredictionScoreResult

      const s: SoireePredite = {
        date:          normaliserDate(date),
        typeEvenement: typeFinal,
        nomEvenement:  nomEv,
        djId:          djId === 'none' ? null : djId,
        djNom,
        freq:          pred.frequentationEstimee,
        ca:            pred.caEstime,
        scoreGlobal:   pred.scoreGlobal,
        scoreTheme:    pred.scoreTheme,
        hwFreqBase:    pred.hwBase.freq,
        hwCABase:      pred.hwBase.ca,
        freqLow:       pred.freqLow,
        freqHigh:      pred.freqHigh,
        caLow:         pred.caLow,
        caHigh:        pred.caHigh,
        coeff:         pred.coeff,
      }
      setResult(pred)
      setSoiree(s)
      onPredict(s)
    } catch {
      setError('Impossible de joindre le serveur')
    } finally {
      setLoading(false)
    }
  }

  function handleEffacer() {
    setResult(null)
    setSoiree(null)
    onPredict(null)
  }

  const canCalculate = !!(typeEv && (typeEv !== 'Autre' || typeLibre.trim()))

  const themeColor = (score: number) =>
    score >= 75 ? '#4fe882' : score >= 65 ? '#f0954a' : '#f09595'

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f8', marginBottom: 14 }}>
        Simuler une soirée
      </div>

      {/* Date */}
      <div style={{ marginBottom: 14 }}>
        <span style={labelStyle}>Date</span>
        <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '118%' }}>
          <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} />
        </div>
        {joursAvant > 7 && (
          <div style={{ fontSize: 10, color: '#f0954a', marginTop: 6, padding: '5px 8px', background: 'rgba(240,149,74,0.08)', borderRadius: 6 }}>
            ⚠️ {joursAvant} jours — prévisions météo non incluses au-delà de 7 jours
          </div>
        )}
      </div>

      {/* Type d'événement */}
      <div style={{ marginBottom: 10 }}>
        <span style={labelStyle}>Type d'événement</span>
        <select value={typeEv} onChange={e => setTypeEv(e.target.value)} style={inputStyle}>
          <option value="">Choisir...</option>
          {TYPES_EVENEMENT.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {typeEv === 'Autre' && (
          <input value={typeLibre} onChange={e => setTypeLibre(e.target.value)}
            placeholder="Précise le type..." style={{ ...inputStyle, marginTop: 6 }} />
        )}
      </div>

      {/* Nom */}
      <div style={{ marginBottom: 10 }}>
        <span style={labelStyle}>Nom de l'événement</span>
        <input value={nomEv} onChange={e => setNomEv(e.target.value)}
          placeholder="Ex: Noche Latina Spéciale..." style={inputStyle} />
      </div>

      {/* DJ */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={labelStyle}>DJ</span>
          <button onClick={() => setDjMode(m => m === 'liste' ? 'nouveau' : 'liste')}
            style={{ fontSize: 10, color: '#4fa3e8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', paddingBottom: 6 }}>
            {djMode === 'liste' ? '+ Nouveau DJ' : '← Liste'}
          </button>
        </div>
        {djMode === 'liste' ? (
          <select value={djId} onChange={e => setDjId(e.target.value)} style={inputStyle}>
            <option value="none">Sans DJ</option>
            {djs?.map(dj => <option key={dj.id} value={dj.id}>{dj.nom}</option>)}
          </select>
        ) : (
          <input value={nouveauDj} onChange={e => setNouveauDj(e.target.value)}
            placeholder="Nom du DJ" style={inputStyle} />
        )}
      </div>

      {/* Bouton */}
      <button onClick={handleCalculer} disabled={!canCalculate || loading} style={{
        width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', cursor: canCalculate ? 'pointer' : 'not-allowed',
        fontFamily: '"Plus Jakarta Sans"', fontSize: 13, fontWeight: 700, color: '#fff',
        background: !canCalculate ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#4fa3e8,#7b5ce5)',
        opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
      }}>
        {loading ? 'Calcul en cours...' : 'Calculer'}
      </button>

      {error && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(240,80,80,0.1)', borderRadius: 6, fontSize: 11, color: '#f09595' }}>
          {error}
        </div>
      )}

      {/* Résultats */}
      {result && soiree && (
        <div style={{ marginTop: 16 }}>
          <span style={labelStyle}>Résultat de la simulation</span>

          {/* Fréquentation & CA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ background: 'rgba(79,163,232,0.08)', border: '1px solid rgba(79,163,232,0.2)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'rgba(240,240,248,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Fréquentation</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#4fa3e8', lineHeight: 1 }}>{soiree.freq}</div>
              <div style={{ fontSize: 10, color: 'rgba(240,240,248,0.35)', marginTop: 4 }}>{soiree.freqLow}–{soiree.freqHigh} pers.</div>
            </div>
            <div style={{ background: 'rgba(123,92,229,0.08)', border: '1px solid rgba(123,92,229,0.2)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'rgba(240,240,248,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>CA estimé</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#a07cff', lineHeight: 1 }}>{(soiree.ca / 1000).toFixed(1)}k</div>
              <div style={{ fontSize: 10, color: 'rgba(240,240,248,0.35)', marginTop: 4 }}>
                {(soiree.caLow / 1000).toFixed(1)}–{(soiree.caHigh / 1000).toFixed(1)}k €
              </div>
            </div>
          </div>

          {/* Score thème + décomposition */}
          <div style={{ background: '#1a1a2e', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', marginBottom: 12, lineHeight: 1.5 }}>
              La base HW intègre déjà le calendrier, la météo moyenne et la concurrence habituelle.
              Seul le thème de la soirée module cette base.
            </div>

            {/* Score thème */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.6)' }}>
                  Score thème (DJ + type d'événement)
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: themeColor(result.scoreTheme) }}>
                  {result.scoreTheme.toFixed(1)}/100
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${result.scoreTheme}%`,
                  background: themeColor(result.scoreTheme),
                  transition: 'width 0.4s',
                }} />
              </div>
            </div>

            {/* Base HW × Coeff = Prévision */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(240,240,248,0.3)', marginBottom: 3 }}>Prévision std</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#4fa3e8' }}>
                  {metric === 'freq' ? result.hwBase.freq : Math.round(result.hwBase.ca / 1000 * 10) / 10 + 'k'}
                  {metric === 'freq' ? ' pers.' : ' €'}
                </div>
              </div>
              <div style={{ fontSize: 16, color: 'rgba(240,240,248,0.3)' }}>×</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(240,240,248,0.3)', marginBottom: 3 }}>Coeff. thème</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: result.coeff >= 1 ? '#4fe882' : '#f09595' }}>
                  {result.coeff >= 1 ? '+' : ''}{((result.coeff - 1) * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ fontSize: 16, color: 'rgba(240,240,248,0.3)' }}>=</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(240,240,248,0.3)', marginBottom: 3 }}>Prévision</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#a07cff' }}>
                  {metric === 'freq' ? soiree.freq + ' pers.' : (soiree.ca / 1000).toFixed(1) + 'k €'}
                </div>
              </div>
            </div>
          </div>

          {/* Comparaison vs prévision standard */}
          {(() => {
            const dateStr   = format(soiree.date, 'yyyy-MM-dd')
            const jourCible = jours?.find(j => j.date === dateStr)
            const baseStd   = metric === 'freq' ? jourCible?.prev_freq : jourCible?.prev_ca
            const simVal    = metric === 'freq' ? soiree.freq : soiree.ca
            if (!baseStd) return null
            const ecart    = simVal - baseStd
            const ecartPct = ecart / baseStd * 100
            return (
              <div style={{ background: 'rgba(79,232,130,0.06)', border: '1px solid rgba(79,232,130,0.15)', borderRadius: 10, padding: '8px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: 'rgba(79,232,130,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Vs prévision standard
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: ecart > 0 ? '#4fe882' : '#f09595' }}>
                  {ecart > 0 ? '+' : ''}{metric === 'freq' ? Math.round(ecart) : Math.round(ecart).toLocaleString('fr-FR')}{metric === 'freq' ? ' pers.' : ' €'}{' '}
                  ({ecartPct > 0 ? '+' : ''}{ecartPct.toFixed(1)}%)
                </div>
                <div style={{ fontSize: 10, color: 'rgba(240,240,248,0.35)', marginTop: 2 }}>
                  grâce au scoring thème (DJ + type d'événement)
                </div>
              </div>
            )
          })()}

          <button onClick={handleEffacer} style={{
            width: '100%', padding: '6px 0', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
            cursor: 'pointer', fontSize: 11, color: 'rgba(240,240,248,0.4)', fontFamily: 'inherit',
          }}>
            Effacer du graphique
          </button>
        </div>
      )}
    </div>
  )
}
