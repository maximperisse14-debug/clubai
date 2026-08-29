import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!club) return NextResponse.json({ error: 'Club introuvable' }, { status: 404 })

  const { error } = await supabase.rpc('recalcul_coefficients', { p_club_id: club.id })
  if (error) {
    console.error('[coefficients/recalcul]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
