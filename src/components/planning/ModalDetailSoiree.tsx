'use client'
import { useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Martini, Shield, Palette, Pencil, Clock, Headphones, Gift, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { getTypeAccent } from '@/lib/planning/type-couleurs'
import type { JourPlanning } from '@/hooks/usePlanning'

const TYPES_EVENEMENT = [
  'Étudiante', 'Latino', 'Techno', 'Années 80/90', 'House', 'Afterwork',
  'Match & DJ set', 'Open format', 'Blind test', 'Live acoustique',
  'Généraliste', 'Karaoké',
]

const HORAIRES_PRESETS = [
  { label: '21h → 3h', ouv: '21:00', ferm: '03:00' },
  { label: '22h → 4h', ouv: '22:00', ferm: '04:00' },
  { label: '22h → 5h', ouv: '22:00', ferm: '05:00' },
  { label: '23h → 5h', ouv: '23:00', ferm: '05:00' },
]

const STAFF_OPTIONS = Array.from({ length: 21 }, (_, i) => i) // 0 à 20

const LABEL_STYLE = {
  fontSize: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: 'rgba(240,240,248,0.3)',
  marginBottom: 6,
  display: 'flex' as const,
  alignItems: 'center' as const,
  gap: 5,
}

const INPUT_STYLE = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'var(--s2)',
  color: '#f0f0f8',
  fontSize: 13,
  outline: 'none',
}

interface Props {
  jour: JourPlanning
  onClose: () => void
}

function Valeur({ val, children }: { val?: string | number; children?: ReactNode }) {
  if (val !== undefined && val !== null && val !== '' && val !== 0) {
    return <>{children ?? val}</>
  }
  return <span style={{ color: 'rgba(240,240,248,0.2)', fontStyle: 'italic' }}>— non renseigné</span>
}

export default function ModalDetailSoiree({ jour, onClose }: Props) {
  const { soiree } = jour
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createClient(), [])

  const [modeEdition, setModeEdition] = useState(false)
  const [saving, setSaving] = useState(false)

  // États édition — initialisés depuis soiree au montage. Les hooks doivent
  // rester inconditionnels (pas de "if (!soiree) return" avant), donc on
  // utilise des valeurs par défaut sûres tant que soiree n'existe pas.
  const [typeEv, setTypeEv] = useState(soiree?.typeEvenement ?? '')
  const [nomEv, setNomEv] = useState(soiree?.nomEvenement || '')
  const [djNom, setDjNom] = useState(soiree?.djNom || '')
  const [heureOuv, setHeureOuv] = useState(soiree?.heureOuverture || '22:00')
  const [heureFerm, setHeureFerm] = useState(soiree?.heureFermeture || '05:00')
  const [promotion, setPromotion] = useState(soiree?.promotion || '')
  const [staffBar, setStaffBar] = useState<number>(soiree?.staffBar ?? 0)
  const [staffSecu, setStaffSecu] = useState<number>(soiree?.staffSecurite ?? 0)

  if (!soiree) return null

  const accent = getTypeAccent(soiree.typeEvenement)
  const accentEdit = getTypeAccent(typeEv)
  const accentCourant = modeEdition ? accentEdit : accent
  const dateFormatee = format(new Date(jour.date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr })

  function annuler() {
    setTypeEv(soiree!.typeEvenement)
    setNomEv(soiree!.nomEvenement || '')
    setDjNom(soiree!.djNom || '')
    setHeureOuv(soiree!.heureOuverture || '22:00')
    setHeureFerm(soiree!.heureFermeture || '05:00')
    setPromotion(soiree!.promotion || '')
    setStaffBar(soiree!.staffBar ?? 0)
    setStaffSecu(soiree!.staffSecurite ?? 0)
    setModeEdition(false)
  }

  async function sauvegarder() {
    setSaving(true)
    try {
      // Récupérer le DJ id depuis le nom (recherche floue, même logique que
      // l'assistant IA) — si aucun DJ ne correspond, on prévient plutôt que
      // de silencieusement retirer le DJ de la soirée.
      let djId: string | null = null
      if (djNom.trim()) {
        const { data: dj } = await supabase
          .from('djs')
          .select('id')
          .ilike('nom', `%${djNom.trim()}%`)
          .maybeSingle()
        djId = dj?.id ?? null
        if (!djId) {
          toast.warning(`DJ "${djNom.trim()}" introuvable — non assigné à la soirée`)
        }
      }

      const { error } = await supabase
        .from('soirees')
        .update({
          nom_evenement: nomEv || typeEv,
          type_evenement: typeEv,
          dj_id: djId,
          heure_ouverture: heureOuv,
          heure_fermeture: heureFerm,
          promotion: promotion || null,
          staff_bar: staffBar || null,
          staff_securite: staffSecu || null,
        })
        .eq('id', soiree!.id)

      if (error) {
        console.error('[modal-soiree] update', error)
        toast.error('La modification n\'a pas pu être enregistrée', { description: error.message })
        return
      }

      await queryClient.invalidateQueries({ queryKey: ['planning'] })
      toast.success('Soirée mise à jour')
      setModeEdition(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent style={{
        background: 'var(--s2)',
        border: `1px solid ${accentCourant.color}40`,
        boxShadow: `0 0 40px ${accentCourant.glow}`,
        borderRadius: 20,
        maxWidth: 520,
        padding: 0,
        overflow: 'hidden',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Bande colorée en haut */}
        <div style={{
          height: 4,
          background: `linear-gradient(90deg, ${accentCourant.color}, ${accentCourant.color}60)`,
          transition: 'background 0.3s',
        }} />

        <div style={{ padding: '24px 28px' }}>
          <DialogHeader>
            <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.4)', marginBottom: 4, textTransform: 'capitalize' }}>
              {dateFormatee}
            </div>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 700, color: '#f0f0f8' }}>
              <accentCourant.icon size={20} style={{ color: accentCourant.color, flexShrink: 0 }} />
              {modeEdition ? (nomEv || typeEv || 'Nouvelle soirée') : (soiree.nomEvenement || soiree.typeEvenement)}
            </DialogTitle>
            <div style={{ fontSize: 12, color: accentCourant.color, fontWeight: 600, marginTop: 4 }}>
              {modeEdition ? typeEv : soiree.typeEvenement}
            </div>
          </DialogHeader>

          {/* ══ MODE LECTURE ══════════════════════════════════ */}
          {!modeEdition && (
            <>
              {/* Infos pratiques */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 14, margin: '20px 0 16px',
              }}>
                <div>
                  <span style={LABEL_STYLE}><Clock size={11} /> Horaires</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f8' }}>
                    <Valeur val={soiree.heureOuverture}>
                      {soiree.heureOuverture} → {soiree.heureFermeture ?? '—'}
                    </Valeur>
                  </div>
                </div>
                <div>
                  <span style={LABEL_STYLE}><Headphones size={11} /> DJ</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f8' }}>
                    <Valeur val={soiree.djNom}>{soiree.djNom}</Valeur>
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={LABEL_STYLE}><Gift size={11} /> Promotion</span>
                  <div style={{ fontSize: 13, color: '#f0f0f8' }}>
                    <Valeur val={soiree.promotion}>{soiree.promotion}</Valeur>
                  </div>
                </div>
                <div>
                  <span style={LABEL_STYLE}><Martini size={11} /> Staff bar</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f8' }}>
                    <Valeur val={soiree.staffBar}>
                      {soiree.staffBar} personne{(soiree.staffBar ?? 0) > 1 ? 's' : ''}
                    </Valeur>
                  </div>
                </div>
                <div>
                  <span style={LABEL_STYLE}><Shield size={11} /> Staff sécurité</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f8' }}>
                    <Valeur val={soiree.staffSecurite}>
                      {soiree.staffSecurite} personne{(soiree.staffSecurite ?? 0) > 1 ? 's' : ''}
                    </Valeur>
                  </div>
                </div>
              </div>

              {/* Prévisions */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '16px 18px',
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)', marginBottom: 14 }}>
                  Prévisions actualisées
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.35)', marginBottom: 6 }}>Fréquentation</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: accent.color }}>
                      {soiree.predFreqActuelle} pers.
                    </div>
                    {!!soiree.predFreqInitiale && (
                      <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.25)', marginTop: 3 }}>
                        Initiale : {soiree.predFreqInitiale} pers.
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.35)', marginBottom: 6 }}>CA estimé</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: accent.color }}>
                      {(soiree.predCAActuelle / 1000).toFixed(1)}k€
                    </div>
                    {!!soiree.predCAInitiale && (
                      <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.25)', marginTop: 3 }}>
                        Initiale : {(soiree.predCAInitiale / 1000).toFixed(1)}k€
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bouton modifier */}
              <button
                onClick={() => setModeEdition(true)}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  borderRadius: 12,
                  border: `1px solid ${accent.color}40`,
                  background: `${accent.color}12`,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  color: accent.color,
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = `${accent.color}22`
                  ;(e.currentTarget as HTMLElement).style.borderColor = `${accent.color}70`
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = `${accent.color}12`
                  ;(e.currentTarget as HTMLElement).style.borderColor = `${accent.color}40`
                }}
              >
                <Pencil size={14} /> Modifier les informations
              </button>
            </>
          )}

          {/* ══ MODE ÉDITION ══════════════════════════════════ */}
          {modeEdition && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>

              {/* Thème */}
              <div>
                <label style={LABEL_STYLE}><Palette size={11} /> Thème</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {TYPES_EVENEMENT.map(t => {
                    const a = getTypeAccent(t)
                    const sel = typeEv === t
                    return (
                      <button
                        key={t}
                        onClick={() => setTypeEv(t)}
                        style={{
                          padding: '8px 6px',
                          borderRadius: 9,
                          border: sel ? `1.5px solid ${a.color}70` : '1px solid rgba(255,255,255,0.07)',
                          background: sel ? `${a.color}15` : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: sel ? 700 : 500,
                          color: sel ? a.color : 'rgba(240,240,248,0.5)',
                          display: 'flex', alignItems: 'center', gap: 5,
                          transition: 'all 0.15s',
                          textAlign: 'left',
                        }}
                      >
                        <a.icon size={13} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Nom */}
              <div>
                <label style={LABEL_STYLE}><Pencil size={11} /> Nom de la soirée</label>
                <input
                  value={nomEv}
                  onChange={e => setNomEv(e.target.value)}
                  placeholder={`Ex: ${typeEv} Spéciale...`}
                  style={INPUT_STYLE}
                />
              </div>

              {/* Horaires */}
              <div>
                <label style={LABEL_STYLE}><Clock size={11} /> Horaires</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {HORAIRES_PRESETS.map(h => (
                    <button
                      key={h.label}
                      onClick={() => { setHeureOuv(h.ouv); setHeureFerm(h.ferm) }}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        borderRadius: 9,
                        border: heureOuv === h.ouv && heureFerm === h.ferm
                          ? '1.5px solid rgba(79,163,232,0.5)'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: heureOuv === h.ouv && heureFerm === h.ferm
                          ? 'rgba(79,163,232,0.12)'
                          : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        color: heureOuv === h.ouv && heureFerm === h.ferm
                          ? '#4fa3e8'
                          : 'rgba(240,240,248,0.45)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
                {/* Horaire custom */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(240,240,248,0.3)', marginBottom: 4 }}>Ouverture</div>
                    <input
                      type="time"
                      value={heureOuv}
                      onChange={e => setHeureOuv(e.target.value)}
                      style={{ ...INPUT_STYLE, colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(240,240,248,0.3)', marginBottom: 4 }}>Fermeture</div>
                    <input
                      type="time"
                      value={heureFerm}
                      onChange={e => setHeureFerm(e.target.value)}
                      style={{ ...INPUT_STYLE, colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>

              {/* DJ */}
              <div>
                <label style={LABEL_STYLE}><Headphones size={11} /> DJ</label>
                <input
                  value={djNom}
                  onChange={e => setDjNom(e.target.value)}
                  placeholder="Nom du DJ"
                  style={INPUT_STYLE}
                />
              </div>

              {/* Promotion */}
              <div>
                <label style={LABEL_STYLE}><Gift size={11} /> Promotion</label>
                <input
                  value={promotion}
                  onChange={e => setPromotion(e.target.value)}
                  placeholder="Ex: Shot offert avant 23h..."
                  style={INPUT_STYLE}
                />
              </div>

              {/* Staff */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LABEL_STYLE}><Martini size={11} /> Staff bar</label>
                  <Select value={String(staffBar)} onValueChange={v => setStaffBar(Number(v))}>
                    <SelectTrigger className="w-full" style={{ background: 'var(--s2)' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">— non renseigné</SelectItem>
                      {STAFF_OPTIONS.slice(1).map(n => (
                        <SelectItem key={n} value={String(n)}>{n} personne{n > 1 ? 's' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label style={LABEL_STYLE}><Shield size={11} /> Staff sécurité</label>
                  <Select value={String(staffSecu)} onValueChange={v => setStaffSecu(Number(v))}>
                    <SelectTrigger className="w-full" style={{ background: 'var(--s2)' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">— non renseigné</SelectItem>
                      {STAFF_OPTIONS.slice(1).map(n => (
                        <SelectItem key={n} value={String(n)}>{n} personne{n > 1 ? 's' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Boutons action */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 4 }}>
                <button
                  onClick={annuler}
                  disabled={saving}
                  style={{
                    padding: '13px 0',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(240,240,248,0.5)',
                    transition: 'all 0.15s',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={sauvegarder}
                  disabled={saving}
                  style={{
                    padding: '13px 0',
                    borderRadius: 12,
                    border: 'none',
                    background: saving
                      ? 'rgba(255,255,255,0.07)'
                      : 'linear-gradient(135deg, #4fa3e8, #7b5ce5)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    transition: 'all 0.15s',
                    opacity: saving ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {saving ? 'Enregistrement...' : <><Check size={14} /> Enregistrer</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
