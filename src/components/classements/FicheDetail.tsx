'use client'
import { Users, Euro } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { LigneClassement } from '@/lib/classements/normalisation'
import { getTypeAccent } from '@/lib/planning/type-couleurs'

interface Props {
  ligne: LigneClassement
  dimension: 'type' | 'dj' | 'offre'
  onClose: () => void
}

const JOURS_ORDRE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export default function FicheDetail({ ligne, dimension, onClose }: Props) {
  const accent = dimension === 'type' ? getTypeAccent(ligne.valeur) : null
  const isPositif = (v: number) => v >= 0
  const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
  const maxJours = Math.max(...Object.values(ligne.jours_par_semaine), 1)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent style={{
        background: 'var(--s2)',
        border: `1px solid ${accent ? accent.color + '35' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 20,
        maxWidth: 500,
        padding: 0,
        overflow: 'hidden',
      }}>
        {/* Bande colorée */}
        <div style={{
          height: 4,
          background: accent
            ? `linear-gradient(90deg, ${accent.color}, ${accent.color}70)`
            : 'linear-gradient(90deg, #7b5ce5, #4fa3e8)',
        }} />

        <div style={{ padding: '24px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            {accent && <accent.icon size={26} style={{ color: accent.color, flexShrink: 0 }} />}
            <div>
              <DialogTitle style={{ fontSize: 18, fontWeight: 800, color: '#f0f0f8' }}>
                {ligne.valeur}
              </DialogTitle>
              <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.35)', marginTop: 3 }}>
                {ligne.nb_soirees} soirée{ligne.nb_soirees > 1 ? 's' : ''} analysée{ligne.nb_soirees > 1 ? 's' : ''}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(240,240,248,0.3)', marginBottom: 2 }}>
                Score composite
              </div>
              <div style={{
                fontSize: 20, fontWeight: 800,
                color: ligne.score_composite >= 0 ? '#4fe882' : '#f09595',
              }}>
                {fmtPct(ligne.score_composite)}
              </div>
            </div>
          </div>

          {/* Impacts normalisés */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '16px 18px',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)', marginBottom: 14 }}>
              Impact normalisé (vs soirées équivalentes)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Fréquentation */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <Users size={16} style={{ color: 'rgba(240,240,248,0.5)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)' }}>Fréquentation</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: isPositif(ligne.impact_freq) ? '#4fe882' : '#f09595' }}>
                  {fmtPct(ligne.impact_freq)}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.3)', marginTop: 3 }}>
                  moy. brute : {ligne.freq_brute_moy} pers.
                </div>
              </div>
              {/* CA */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <Euro size={16} style={{ color: 'rgba(240,240,248,0.5)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)' }}>CA</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: isPositif(ligne.impact_ca) ? '#4fe882' : '#f09595' }}>
                  {fmtPct(ligne.impact_ca)}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.3)', marginTop: 3 }}>
                  moy. brute : {(ligne.ca_brut_moy / 1000).toFixed(1)}k€
                </div>
              </div>
            </div>
          </div>

          {/* Libellés complets — offres uniquement */}
          {dimension === 'offre' && ligne.libelles_complets && ligne.libelles_complets.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 18px',
              marginBottom: 14,
            }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)', marginBottom: 10 }}>
                Libellés utilisés
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ligne.libelles_complets.map(l => (
                  <div key={l} style={{
                    fontSize: 12, color: 'rgba(240,240,248,0.65)',
                    padding: '6px 10px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    fontStyle: 'italic',
                  }}>
                    &quot;{l}&quot;
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distribution jours de semaine */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '14px 18px',
          }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)', marginBottom: 14 }}>
              Jours planifiés
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
              {JOURS_ORDRE.map(jour => {
                const count = ligne.jours_par_semaine[jour] ?? 0
                const hauteurPct = maxJours > 0 ? (count / maxJours) * 100 : 0
                const isActif = count > 0
                const couleurBarre = accent?.color ?? '#7b5ce5'

                return (
                  <div key={jour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    {/* Count */}
                    {count > 0 && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: couleurBarre }}>
                        {count}
                      </div>
                    )}
                    {/* Barre */}
                    <div style={{
                      width: '100%',
                      height: `${Math.max(hauteurPct, isActif ? 8 : 0)}%`,
                      minHeight: isActif ? 4 : 0,
                      borderRadius: 4,
                      background: isActif
                        ? `linear-gradient(180deg, ${couleurBarre}, ${couleurBarre}80)`
                        : 'rgba(255,255,255,0.06)',
                      transition: 'height 0.4s',
                      marginTop: 'auto',
                    }} />
                    {/* Label jour abrégé */}
                    <div style={{
                      fontSize: 9,
                      color: isActif ? 'rgba(240,240,248,0.5)' : 'rgba(240,240,248,0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}>
                      {jour.slice(0, 2)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
