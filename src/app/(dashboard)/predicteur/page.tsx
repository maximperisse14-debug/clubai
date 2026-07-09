'use client'
import { useState } from 'react'
import GraphiquePrincipal from '@/components/predicteur/GraphiquePrincipal'
import PanneauLateral from '@/components/predicteur/PanneauLateral'
import type { SoireePredite } from '@/lib/predicteur/types'

export default function PredicteurPage() {
  const [metric, setMetric] = useState<'freq' | 'ca'>('freq')
  const [soireePredite, setSoireePredite] = useState<SoireePredite | null>(null)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      height: 'calc(100vh - 64px)',
      overflow: 'hidden',
    }}>
      {/* Graphique principal */}
      <div style={{ padding: '20px 0 20px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <GraphiquePrincipal
          metric={metric}
          onMetricChange={setMetric}
          soireePredite={soireePredite}
        />
      </div>

      {/* Panneau latéral */}
      <div style={{
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        background: '#13131f',
        overflowY: 'auto',
        padding: '20px 16px',
      }}>
        <PanneauLateral metric={metric} onPredict={setSoireePredite} />
      </div>
    </div>
  )
}
