'use client'

const JOURS_OPTIONS = [
  { value: 'Lundi',    label: 'Lundi' },
  { value: 'Mardi',   label: 'Mardi' },
  { value: 'Mercredi',label: 'Mercredi' },
  { value: 'Jeudi',   label: 'Jeudi' },
  { value: 'Vendredi',label: 'Vendredi' },
  { value: 'Samedi',  label: 'Samedi' },
  { value: 'Dimanche',label: 'Dimanche' },
  { value: 'Veille de jour férié', label: 'Veilles de jours fériés' },
]

interface Props {
  value: string[]
  onChange: (jours: string[]) => void
}

export default function JoursOuvertureSection({ value, onChange }: Props) {
  const toggle = (jour: string) => {
    const next = value.includes(jour)
      ? value.filter(j => j !== jour)
      : [...value, jour]
    onChange(next)
  }

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--t3)' }}>
        Jours d'ouverture habituels
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--t2)' }}>
        Ces jours apparaîtront dans le calendrier avec une prédiction, même sans soirée planifiée.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {JOURS_OPTIONS.map(({ value: v, label }) => {
          const active = value.includes(v)
          return (
            <button
              key={v}
              type="button"
              onClick={() => toggle(v)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{
                background: active ? 'rgba(123,92,229,0.15)' : 'var(--s3)',
                border: active ? '1px solid rgba(123,92,229,0.4)' : '1px solid var(--b1)',
                color: active ? 'var(--c2)' : 'var(--t2)',
              }}
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px] text-white"
                style={{
                  background: active ? 'var(--c2)' : 'transparent',
                  border: active ? 'none' : '1px solid var(--b2)',
                }}
              >
                {active && '✓'}
              </div>
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
