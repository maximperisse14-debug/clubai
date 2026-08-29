import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { calculerPredictionComplete, type ClubSettings } from '@/lib/predicteur/scoring-engine'

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu: YYYY-MM-DD'),
  typeEvenement: z.string().min(1),
  nomEvenement: z.string().optional(),
  djId: z.string().nullable().optional(),
  djNom: z.string().nullable().optional(),
  prevStandard: z.number().positive().optional(),
  prevStandardCA: z.number().positive().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }
    const body = parsed.data

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
