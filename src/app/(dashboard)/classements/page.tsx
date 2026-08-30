'use client'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { useClub } from '@/hooks/useClub'
import { getClassement } from '@/lib/classements/normalisation'
import ColonneClassement from '@/components/classements/ColonneClassement'

export default function ClassementsPage() {
  const { data: club } = useClub()

  const { data: themes, isLoading: themesLoading, error: themesError } = useQuery({
    queryKey: ['classement', club?.id, 'type'],
    queryFn: () => getClassement(club!.id, 'type'),
    enabled: !!club?.id,
  })
  const { data: djs, isLoading: djsLoading, error: djsError } = useQuery({
    queryKey: ['classement', club?.id, 'dj'],
    queryFn: () => getClassement(club!.id, 'dj'),
    enabled: !!club?.id,
  })
  const { data: offres, isLoading: offresLoading, error: offresError } = useQuery({
    queryKey: ['classement', club?.id, 'offre'],
    queryFn: () => getClassement(club!.id, 'offre'),
    enabled: !!club?.id,
  })

  const anyError = themesError ?? djsError ?? offresError

  return (
    <div style={{
      padding: '32px 40px',
      minHeight: '100vh',
      background: '#0d0d14',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, marginBottom: 4,
          background: 'linear-gradient(90deg, #f0f0f8, rgba(240,240,248,0.6))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Mes Classements
        </h1>
        <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.35)' }}>
          Impacts normalisés — indépendants du biais de programmation
        </div>
      </div>

      {/* Erreur de chargement */}
      {anyError && (
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
              {anyError instanceof Error ? anyError.message : String(anyError)}
            </div>
          </div>
        </div>
      )}

      {/* Note explicative */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 12,
        background: 'rgba(123,92,229,0.08)',
        border: '1px solid rgba(123,92,229,0.15)',
        marginBottom: 24,
        fontSize: 12,
        color: 'rgba(240,240,248,0.5)',
        lineHeight: 1.6,
      }}>
        ℹ️ Les classements sont <strong style={{ color: 'rgba(240,240,248,0.7)' }}>normalisés</strong> :
        un thème programmé uniquement le samedi n&apos;est pas avantagé par rapport à un thème programmé le mercredi.
        Clique sur une ligne pour voir le détail.
      </div>

      {/* 3 colonnes */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <ColonneClassement
          titre="Thèmes"
          emoji="🎨"
          lignes={themes ?? []}
          dimension="type"
          loading={themesLoading}
        />
        <ColonneClassement
          titre="DJs"
          emoji="🎧"
          lignes={djs ?? []}
          dimension="dj"
          loading={djsLoading}
        />
        <ColonneClassement
          titre="Offres & Promotions"
          emoji="🎁"
          lignes={offres ?? []}
          dimension="offre"
          loading={offresLoading}
        />
      </div>
    </div>
  )
}
