interface Props {
  freq: number | null
  ca: number | null
  scoreTheme: number | null
  hwBase: number | null
  loading?: boolean
}

function getScoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 85) return { label: '⚡ Soirée forte', color: '#4fe882', bg: 'rgba(79,232,130,0.12)' }
  if (score >= 70) return { label: '✦ Bonne soirée', color: '#86efac', bg: 'rgba(134,239,172,0.10)' }
  if (score >= 50) return { label: '◎ Soirée correcte', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' }
  if (score >= 30) return { label: '↓ Soirée faible', color: '#f0954a', bg: 'rgba(240,149,74,0.10)' }
  return { label: '✕ Déconseillée', color: '#f09595', bg: 'rgba(240,149,149,0.10)' }
}

export default function ResultatPreview({ freq, ca, scoreTheme, hwBase, loading }: Props) {
  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        {[1, 2].map(i => (
          <div key={i} style={{
            flex: 1, height: 90, borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
    )
  }

  if (!freq || !ca) {
    return (
      <div style={{
        padding: '20px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: '1px dashed rgba(255,255,255,0.08)',
        textAlign: 'center',
        color: 'rgba(240,240,248,0.25)',
        fontSize: 13,
      }}>
        Renseigne le thème et la date pour voir la prévision
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

        {/* Fréquentation */}
        <div style={{
          padding: '18px 20px',
          borderRadius: 14,
          background: 'rgba(79,163,232,0.08)',
          border: '1px solid rgba(79,163,232,0.2)',
        }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(240,240,248,0.35)', marginBottom: 8 }}>
            Fréquentation estimée
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>👥</span>
            <div>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#4fa3e8', lineHeight: 1 }}>{freq}</span>
              <span style={{ fontSize: 13, color: 'rgba(240,240,248,0.3)', marginLeft: 5 }}>pers.</span>
            </div>
          </div>
        </div>

        {/* CA */}
        <div style={{
          padding: '18px 20px',
          borderRadius: 14,
          background: 'rgba(123,92,229,0.08)',
          border: '1px solid rgba(123,92,229,0.2)',
        }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(240,240,248,0.35)', marginBottom: 8 }}>
            CA estimé
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>💶</span>
            <div>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#a07cff', lineHeight: 1 }}>{(ca / 1000).toFixed(1)}k</span>
              <span style={{ fontSize: 13, color: 'rgba(240,240,248,0.3)', marginLeft: 5 }}>€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score thème + base HW */}
      {!!scoreTheme && !!hwBase && (
        <div style={{ marginTop: 12 }}>
          {/* Barre de score */}
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 }}>
            <div style={{
              height: '100%',
              width: `${scoreTheme}%`,
              borderRadius: 2,
              background: scoreTheme >= 85
                ? 'linear-gradient(90deg, #4fe882, #86efac)'
                : scoreTheme >= 70
                ? 'linear-gradient(90deg, #86efac, #fbbf24)'
                : scoreTheme >= 50
                ? 'linear-gradient(90deg, #fbbf24, #f0954a)'
                : 'linear-gradient(90deg, #f0954a, #f09595)',
              transition: 'width 0.5s ease',
            }} />
          </div>

          {/* Label qualitatif */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            borderRadius: 10,
            background: getScoreLabel(scoreTheme).bg,
            border: `1px solid ${getScoreLabel(scoreTheme).color}25`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: getScoreLabel(scoreTheme).color }}>
              {getScoreLabel(scoreTheme).label}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.3)' }}>
              Base HW · {hwBase} pers.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
