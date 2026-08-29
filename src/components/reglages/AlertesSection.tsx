'use client'

export default function AlertesSection({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--t3)' }}>
        Seuil d&apos;alerte planning
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--t2)' }}>
        Une alerte apparaît sur le planning quand la prévision d&apos;une soirée varie de plus de X% en 24h.
      </p>
      <div className="flex items-center gap-4">
        <input
          type="range" min={5} max={30} step={5} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--c2)' }}
        />
        <div className="text-lg font-bold w-16 text-right" style={{ color: 'var(--c2)' }}>
          {value}%
        </div>
      </div>
      <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--t3)' }}>
        <span>5% (sensible)</span>
        <span>30% (alerte critique uniquement)</span>
      </div>
    </div>
  )
}
