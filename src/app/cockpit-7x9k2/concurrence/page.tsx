import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export default async function CockpitConcurrenceIndex() {
  const supabase = await createClient()
  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, nom, ville')
    .order('nom')

  return (
    <div className="p-6 space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-white">Cockpit — Études concurrence</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Sélectionne un club pour gérer son calendrier de coefficients concurrence.
        </p>
      </div>

      {!clubs || clubs.length === 0 ? (
        <p className="text-zinc-500 text-sm">Aucun club enregistré.</p>
      ) : (
        <div className="grid gap-3">
          {clubs.map(club => (
            <Link key={club.id} href={`/cockpit-7x9k2/concurrence/${club.id}`}>
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <div className="text-white font-medium">{club.nom}</div>
                    <div className="text-zinc-500 text-sm">{club.ville || 'Ville non renseignée'}</div>
                  </div>
                  <span className="text-zinc-600 text-sm">›</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
