'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import CalendrierGrid, { type CellClickInfo } from '@/components/calendrier/CalendrierGrid'
import CelluleModal from '@/components/calendrier/CelluleModal'
import { useClub } from '@/hooks/useClub'
import { useSoirees } from '@/hooks/useSoirees'
import { useDJs } from '@/hooks/useDJs'
import { useClubSettings } from '@/hooks/useClubSettings'

export default function CalendrierPage() {
  const { data: club } = useClub()
  const { data: soirees, isLoading, refetch } = useSoirees(club?.id ?? '', undefined)
  const { data: djs = [] } = useDJs(club?.id)
  const { data: settings } = useClubSettings(club?.id)
  const [modalInfo, setModalInfo] = useState<CellClickInfo | null>(null)

  const events = (soirees ?? []).map((s: any) => ({
    date:           s.date,
    type:           s.type_evenement,
    nomEvenement:   s.nom_evenement ?? null,
    dj:             s.dj_nom ?? null,
    freq:           s.freq_reelle ?? null,
    ca:             s.ca_total ?? null,
    tauxRemplissage:s.taux_remplissage ?? null,
    predictionFreq: s.prediction_freq ?? null,
    predictionCa:   s.prediction_ca ?? null,
    predictionScore:s.prediction_score_global ?? null,
  }))

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-grad">Planning</div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--t1)' }}>
          Calendrier de performance
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>Vue mensuelle de vos soirées</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <CalendrierGrid
              events={events}
              joursOuverture={settings?.jours_ouverture ?? []}
              ouvertureVeillesFeries={settings?.ouverture_veilles_feries ?? false}
              onDayClick={info => setModalInfo(info)}
            />
          )}
        </CardContent>
      </Card>

      {modalInfo && club?.id && (
        <CelluleModal
          open={!!modalInfo}
          date={modalInfo.date}
          type={modalInfo.type as any}
          event={modalInfo.event}
          prediction={modalInfo.prediction}
          clubId={club.id}
          djs={djs}
          onClose={() => setModalInfo(null)}
          onRefresh={() => refetch()}
        />
      )}
    </div>
  )
}
