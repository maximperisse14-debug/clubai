'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useClub } from '@/hooks/useClub'
import { useClubSettings } from '@/hooks/useClubSettings'
import { useDJs } from '@/hooks/useDJs'
import { getTypeAccent } from '@/lib/planning/type-couleurs'
import { joursOuvertureVersGetDay, GETDAY_TO_JOUR_NOM } from '@/lib/planning/jours'
import { type HorairePreset } from '@/components/reglages/HorairesSection'
import DatePicker from './DatePicker'
import ResultatPreview from './ResultatPreview'

const TYPES_EVENEMENT = [
  'Étudiante', 'Latino', 'Techno', 'Années 80/90', 'House', 'Afterwork',
  'Match & DJ set', 'Open format', 'Blind test', 'Live acoustique',
  'Généraliste', 'Karaoké',
]

const HORAIRES_DEFAUT: HorairePreset[] = [
  { label: '21h → 3h', ouv: '21:00', ferm: '03:00' },
  { label: '22h → 4h', ouv: '22:00', ferm: '04:00' },
  { label: '22h → 5h', ouv: '22:00', ferm: '05:00' },
  { label: '23h → 5h', ouv: '23:00', ferm: '05:00' },
]

const STYLES_INPUT = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'var(--s2)',
  color: '#f0f0f8',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.2s',
}

const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: 'rgba(240,240,248,0.35)',
  marginBottom: 8,
  display: 'block',
}

const CARD_STYLE = {
  background: 'var(--s1)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18,
  padding: '22px 24px',
}

export default function OngletPlanifier() {
  const router = useRouter()
  const { data: club } = useClub()
  const { data: settings } = useClubSettings(club?.id)
  const { data: djs } = useDJs(club?.id)
  const supabase = createClient()

  const [date, setDate] = useState<Date | null>(null)
  const [typeEv, setTypeEv] = useState('')
  const [showThemeLibre, setShowThemeLibre] = useState(false)
  const [typeLibre, setTypeLibre] = useState('')
  const [nomEv, setNomEv] = useState('')
  const [djId, setDjId] = useState<string>('')
  const [djNom, setDjNom] = useState<string>('')
  const [djMode, setDjMode] = useState<'liste' | 'nouveau'>('liste')

  const HORAIRES_PRESETS: HorairePreset[] = (settings?.horaires_preferentiels as HorairePreset[] | undefined)?.length
    ? (settings!.horaires_preferentiels as HorairePreset[])
    : HORAIRES_DEFAUT
  const [horaire, setHoraire] = useState<HorairePreset>(HORAIRES_DEFAUT[1])
  const [showHoraireLibre, setShowHoraireLibre] = useState(false)
  const [horaireLibreOuv, setHoraireLibreOuv] = useState('22:00')
  const [horaireLibreFerm, setHoraireLibreFerm] = useState('05:00')

  const [promotion, setPromotion] = useState('')
  const [budgetCom, setBudgetCom] = useState('')

  const [freq, setFreq] = useState<number | null>(null)
  const [ca, setCA] = useState<number | null>(null)
  const [scoreTheme, setScoreTheme] = useState<number | null>(null)
  const [hwBase, setHwBase] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [saving, setSaving] = useState(false)

  const typeFinal = typeEv === '__libre__' ? typeLibre : typeEv
  const accent = typeFinal ? getTypeAccent(typeFinal) : null
  const joursOuverture = joursOuvertureVersGetDay(
    settings?.jours_ouverture ?? ['Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  )

  // Calcul en temps réel dès que date + thème sont renseignés
  useEffect(() => {
    if (!date || !typeFinal || !club?.id) return
    const timer = setTimeout(async () => {
      setLoading(true)
      setErreur('')
      try {
        const djNomFinal = djMode === 'nouveau' ? (djNom || null) : (djs?.find(d => d.id === djId)?.nom ?? null)
        const res = await fetch('/api/predicteur/v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: format(date, 'yyyy-MM-dd'),
            typeEvenement: typeFinal,
            nomEvenement: nomEv || typeFinal,
            djId: djMode === 'nouveau' ? null : (djId || null),
            djNom: djNomFinal,
          }),
        })
        if (!res.ok) throw new Error()
        const result = await res.json()
        setFreq(result.frequentationEstimee)
        setCA(result.caEstime)
        setScoreTheme(result.scoreTheme)
        setHwBase(result.hwBase?.freq ?? null)
      } catch {
        setFreq(null)
        setCA(null)
        setErreur('Impossible de calculer la prévision pour cette date (jour non ouvert ?)')
      } finally {
        setLoading(false)
      }
    }, 400) // debounce 400ms
    return () => clearTimeout(timer)
  }, [date, typeFinal, djId, djNom, djMode, nomEv, club?.id, djs])

  async function handlePlanifier() {
    if (!date || !typeFinal || !club?.id || !freq || !ca) return
    setSaving(true)

    let djIdFinal = djId || null
    if (djMode === 'nouveau' && djNom.trim()) {
      const { data: newDj } = await supabase
        .from('djs')
        .insert({ club_id: club.id, nom: djNom.trim(), cout_base: 200, actif: true })
        .select()
        .single()
      djIdFinal = newDj?.id ?? null
    }

    await supabase.from('soirees').insert({
      club_id: club.id,
      date: format(date, 'yyyy-MM-dd'),
      jour: GETDAY_TO_JOUR_NOM[getDay(date)],
      nom_evenement: nomEv || typeFinal,
      type_evenement: typeFinal,
      dj_id: djIdFinal,
      heure_ouverture: horaire.ouv,
      heure_fermeture: horaire.ferm,
      promotion: promotion || null,
      budget_com: budgetCom ? parseInt(budgetCom, 10) : null,
      prediction_freq: freq,
      prediction_ca: ca,
    })

    setSaving(false)
    router.push('/planning')
  }

  const peutPlanifier = !!date && !!typeFinal && !!freq && !!ca

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 32, maxWidth: 1100 }}>

      {/* Colonne gauche — formulaire */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Date */}
        <div style={CARD_STYLE}>
          <label style={LABEL_STYLE}>📅 Date de la soirée</label>
          <DatePicker value={date} onChange={setDate} joursOuverture={joursOuverture} />
        </div>

        {/* Thème */}
        <div style={{
          ...CARD_STYLE,
          border: `1px solid ${accent ? accent.color + '30' : 'rgba(255,255,255,0.07)'}`,
          transition: 'border-color 0.3s',
        }}>
          <label style={LABEL_STYLE}>🎨 Thème de la soirée</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {TYPES_EVENEMENT.map(t => {
              const a = getTypeAccent(t)
              const selected = typeEv === t
              return (
                <button
                  key={t}
                  onClick={() => {
                    setTypeEv(typeEv === t ? '' : t)
                    setShowThemeLibre(false)
                  }}
                  style={{
                    padding: '9px 10px',
                    borderRadius: 10,
                    border: selected ? `1.5px solid ${a.color}70` : '1px solid rgba(255,255,255,0.07)',
                    background: selected ? `${a.color}15` : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: selected ? 700 : 500,
                    color: selected ? a.color : 'rgba(240,240,248,0.5)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{a.label}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
                </button>
              )
            })}
          </div>

          {/* Thème libre */}
          {!showThemeLibre ? (
            <button
              onClick={() => setShowThemeLibre(true)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px dashed rgba(255,255,255,0.15)',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 12,
                color: 'rgba(240,240,248,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 4,
                transition: 'all 0.15s',
              }}
            >
              + Ajouter un thème
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                autoFocus
                value={typeLibre}
                onChange={e => {
                  setTypeLibre(e.target.value)
                  setTypeEv('__libre__')
                }}
                placeholder="Ex: Soirée Années 2000, RnB Night..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(123,92,229,0.3)',
                  background: 'var(--s2)',
                  color: '#f0f0f8',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                onClick={() => { setShowThemeLibre(false); setTypeLibre(''); setTypeEv('') }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'rgba(240,240,248,0.4)',
                  fontSize: 12,
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Nom personnalisé */}
          <input
            value={nomEv}
            onChange={e => setNomEv(e.target.value)}
            placeholder={typeFinal ? `Ex: ${typeFinal} Spéciale...` : 'Nom de la soirée'}
            style={{ ...STYLES_INPUT, marginTop: 12 }}
          />
        </div>

        {/* DJ */}
        <div style={CARD_STYLE}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>🎧 DJ</label>
            <button
              onClick={() => setDjMode(m => m === 'liste' ? 'nouveau' : 'liste')}
              style={{ fontSize: 11, color: '#4fa3e8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
            >
              {djMode === 'liste' ? '+ Nouveau DJ' : '← Retour à la liste'}
            </button>
          </div>

          {djMode === 'liste' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[{ id: '', nom: 'Sans DJ' }, ...(djs ?? [])].map(dj => (
                <button
                  key={dj.id}
                  onClick={() => setDjId(dj.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: djId === dj.id
                      ? '1.5px solid rgba(123,92,229,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: djId === dj.id ? 'rgba(123,92,229,0.15)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: djId === dj.id ? 700 : 500,
                    color: djId === dj.id ? '#a07cff' : 'rgba(240,240,248,0.5)',
                    transition: 'all 0.15s',
                  }}
                >
                  {dj.nom}
                </button>
              ))}
            </div>
          ) : (
            <input
              value={djNom}
              onChange={e => setDjNom(e.target.value)}
              placeholder="Nom du DJ"
              style={STYLES_INPUT}
            />
          )}
        </div>

        {/* Horaires + Promotion */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Horaires */}
          <div style={CARD_STYLE}>
            <label style={LABEL_STYLE}>🕐 Horaires</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HORAIRES_PRESETS.map(h => (
                <button
                  key={h.label}
                  onClick={() => { setHoraire(h); setShowHoraireLibre(false) }}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 10,
                    border: horaire.label === h.label
                      ? '1.5px solid rgba(79,163,232,0.5)'
                      : '1px solid rgba(255,255,255,0.07)',
                    background: horaire.label === h.label
                      ? 'rgba(79,163,232,0.12)'
                      : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: horaire.label === h.label ? 700 : 500,
                    color: horaire.label === h.label ? '#4fa3e8' : 'rgba(240,240,248,0.5)',
                    textAlign: 'left' as const,
                    transition: 'all 0.15s',
                  }}
                >
                  {h.label}
                </button>
              ))}
            </div>

            {/* Horaire libre */}
            {!showHoraireLibre ? (
              <button
                onClick={() => setShowHoraireLibre(true)}
                style={{
                  width: '100%', padding: '9px 14px', borderRadius: 10,
                  border: '1px dashed rgba(255,255,255,0.12)',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 12,
                  color: 'rgba(240,240,248,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  marginTop: 8,
                }}
              >
                + Ajouter un horaire
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', minWidth: 60 }}>Ouverture</span>
                  <input
                    type="time"
                    value={horaireLibreOuv}
                    onChange={e => setHoraireLibreOuv(e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--s2)', color: '#f0f0f8', fontSize: 13, colorScheme: 'dark', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', minWidth: 60 }}>Fermeture</span>
                  <input
                    type="time"
                    value={horaireLibreFerm}
                    onChange={e => setHoraireLibreFerm(e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--s2)', color: '#f0f0f8', fontSize: 13, colorScheme: 'dark', outline: 'none' }}
                  />
                </div>
                <button
                  onClick={() => {
                    const h = parseInt(horaireLibreOuv.split(':')[0], 10)
                    const f = parseInt(horaireLibreFerm.split(':')[0], 10)
                    setHoraire({ label: `${h}h → ${f}h`, ouv: horaireLibreOuv, ferm: horaireLibreFerm })
                    setShowHoraireLibre(false)
                  }}
                  style={{ padding: '9px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirmer cet horaire
                </button>
              </div>
            )}
          </div>

          {/* Promotion */}
          <div style={{ ...CARD_STYLE, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={LABEL_STYLE}>🎁 Promotion</label>
            <input
              value={promotion}
              onChange={e => setPromotion(e.target.value)}
              placeholder="Ex: Shot offert avant 23h..."
              style={STYLES_INPUT}
            />
            <label style={{ ...LABEL_STYLE, marginBottom: 0, marginTop: 4 }}>📣 Budget com.</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={budgetCom}
                onChange={e => setBudgetCom(e.target.value)}
                placeholder="150"
                style={{ ...STYLES_INPUT, paddingRight: 32 }}
              />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(240,240,248,0.3)' }}>€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne droite — résultat + CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Récap soirée */}
        {(date || typeFinal) && (
          <div style={{
            ...CARD_STYLE,
            border: `1px solid ${accent ? accent.color + '25' : 'rgba(255,255,255,0.07)'}`,
            padding: '20px 22px',
          }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)', marginBottom: 12 }}>
              Récap soirée
            </div>
            {date && (
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,248,0.7)', marginBottom: 6 }}>
                📅 {format(date, 'EEEE d MMMM', { locale: fr })}
              </div>
            )}
            {typeFinal && (
              <div style={{ fontSize: 15, fontWeight: 700, color: accent?.color ?? '#f0f0f8', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span>{accent?.label}</span> {nomEv || typeFinal}
              </div>
            )}
            {djId && djs && (
              <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.4)', marginTop: 6 }}>
                🎧 {djs.find(d => d.id === djId)?.nom ?? ''}
              </div>
            )}
            {djMode === 'nouveau' && djNom && (
              <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.4)', marginTop: 6 }}>🎧 {djNom}</div>
            )}
            <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.4)', marginTop: 6 }}>
              🕐 {horaire.label}
            </div>
            {promotion && (
              <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.4)', marginTop: 6 }}>🎁 {promotion}</div>
            )}
          </div>
        )}

        {/* Prévisions temps réel */}
        <div style={{ ...CARD_STYLE, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)', marginBottom: 14 }}>
            Prévisions
          </div>
          <ResultatPreview freq={freq} ca={ca} scoreTheme={scoreTheme} hwBase={hwBase} loading={loading} />
          {erreur && !loading && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#f09595' }}>{erreur}</div>
          )}
        </div>

        {/* Bouton Planifier */}
        <button
          onClick={handlePlanifier}
          disabled={!peutPlanifier || saving}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 14,
            border: 'none',
            cursor: peutPlanifier ? 'pointer' : 'not-allowed',
            fontSize: 15,
            fontWeight: 800,
            color: '#fff',
            background: peutPlanifier ? 'var(--grad)' : 'rgba(255,255,255,0.07)',
            opacity: saving ? 0.7 : 1,
            transition: 'all 0.2s',
            letterSpacing: '0.02em',
          }}
        >
          {saving ? 'Planification...' : '✦ Planifier cette soirée'}
        </button>

        {!peutPlanifier && (
          <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.25)', textAlign: 'center', marginTop: -8 }}>
            {!date ? 'Sélectionne une date' : !typeFinal ? 'Choisis un thème' : loading ? 'Calcul en cours...' : ' '}
          </div>
        )}
      </div>
    </div>
  )
}
