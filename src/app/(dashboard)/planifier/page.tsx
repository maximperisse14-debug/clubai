'use client'
import { useState } from 'react'
import { Sparkles, FlaskConical } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OngletPlanifier from '@/components/planifier/OngletPlanifier'
import OngletTester from '@/components/planifier/OngletTester'

type Onglet = 'planifier' | 'tester'

const ONGLETS = [
  { id: 'planifier', icon: Sparkles,      label: 'Planifier', desc: 'Créer une soirée' },
  { id: 'tester',    icon: FlaskConical,  label: 'Tester',    desc: 'Comparer 3 scénarios' },
] as const

export default function PlanifierPage() {
  const [onglet, setOnglet] = useState<Onglet>('planifier')

  return (
    <div style={{
      minHeight: '100%',
      background: 'var(--dark)',
      padding: '28px 32px',
    }}>

      {/* Toggle onglets */}
      <Tabs value={onglet} onValueChange={v => setOnglet(v as Onglet)}>
        <TabsList style={{
          display: 'inline-flex',
          height: 'auto',
          padding: 4,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 28,
        }}>
          {ONGLETS.map(({ id, icon: Icon, label, desc }) => (
            <TabsTrigger
              key={id}
              value={id}
              style={{
                padding: '10px 28px',
                height: 'auto',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                transition: 'all 0.2s',
                background: onglet === id ? 'var(--grad)' : 'transparent',
                color: onglet === id ? '#fff' : 'var(--t2)',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon size={14} /> {label}
              </span>
              <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>{desc}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Contenu */}
      {onglet === 'planifier' ? <OngletPlanifier /> : <OngletTester />}
    </div>
  )
}
