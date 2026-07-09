'use client'
import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import SoireesTable from '@/components/donnees/SoireesTable'
import { useClub } from '@/hooks/useClub'
import { useSoirees } from '@/hooks/useSoirees'

export default function DonneesPage() {
  const { data: club, isLoading: clubLoading, error: clubError } = useClub()
  const { data: soirees, isLoading, error: soireesError } = useSoirees(club?.id ?? '', undefined)

  const anyError = clubError ?? soireesError

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-grad">Historique</div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--t1)' }}>Données</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>Historique de vos soirées</p>
        </div>
        <Link href="/donnees/nouvelle">
          <Button size="sm" className="gap-1.5">
            <Plus size={14} />
            Nouvelle soirée
          </Button>
        </Link>
      </div>

      {anyError && (
        <div className="flex items-start gap-3 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-xs mt-0.5 font-mono break-all">
              {(anyError as any)?.message ?? String(anyError)}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {soirees ? `${soirees.length} soirée${soirees.length !== 1 ? 's' : ''}` : 'Soirées'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || clubLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !anyError ? (
            <SoireesTable data={(soirees as any[]) ?? []} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
