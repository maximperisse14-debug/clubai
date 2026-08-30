'use client'
import { useState } from 'react'
import { addDays, format, getDay, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'

interface Props {
  value: Date | null
  onChange: (d: Date) => void
  joursOuverture?: number[] // getDay() JS : 0=dim ... 6=sam
}

const JOURS_OUVERTS_DEFAULT = [3, 4, 5, 6]

export default function DatePicker({ value, onChange, joursOuverture = JOURS_OUVERTS_DEFAULT }: Props) {
  const [showCalendrier, setShowCalendrier] = useState(false)

  // Prochains jours d'ouverture (7 prochains)
  const prochainsDates: Date[] = []
  let cursor = addDays(new Date(), 1)
  while (prochainsDates.length < 7) {
    if (joursOuverture.includes(getDay(cursor))) {
      prochainsDates.push(startOfDay(cursor))
    }
    cursor = addDays(cursor, 1)
  }

  return (
    <div>
      {/* Chips jours rapides */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {prochainsDates.map(d => {
          const isSelected = value && format(value, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd')
          const jourNom = format(d, 'EEE', { locale: fr })
          const jourNum = format(d, 'd MMM', { locale: fr })
          return (
            <button
              key={d.toISOString()}
              onClick={() => onChange(d)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: isSelected
                  ? '1.5px solid rgba(123,92,229,0.6)'
                  : '1px solid rgba(255,255,255,0.1)',
                background: isSelected
                  ? 'rgba(123,92,229,0.18)'
                  : 'rgba(255,255,255,0.04)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isSelected ? '#a07cff' : 'rgba(240,240,248,0.35)' }}>
                {jourNom}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#f0f0f8' : 'rgba(240,240,248,0.6)' }}>
                {jourNum}
              </span>
            </button>
          )
        })}

        {/* Bouton autre date */}
        <button
          onClick={() => setShowCalendrier(!showCalendrier)}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: '1px dashed rgba(255,255,255,0.15)',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 12,
            color: 'rgba(240,240,248,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <CalendarDays size={13} /> Autre date
        </button>
      </div>

      {/* Input date natif stylisé */}
      {showCalendrier && (
        <input
          type="date"
          value={value ? format(value, 'yyyy-MM-dd') : ''}
          min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
          onChange={e => {
            if (e.target.value) {
              onChange(new Date(e.target.value + 'T12:00:00'))
              setShowCalendrier(false)
            }
          }}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(123,92,229,0.3)',
            background: 'var(--s2)',
            color: '#f0f0f8',
            fontSize: 13,
            outline: 'none',
            colorScheme: 'dark',
          }}
        />
      )}

      {/* Date sélectionnée */}
      {value && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(240,240,248,0.4)' }}>
          <CalendarDays size={12} /> {format(value, 'EEEE d MMMM yyyy', { locale: fr })}
        </div>
      )}
    </div>
  )
}
