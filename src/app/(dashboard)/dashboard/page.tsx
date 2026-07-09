'use client'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import MetricCard from '@/components/dashboard/MetricCard'
import ChartCA from '@/components/dashboard/ChartCA'
import ChartFreqByDay from '@/components/dashboard/ChartFreqByDay'
import ChartCaByDay from '@/components/dashboard/ChartCaByDay'
import ChartPrecision from '@/components/dashboard/ChartPrecision'
import ChartFreqHebdo from '@/components/dashboard/ChartFreqHebdo'
import ChartCAHebdo from '@/components/dashboard/ChartCAHebdo'
import { useClub } from '@/hooks/useClub'
import { useDashboardStats } from '@/hooks/useDashboardStats'

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  )
}

function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="text-4xl">📊</div>
      <h2 className="text-xl font-semibold">Aucune soirée enregistrée</h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        Ajoute ta première soirée pour commencer à voir tes performances et analyses ici.
      </p>
      <Link href="/donnees/nouvelle">
        <Button className="gap-2 mt-2">
          <Plus size={14} />
          Ajouter une soirée
        </Button>
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  const { data: club, isLoading: clubLoading } = useClub()
  const { data: stats, isLoading: statsLoading } = useDashboardStats(club?.id)

  if (clubLoading || statsLoading) return <DashboardSkeleton />
  if (!stats) return <EmptyDashboard />

  const prec = stats.precisionFreq != null && stats.precisionCA != null
    ? ((stats.precisionFreq + stats.precisionCA) / 2)
    : stats.precisionFreq ?? stats.precisionCA

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-grad">
          Vue d'ensemble
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--t1)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>
          {stats.nbSoirees} soirée{stats.nbSoirees !== 1 ? 's' : ''} analysée{stats.nbSoirees !== 1 ? 's' : ''}
        </p>
      </div>

      {/* 5 KPI cards */}
      <div className="grid grid-cols-5 gap-3">
        <MetricCard
          label="Fréquentation moy."
          value={`${Math.round(stats.freqMoy)} pers.`}
          subtext={`${stats.nbSoirees} soirées`}
          trend={stats.dynamiqueFreq}
          moisPrecedent={stats.moisPrecLabel}
        />
        <MetricCard
          label="CA moyen / soirée"
          value={`${Math.round(stats.caMoy).toLocaleString('fr-FR')} €`}
          subtext="chiffre d'affaires"
          trend={stats.dynamiqueCA}
          moisPrecedent={stats.moisPrecLabel}
        />
        <MetricCard
          label="Panier moyen"
          value={`${stats.panierMoy.toFixed(2).replace('.', ',')} €`}
          subtext="par personne"
          trend={stats.dynamiquePanier}
          moisPrecedent={stats.moisPrecLabel}
        />
        <MetricCard
          label="Satisfaction"
          value={`${stats.satMoy.toFixed(2).replace('.', ',')} / 5`}
          subtext={`${stats.nbSoirees} notes`}
          trend={stats.dynamiqueSat}
          moisPrecedent={stats.moisPrecLabel}
        />
        <MetricCard
          label="Précision prédictive"
          value={prec != null ? `${prec.toFixed(1).replace('.', ',')}%` : '—'}
          subtext="moy. fréq. + CA"
          highlight
        />
      </div>

      {/* CA mensuel — full width */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold" style={{ color: 'var(--t1)' }}>CA mensuel</CardTitle>
          <p className="text-[11px] -mt-0.5" style={{ color: 'var(--t3)' }}>Chiffre d'affaires total par mois (€)</p>
        </CardHeader>
        <CardContent>
          <ChartCA data={stats.caMensuel} />
        </CardContent>
      </Card>

      {/* Fréq + CA par jour — 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold" style={{ color: 'var(--t1)' }}>Fréquentation par jour</CardTitle>
            <p className="text-[11px] -mt-0.5" style={{ color: 'var(--t3)' }}>Moyenne personnes / soirée selon le jour</p>
          </CardHeader>
          <CardContent>
            <ChartFreqByDay data={stats.freqParJour} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold" style={{ color: 'var(--t1)' }}>CA par jour</CardTitle>
            <p className="text-[11px] -mt-0.5" style={{ color: 'var(--t3)' }}>Chiffre d'affaires moyen selon le jour (€)</p>
          </CardHeader>
          <CardContent>
            <ChartCaByDay data={stats.caParJour} />
          </CardContent>
        </Card>
      </div>

      {/* Courbes hebdomadaires — 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold" style={{ color: 'var(--t1)' }}>Fréquentation hebdomadaire</CardTitle>
            <p className="text-[11px] -mt-0.5" style={{ color: 'var(--t3)' }}>Moyenne personnes / soirée par semaine</p>
          </CardHeader>
          <CardContent>
            <ChartFreqHebdo data={stats.freqHebdo} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold" style={{ color: 'var(--t1)' }}>CA moyen hebdomadaire</CardTitle>
            <p className="text-[11px] -mt-0.5" style={{ color: 'var(--t3)' }}>Chiffre d'affaires moyen par semaine (€)</p>
          </CardHeader>
          <CardContent>
            <ChartCAHebdo data={stats.caHebdo} />
          </CardContent>
        </Card>
      </div>

      {/* CTA Prédicteur HW */}
      <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--t1)' }}>Projections Holt-Winters × Scoring</div>
          <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>Courbe de prévision 6 mois + simulateur de soirée interactif</div>
        </div>
        <Link href="/predicteur">
          <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white whitespace-nowrap" style={{ background: 'var(--grad)', border: 'none', cursor: 'pointer' }}>
            Ouvrir le prédicteur →
          </button>
        </Link>
      </div>

      {/* Précision prédictive — full width */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold" style={{ color: 'var(--t1)' }}>Précision prédictive</CardTitle>
          <p className="text-[11px] -mt-0.5" style={{ color: 'var(--t3)' }}>Courbe d'apprentissage sur 12 mois glissants</p>
        </CardHeader>
        <CardContent>
          <ChartPrecision data={stats.precisionParMois} />
        </CardContent>
      </Card>
    </div>
  )
}
