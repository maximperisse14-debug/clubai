'use client'
import { useState, useEffect } from 'react'
import { format, getDay } from 'date-fns'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useClub } from '@/hooks/useClub'
import { useClubSettings } from '@/hooks/useClubSettings'
import { useDJs } from '@/hooks/useDJs'
import { getTypeAccent } from '@/lib/planning/type-couleurs'
import { joursOuvertureVersGetDay, GETDAY_TO_JOUR_NOM } from '@/lib/planning/jours'
import DatePicker from './DatePicker'
import ResultatPreview from './ResultatPreview'

const TYPES_EVENEMENT = [
  'Étudiante', 'Latino', 'Techno', 'Années 80/90', 'House', 'Afterwork',
  'Match & DJ set', 'Open format', 'Blind test', 'Live acoustique',
  'Généraliste', 'Karaoké',
]

interface Scenario {
  typeEv: string
  djId: string
  nomEv: string
  freq: number | null
  ca: number | null
  scoreTheme: number | null
  hwBase: number | null
  loading: boolean
}

const SCENARIO_INIT: Scenario = {
  typeEv: '', djId: '', nomEv: '',
  freq: null, ca: null, scoreTheme: null, hwBase: null, loading: false,
}

const COULEURS_SCENARIO = ['#4fa3e8', '#d45fa8', '#f0954a']
const LABELS_SCENARIO = ['Test 1', 'Test 2', 'Test 3']

export default function OngletTester() {
  const router = useRouter()
  const { data: club } = useClub()
  const { data: settings } = useClubSettings(club?.id)
  const { data: djs } = useDJs(club?.id)
  const supabase = createClient()

  const [date, setDate] = useState<Date | null>(null)
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { ...SCENARIO_INIT },
    { ...SCENARIO_INIT },
    { ...SCENARIO_INIT },
  ])
  const [saving, setSaving] = useState<number | null>(null)
  const [erreurPlanification, setErreurPlanification] = useState('')

  const joursOuverture = joursOuvertureVersGetDay(
    settings?.jours_ouverture ?? ['Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  )

  function updateScenario(idx: number, patch: Partial<Scenario>) {
    setScenarios(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  async function calculeScenario(idx: number, overrides?: Partial<Scenario>) {
    const base = { ...scenarios[idx], ...overrides }
    if (!date || !base.typeEv || !club?.id) return
    updateScenario(idx, { ...overrides, loading: true })
    try {
      const djNom = djs?.find(d => d.id === base.djId)?.nom ?? null
      const res = await fetch('/api/predicteur/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(date, 'yyyy-MM-dd'),
          typeEvenement: base.typeEv,
          nomEvenement: base.nomEv || base.typeEv,
          djId: base.djId || null,
          djNom,
        }),
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      updateScenario(idx, {
        freq: result.frequentationEstimee,
        ca: result.caEstime,
        scoreTheme: result.scoreTheme,
        hwBase: result.hwBase?.freq ?? null,
        loading: false,
      })
    } catch {
      updateScenario(idx, { freq: null, ca: null, loading: false })
    }
  }

  // Recalcul auto quand la date change
  useEffect(() => {
    scenarios.forEach((s, i) => { if (s.typeEv && date) calculeScenario(i) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  // Classement
  const scenariosAvecFreq = scenarios
    .map((s, i) => ({ ...s, idx: i }))
    .filter(s => s.freq !== null)
    .sort((a, b) => (b.freq ?? 0) - (a.freq ?? 0))

  const meilleurIdx = scenariosAvecFreq[0]?.idx ?? -1

  async function planifierScenario(idx: number) {
    const s = scenarios[idx]
    if (!date || !s.typeEv || !club?.id || !s.freq || !s.ca) return
    setSaving(idx)
    setErreurPlanification('')
    const { error } = await supabase.from('soirees').insert({
      club_id: club.id,
      date: format(date, 'yyyy-MM-dd'),
      jour: GETDAY_TO_JOUR_NOM[getDay(date)],
      nom_evenement: s.nomEv || s.typeEv,
      type_evenement: s.typeEv,
      dj_id: s.djId || null,
      prediction_freq: s.freq,
      prediction_ca: s.ca,
    })
    setSaving(null)

    if (error) {
      console.error('[tester] insert soiree', error)
      setErreurPlanification(`${LABELS_SCENARIO[idx]} n'a pas pu être planifié : ${error.message}`)
      return
    }

    router.push('/planning')
  }

  return (
    <div>
      {/* Sélection date commune */}
      <div style={{
        background: 'var(--s1)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18, padding: '22px 24px',
        marginBottom: 28, maxWidth: 700,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.35)', marginBottom: 12 }}>
          📅 Date commune aux 3 scénarios
        </div>
        <DatePicker value={date} onChange={setDate} joursOuverture={joursOuverture} />
      </div>

      {/* 3 scénarios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {scenarios.map((s, idx) => {
          const accent = s.typeEv ? getTypeAccent(s.typeEv) : null
          const isMeilleur = idx === meilleurIdx && s.freq !== null
          const couleur = COULEURS_SCENARIO[idx]

          return (
            <div
              key={idx}
              style={{
                background: 'var(--s1)',
                border: `1.5px solid ${isMeilleur ? couleur + '60' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: isMeilleur ? `0 0 24px ${couleur}25` : 'none',
                transition: 'all 0.3s',
                position: 'relative',
              }}
            >
              {/* Badge meilleur */}
              {isMeilleur && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  padding: '3px 10px', borderRadius: 6,
                  background: `${couleur}20`,
                  border: `1px solid ${couleur}40`,
                  fontSize: 10, fontWeight: 800,
                  color: couleur, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  ✦ Meilleur
                </div>
              )}

              {/* En-tête coloré */}
              <div style={{
                height: 4,
                background: `linear-gradient(90deg, ${couleur}, ${couleur}70)`,
              }} />

              <div style={{ padding: '18px 18px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: couleur, marginBottom: 16, letterSpacing: '0.02em' }}>
                  {LABELS_SCENARIO[idx]}
                </div>

                {/* Thème */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(240,240,248,0.3)', marginBottom: 6 }}>
                    🎨 Thème
                  </div>
                  <select
                    value={s.typeEv}
                    onChange={e => calculeScenario(idx, { typeEv: e.target.value, freq: null, ca: null })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 10,
                      border: s.typeEv ? `1px solid ${accent?.color ?? 'transparent'}30` : '1px solid rgba(255,255,255,0.1)',
                      background: 'var(--s2)', color: '#f0f0f8',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    <option value="">Choisir un thème...</option>
                    {TYPES_EVENEMENT.map(t => (
                      <option key={t} value={t}>{getTypeAccent(t).label} {t}</option>
                    ))}
                  </select>
                </div>

                {/* DJ */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(240,240,248,0.3)', marginBottom: 6 }}>
                    🎧 DJ
                  </div>
                  <select
                    value={s.djId}
                    onChange={e => calculeScenario(idx, { djId: e.target.value, freq: null, ca: null })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'var(--s2)', color: '#f0f0f8',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    <option value="">Sans DJ</option>
                    {djs?.map(dj => <option key={dj.id} value={dj.id}>{dj.nom}</option>)}
                  </select>
                </div>

                {/* Nom */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(240,240,248,0.3)', marginBottom: 6 }}>
                    ✏️ Nom (optionnel)
                  </div>
                  <input
                    value={s.nomEv}
                    onChange={e => updateScenario(idx, { nomEv: e.target.value })}
                    placeholder="Nom de la soirée..."
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'var(--s2)', color: '#f0f0f8',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Résultat */}
                <ResultatPreview
                  freq={s.freq}
                  ca={s.ca}
                  scoreTheme={s.scoreTheme}
                  hwBase={s.hwBase}
                  loading={s.loading}
                />

                {/* Bouton planifier */}
                {!!s.freq && !!s.ca && (
                  <button
                    onClick={() => planifierScenario(idx)}
                    disabled={saving !== null}
                    style={{
                      width: '100%', marginTop: 14,
                      padding: '11px 0', borderRadius: 10,
                      border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 700,
                      color: '#fff',
                      background: saving === idx
                        ? 'rgba(255,255,255,0.1)'
                        : `linear-gradient(135deg, ${couleur}, ${couleur}aa)`,
                      transition: 'all 0.2s',
                      opacity: saving !== null && saving !== idx ? 0.4 : 1,
                    }}
                  >
                    {saving === idx ? 'Planification...' : '✦ Planifier ce scénario'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {erreurPlanification && (
        <div style={{ fontSize: 12, color: '#f09595', textAlign: 'center', marginBottom: 20, maxWidth: 700 }}>
          {erreurPlanification}
        </div>
      )}

      {/* Classement synthèse */}
      {scenariosAvecFreq.length > 1 && (
        <div style={{
          background: 'var(--s1)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18, padding: '20px 24px',
          maxWidth: 700,
        }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)', marginBottom: 14 }}>
            Classement des scénarios
          </div>
          {scenariosAvecFreq.map((s, rank) => {
            const couleur = COULEURS_SCENARIO[s.idx]
            const diff = rank === 0 ? null : ((s.freq! - scenariosAvecFreq[0].freq!) / scenariosAvecFreq[0].freq! * 100)
            return (
              <div key={s.idx} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 0',
                borderBottom: rank < scenariosAvecFreq.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'rgba(240,240,248,0.2)', width: 20 }}>
                  #{rank + 1}
                </div>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: couleur, flexShrink: 0,
                }} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#f0f0f8' }}>
                  {LABELS_SCENARIO[s.idx]} — {s.typeEv}
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: couleur }}>
                    👥 {s.freq} pers.
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: couleur }}>
                    💶 {((s.ca ?? 0) / 1000).toFixed(1)}k€
                  </span>
                  {diff !== null && (
                    <span style={{ fontSize: 11, color: '#f09595', fontWeight: 600 }}>
                      {diff.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
