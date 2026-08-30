'use client'
import { useState } from 'react'
import type { LigneClassement } from '@/lib/classements/normalisation'
import { getTypeAccent } from '@/lib/planning/type-couleurs'
import FicheDetail from './FicheDetail'

interface Props {
  titre: string
  emoji: string
  lignes: LigneClassement[]
  dimension: 'type' | 'dj' | 'offre'
  loading?: boolean
}

export default function ColonneClassement({ titre, emoji, lignes, dimension, loading }: Props) {
  const [selection, setSelection] = useState<LigneClassement | null>(null)

  return (
    <>
      <div style={{
        background: '#13131f',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        overflow: 'hidden',
        flex: 1,
        minWidth: 0,
      }}>
        {/* En-tête */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>{emoji}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f8' }}>{titre}</div>
            <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.3)', marginTop: 2 }}>
              Impact normalisé · cliquer pour le détail
            </div>
          </div>
        </div>

        {/* Liste */}
        <div style={{ padding: '10px 0' }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '11px 22px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ height: 14, flex: 1, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
              </div>
            ))
          ) : lignes.length === 0 ? (
            <div style={{ padding: '24px 22px', fontSize: 13, color: 'rgba(240,240,248,0.25)', textAlign: 'center' }}>
              Pas encore assez de données
            </div>
          ) : (
            lignes.map((ligne, idx) => {
              const isPositif = ligne.score_composite > 0
              const accent = dimension === 'type' ? getTypeAccent(ligne.valeur) : null

              return (
                <button
                  key={ligne.valeur}
                  type="button"
                  onClick={() => setSelection(ligne)}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    textAlign: 'left',
                    font: 'inherit',
                    color: 'inherit',
                    border: 'none',
                    gap: 14,
                    padding: '12px 22px',
                    cursor: 'pointer',
                    borderBottom: idx < lignes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    transition: 'background 0.15s',
                    position: 'relative',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onFocus={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onBlur={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Numéro */}
                  <div style={{
                    width: 28, height: 28,
                    borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    background: idx === 0
                      ? 'linear-gradient(135deg, #f0954a, #fbbf24)'
                      : idx === 1
                      ? 'rgba(255,255,255,0.08)'
                      : idx === 2
                      ? 'rgba(255,255,255,0.05)'
                      : 'transparent',
                    border: idx > 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    fontSize: 12,
                    fontWeight: 800,
                    color: idx === 0 ? '#fff' : 'rgba(240,240,248,0.4)',
                  }}>
                    {ligne.rang}
                  </div>

                  {/* Emoji thème si disponible */}
                  {accent && (
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{accent.label}</span>
                  )}

                  {/* Nom */}
                  <div style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: idx < 3 ? 600 : 500,
                    color: idx === 0 ? '#f0f0f8' : 'rgba(240,240,248,0.7)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {ligne.valeur}
                  </div>

                  {/* Indicateur direction */}
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isPositif ? '#4fe882' : '#f09595',
                    flexShrink: 0,
                  }}>
                    {isPositif ? '↑' : '↓'}
                  </div>

                  {/* Flèche détail */}
                  <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.2)', flexShrink: 0 }}>›</div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Modal détail */}
      {selection && (
        <FicheDetail
          ligne={selection}
          dimension={dimension}
          onClose={() => setSelection(null)}
        />
      )}
    </>
  )
}
