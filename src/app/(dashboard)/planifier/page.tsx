'use client'
import { useState } from 'react'
import OngletPlanifier from '@/components/planifier/OngletPlanifier'
import OngletTester from '@/components/planifier/OngletTester'

type Onglet = 'planifier' | 'tester'

export default function PlanifierPage() {
  const [onglet, setOnglet] = useState<Onglet>('planifier')

  return (
    <div style={{
      minHeight: '100%',
      background: 'var(--dark)',
      padding: '28px 32px',
    }}>

      {/* Toggle onglets */}
      <div style={{
        display: 'inline-flex',
        gap: 0,
        padding: 4,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 28,
      }}>
        {([
          { id: 'planifier', label: '✦ Planifier', desc: 'Créer une soirée' },
          { id: 'tester',    label: '⚗ Tester',    desc: 'Comparer 3 scénarios' },
        ] as const).map(({ id, label, desc }) => (
          <button
            key={id}
            onClick={() => setOnglet(id)}
            style={{
              padding: '10px 28px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              transition: 'all 0.2s',
              background: onglet === id ? 'var(--grad)' : 'transparent',
              color: onglet === id ? '#fff' : 'var(--t2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span>{label}</span>
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>{desc}</span>
          </button>
        ))}
      </div>

      {/* Contenu */}
      {onglet === 'planifier' ? <OngletPlanifier /> : <OngletTester />}
    </div>
  )
}
