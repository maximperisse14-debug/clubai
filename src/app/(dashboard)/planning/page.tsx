'use client'
import { useState } from 'react'
import { addWeeks, subWeeks, addMonths, subMonths, startOfWeek, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePlanning } from '@/hooks/usePlanning'
import { useClub } from '@/hooks/useClub'
import { useClubSettings } from '@/hooks/useClubSettings'
import CarteJour from '@/components/planning/CarteJour'
import AlertesPlanning from '@/components/planning/AlertesPlanning'

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function PlanningPage() {
  const [mode, setMode] = useState<'semaine' | 'mois'>('semaine')
  const [dateRef, setDateRef] = useState(new Date())
  const { data: club } = useClub()
  const { data: settings } = useClubSettings(club?.id)
  const { data: jours, isLoading, error } = usePlanning(mode, dateRef, club?.id)

  const seuilAlerte = settings?.seuil_alerte_variation ?? 10
  const today = format(new Date(), 'yyyy-MM-dd')

  function naviguer(direction: 1 | -1) {
    setDateRef(prev =>
      mode === 'semaine'
        ? direction === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1)
        : direction === 1 ? addMonths(prev, 1) : subMonths(prev, 1)
    )
  }

  const titreNavigation = mode === 'semaine'
    ? `Semaine du ${format(startOfWeek(dateRef, { weekStartsOn: 1 }), 'd MMMM yyyy', { locale: fr })}`
    : format(dateRef, 'MMMM yyyy', { locale: fr })

  return (
    <div style={{
      padding: '28px 32px',
      minHeight: '100%',
      background: 'var(--dark)',
    }}>

      {/* Toggle semaine / mois */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Tabs value={mode} onValueChange={v => setMode(v as 'semaine' | 'mois')}>
          <TabsList style={{ display: 'flex', height: 'auto', gap: 4, padding: 3, borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}>
            {(['semaine', 'mois'] as const).map(m => (
              <TabsTrigger key={m} value={m} style={{
                padding: '7px 18px', height: 'auto', borderRadius: 9,
                fontSize: 13, fontWeight: 600,
                background: mode === m ? 'var(--grad)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--t2)',
                transition: 'all 0.15s',
              }}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Navigation temporelle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button onClick={() => naviguer(-1)} style={{
          width: 34, height: 34, borderRadius: 10, border: '1px solid var(--b1)',
          background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--t2)',
        }}>
          <ChevronLeft size={16} />
        </button>

        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', flex: 1 }}>
          {titreNavigation}
        </div>

        <button onClick={() => setDateRef(new Date())} style={{
          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          border: '1px solid rgba(123,92,229,0.3)', background: 'rgba(123,92,229,0.1)',
          color: 'var(--c2)', cursor: 'pointer',
        }}>
          Aujourd&apos;hui
        </button>

        <button onClick={() => naviguer(1)} style={{
          width: 34, height: 34, borderRadius: 10, border: '1px solid var(--b1)',
          background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--t2)',
        }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Erreur de chargement */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          borderRadius: 12, border: '1px solid rgba(240,149,149,0.3)',
          background: 'rgba(240,149,149,0.1)', padding: '12px 16px',
          marginBottom: 20, fontSize: 13, color: '#f09595',
        }}>
          <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600 }}>Erreur de chargement</div>
            <div style={{ fontSize: 12, marginTop: 2, opacity: 0.85 }}>
              {error instanceof Error ? error.message : String(error)}
            </div>
          </div>
        </div>
      )}

      {/* Bande KPIs hebdomadaires (vue semaine uniquement) */}
      {mode === 'semaine' && jours && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12, marginBottom: 20,
        }}>
          {[
            {
              label: 'Soirées planifiées',
              value: jours.filter(j => j.soiree).length,
              suffix: `/ ${jours.filter(j => j.estOuvert).length}`,
              color: '#7b5ce5',
            },
            {
              label: 'Fréquentation estimée',
              value: jours.filter(j => j.soiree).reduce((s, j) => s + (j.soiree?.predFreqActuelle ?? 0), 0),
              suffix: 'pers.',
              color: '#4fa3e8',
            },
            {
              label: 'CA estimé semaine',
              value: (jours.filter(j => j.soiree).reduce((s, j) => s + (j.soiree?.predCAActuelle ?? 0), 0) / 1000).toFixed(1),
              suffix: 'k€',
              color: '#d45fa8',
            },
          ].map(({ label, value, suffix, color }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 18px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)' }}>
                {label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color }}>{value}</span>
                <span style={{ fontSize: 13, color: 'rgba(240,240,248,0.4)' }}>{suffix}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* En-têtes jours (vue semaine uniquement) */}
      {mode === 'semaine' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 10 }}>
          {JOURS_SEMAINE.map(j => (
            <div key={j} style={{
              textAlign: 'center', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--t3)', paddingBottom: 6,
            }}>
              {j}
            </div>
          ))}
        </div>
      )}

      {/* Grille */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
          {Array.from({ length: mode === 'semaine' ? 7 : 35 }).map((_, i) => (
            <div key={i} style={{
              borderRadius: mode === 'semaine' ? 18 : 12, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              height: mode === 'semaine' ? 180 : 70,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: mode === 'semaine' ? 12 : 8,
        }}>
          {jours?.map(jour => (
            <CarteJour
              key={jour.date}
              jour={jour}
              mode={mode}
              estAujourdhui={jour.date === today}
            />
          ))}
        </div>
      )}

      {/* Alertes */}
      {jours && jours.length > 0 && (
        <AlertesPlanning jours={jours} seuilAlerte={seuilAlerte} />
      )}
    </div>
  )
}
