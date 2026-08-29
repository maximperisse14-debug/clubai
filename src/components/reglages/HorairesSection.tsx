'use client'
import { useState } from 'react'

export interface HorairePreset {
  label: string
  ouv: string
  ferm: string
}

interface Props {
  value: HorairePreset[]
  onChange: (h: HorairePreset[]) => void
}

export default function HorairesSection({ value, onChange }: Props) {
  const [showAjout, setShowAjout] = useState(false)
  const [nouvelOuv, setNouvelOuv] = useState('22:00')
  const [nouvelFerm, setNouvelFerm] = useState('05:00')

  function ajouterHoraire() {
    if (!nouvelOuv || !nouvelFerm) return
    const h = parseInt(nouvelOuv.split(':')[0], 10)
    const f = parseInt(nouvelFerm.split(':')[0], 10)
    const label = `${h}h → ${f}h`
    if (!value.find(v => v.label === label)) {
      onChange([...value, { label, ouv: nouvelOuv, ferm: nouvelFerm }])
    }
    setShowAjout(false)
  }

  function supprimerHoraire(label: string) {
    onChange(value.filter(h => h.label !== label))
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.35)', marginBottom: 10 }}>
        Horaires préférentiels
      </div>
      <p style={{ fontSize: 12, color: 'rgba(240,240,248,0.45)', marginBottom: 14, lineHeight: 1.6 }}>
        Ces horaires apparaîtront en priorité lors de la planification d&apos;une soirée.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {value.map(h => (
          <div key={h.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f8' }}>{h.label}</span>
            <button
              onClick={() => supprimerHoraire(h.label)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,149,149,0.6)', fontSize: 12 }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {!showAjout ? (
        <button
          onClick={() => setShowAjout(true)}
          style={{
            width: '100%', padding: '10px', borderRadius: 10,
            border: '1px dashed rgba(255,255,255,0.15)',
            background: 'transparent', cursor: 'pointer',
            fontSize: 12,
            color: 'rgba(240,240,248,0.35)',
          }}
        >
          + Ajouter un horaire
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)' }}>Ouverture</label>
            <input
              type="time"
              value={nouvelOuv}
              onChange={e => setNouvelOuv(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--s2)', color: '#f0f0f8', fontSize: 13, colorScheme: 'dark', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)' }}>Fermeture</label>
            <input
              type="time"
              value={nouvelFerm}
              onChange={e => setNouvelFerm(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--s2)', color: '#f0f0f8', fontSize: 13, colorScheme: 'dark', outline: 'none' }}
            />
          </div>
          <button onClick={ajouterHoraire} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Ajouter
          </button>
          <button onClick={() => setShowAjout(false)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(240,240,248,0.4)', fontSize: 12, cursor: 'pointer' }}>
            Annuler
          </button>
        </div>
      )}
    </div>
  )
}
