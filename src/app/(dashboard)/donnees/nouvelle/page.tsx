'use client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import SoireeForm from '@/components/donnees/SoireeForm'
import { useClub } from '@/hooks/useClub'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export default function NouvelleSoireePage() {
  const router = useRouter()
  const { data: club } = useClub()
  const { data: djs, isLoading } = useQuery({
    queryKey: ['djs', club?.id],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase.from('djs').select('id, nom').eq('club_id', club!.id).eq('actif', true)
      return data ?? []
    },
    enabled: !!club?.id,
  })

  if (!club || isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Nouvelle soirée</h1>
        <p className="text-muted-foreground text-sm mt-1">Saisir la configuration et les résultats</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{club.nom}</CardTitle>
        </CardHeader>
        <CardContent>
          <SoireeForm
            clubId={club.id}
            djs={djs ?? []}
            onSuccess={() => router.push('/donnees')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
