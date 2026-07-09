import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { calculerPredictionComplete, type ClubSettings } from '@/lib/predicteur/scoring-engine'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      date: string
      typeEvenement: string
      nomEvenement?: string
      djId?: string | null
      djNom?: string | null
      prevStandard?: number
      prevStandardCA?: number
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(toSet) {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: club } = await supabase
      .from('clubs')
      .select('id, capacite')
      .eq('owner_id', user.id)
      .single()

    if (!club) return NextResponse.json({ error: 'Club introuvable' }, { status: 404 })

    const settings: ClubSettings = {
      club_id: club.id,
      capacite: club.capacite ?? 350,
    }

    const { data: coefficients } = await supabase
      .from('coefficients')
      .select('dimension, valeur, impact_pct_freq, nb_soirees')
      .eq('club_id', club.id)

    const result = await calculerPredictionComplete(
      {
        clubId:          club.id,
        date:            new Date(body.date + 'T12:00:00'),
        typeEvenement:   body.typeEvenement,
        nomEvenement:    body.nomEvenement,
        djId:            body.djId ?? null,
        djNom:           body.djNom ?? null,
        prevStandard:    body.prevStandard,
        prevStandardCA:  body.prevStandardCA,
      },
      settings,
      coefficients ?? [],
    )

    return NextResponse.json(result)
  } catch (err) {
    console.error('[predicteur/v2]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
