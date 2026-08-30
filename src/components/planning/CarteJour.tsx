'use client'
import { useState } from 'react'
import { getTypeAccent } from '@/lib/planning/type-couleurs'
import type { JourPlanning } from '@/hooks/usePlanning'
import ModalDetailSoiree from './ModalDetailSoiree'

interface Props {
  jour: JourPlanning
  mode: 'semaine' | 'mois'
  estAujourdhui: boolean
}

export default function CarteJour({ jour, mode, estAujourdhui }: Props) {
  const [modalOuvert, setModalOuvert] = useState(false)
  const { soiree, previsionStandard, estOuvert, label } = jour
  const accent = soiree ? getTypeAccent(soiree.typeEvenement) : null
  const isMois = mode === 'mois'
  const radius = isMois ? 12 : 18

  // Carte fermée (dimanche, lundi...)
  if (!estOuvert && !soiree) {
    return (
      <div style={{
        borderRadius: radius,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        padding: isMois ? '10px 12px' : '24px 22px',
        opacity: 0.4,
        minHeight: isMois ? 70 : 180,
      }}>
        <div style={{ fontSize: isMois ? 11 : 13, color: 'rgba(240,240,248,0.3)', fontWeight: 500 }}>
          {label}
        </div>
      </div>
    )
  }

  // Carte jour d'ouverture sans soirée planifiée
  if (estOuvert && !soiree) {
    return (
      <div style={{
        borderRadius: radius,
        background: 'rgba(255,255,255,0.03)',
        border: '1px dashed rgba(79,163,232,0.2)',
        padding: isMois ? '10px 12px' : '24px 22px',
        minHeight: isMois ? 70 : 200,
        position: 'relative',
      }}>
        <div style={{ fontSize: isMois ? 11 : 13, fontWeight: 600, color: 'rgba(240,240,248,0.5)', marginBottom: 6 }}>
          {label}
          {estAujourdhui && (
            <span style={{ marginLeft: 6, fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(79,163,232,0.15)', color: '#4fa3e8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Aujourd&apos;hui
            </span>
          )}
        </div>

        {previsionStandard && !isMois && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>👥</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'rgba(79,163,232,0.8)' }}>
                {previsionStandard.freq}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.3)' }}>pers.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>💶</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'rgba(123,92,229,0.8)' }}>
                {(previsionStandard.ca / 1000).toFixed(1)}k
              </span>
              <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.3)' }}>€</span>
            </div>
          </div>
        )}

        {previsionStandard && isMois && (
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(79,163,232,0.6)' }}>
              {previsionStandard.freq} pers.
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(123,92,229,0.6)' }}>
              {(previsionStandard.ca / 1000).toFixed(1)}k€
            </span>
          </div>
        )}
      </div>
    )
  }

  // Carte avec soirée planifiée
  return (
    <>
      <button
        type="button"
        onClick={() => setModalOuvert(true)}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          font: 'inherit',
          color: 'inherit',
          borderRadius: radius,
          background: 'linear-gradient(135deg, rgba(13,13,20,0.95), rgba(13,13,20,0.85))',
          border: `1.5px solid ${accent!.color}40`,
          boxShadow: `0 0 20px ${accent!.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
          padding: isMois ? '10px 12px' : '24px 22px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          minHeight: isMois ? 70 : 220,
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 32px ${accent!.glow}, 0 0 0 1px ${accent!.color}60, inset 0 1px 0 rgba(255,255,255,0.08)`
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${accent!.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
        }}
        onFocus={e => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 32px ${accent!.glow}, 0 0 0 2px ${accent!.color}, inset 0 1px 0 rgba(255,255,255,0.08)`
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
        }}
        onBlur={e => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${accent!.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
        }}
      >
        {/* Barre colorée en haut */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${accent!.color}, ${accent!.color}80)`,
          borderRadius: `${radius}px ${radius}px 0 0`,
        }} />

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMois ? 4 : 8 }}>
          <div style={{ fontSize: isMois ? 11 : 12, fontWeight: 600, color: 'rgba(240,240,248,0.45)' }}>
            {label}
            {estAujourdhui && (
              <span style={{ marginLeft: 6, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(79,163,232,0.2)', color: '#4fa3e8', fontWeight: 700, textTransform: 'uppercase' }}>
                Auj.
              </span>
            )}
          </div>
          <span style={{ fontSize: isMois ? 13 : 16 }}>{accent!.label}</span>
        </div>

        {/* Nom de la soirée */}
        <div style={{
          fontSize: isMois ? 12 : 17,
          fontWeight: 700,
          color: '#f0f0f8',
          marginBottom: isMois ? 3 : 8,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: isMois ? 'nowrap' : 'normal',
        }}>
          {soiree!.nomEvenement || soiree!.typeEvenement}
        </div>

        {/* Prévisions — vue semaine : deux lignes verticales avec icônes */}
        {!isMois && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>👥</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: accent!.color }}>
                {soiree!.predFreqActuelle}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.3)' }}>pers.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>💶</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: accent!.color }}>
                {(soiree!.predCAActuelle / 1000).toFixed(1)}k
              </span>
              <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.3)' }}>€</span>
            </div>
          </div>
        )}

        {/* DJ — vue semaine uniquement */}
        {!isMois && soiree!.djNom && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12 }}>🎧</span>
            <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.5)', fontWeight: 500 }}>
              {soiree!.djNom}
            </span>
          </div>
        )}

        {/* Vue mois : condensé */}
        {isMois && (
          <div style={{ fontSize: 11, fontWeight: 600, color: accent!.color }}>
            {soiree!.predFreqActuelle} pers. · {(soiree!.predCAActuelle / 1000).toFixed(1)}k€
          </div>
        )}

        {/* Indicateur variation */}
        {!!soiree!.variationFreq24h && Math.abs(soiree!.variationFreq24h) >= 10 && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            fontSize: 10, fontWeight: 700,
            color: soiree!.variationFreq24h > 0 ? '#4fe882' : '#f09595',
            background: soiree!.variationFreq24h > 0 ? 'rgba(79,232,130,0.15)' : 'rgba(240,149,149,0.15)',
            padding: '2px 6px', borderRadius: 4,
          }}>
            {soiree!.variationFreq24h > 0 ? '▲' : '▼'} {Math.abs(soiree!.variationFreq24h).toFixed(0)}%
          </div>
        )}
      </button>

      {modalOuvert && soiree && (
        <ModalDetailSoiree
          jour={jour}
          onClose={() => setModalOuvert(false)}
        />
      )}
    </>
  )
}
