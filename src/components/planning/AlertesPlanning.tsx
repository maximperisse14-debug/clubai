'use client'
import type { JourPlanning } from '@/hooks/usePlanning'
import { getTypeAccent } from '@/lib/planning/type-couleurs'

interface Props {
  jours: JourPlanning[]
  seuilAlerte: number
}

export default function AlertesPlanning({ jours, seuilAlerte }: Props) {
  const alertes = jours
    .filter(j => j.soiree && (
      Math.abs(j.soiree.variationFreq24h ?? 0) >= seuilAlerte ||
      Math.abs(j.soiree.variationCA24h ?? 0) >= seuilAlerte
    ))
    .map(j => ({
      jour: j,
      variationFreq: j.soiree!.variationFreq24h ?? 0,
      variationCA: j.soiree!.variationCA24h ?? 0,
    }))

  if (alertes.length === 0) return null

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'rgba(240,240,248,0.4)',
        marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: '#f0954a' }}>⚠</span>
        Alertes — variations &gt;{seuilAlerte}% en 24h
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alertes.map(({ jour, variationFreq, variationCA }) => {
          const accent = getTypeAccent(jour.soiree!.typeEvenement)
          const maxVar = Math.abs(variationFreq) > Math.abs(variationCA) ? variationFreq : variationCA
          const isHausse = maxVar > 0
          return (
            <div key={jour.date} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderRadius: 12,
              background: isHausse ? 'rgba(79,232,130,0.05)' : 'rgba(240,149,149,0.05)',
              border: `1px solid ${isHausse ? 'rgba(79,232,130,0.15)' : 'rgba(240,149,149,0.15)'}`,
            }}>
              <div style={{ fontSize: 20 }}>{accent.label}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f8' }}>
                  {jour.soiree!.nomEvenement || jour.soiree!.typeEvenement}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', marginTop: 2 }}>
                  {jour.label} · {jour.jourNom}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {Math.abs(variationFreq) >= seuilAlerte && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: isHausse ? '#4fe882' : '#f09595' }}>
                    Fréq. {isHausse ? '▲' : '▼'} {Math.abs(variationFreq).toFixed(0)}%
                  </div>
                )}
                {Math.abs(variationCA) >= seuilAlerte && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: isHausse ? '#4fe882' : '#f09595' }}>
                    CA {isHausse ? '▲' : '▼'} {Math.abs(variationCA).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
