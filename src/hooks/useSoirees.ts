'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useSoirees(
  clubId: string,
  filters?: { mois?: number; jour?: string; type?: string; dj?: string }
) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['soirees', clubId, filters],
    queryFn: async () => {
      let q = supabase
        .from('soirees')
        .select('*, djs ( nom, cout_base ), resultats ( * )')
        .eq('club_id', clubId)
        .order('date', { ascending: false })

      if (filters?.mois) q = q.eq('mois', filters.mois)
      if (filters?.jour) q = q.eq('jour', filters.jour)
      if (filters?.type) q = q.eq('type_evenement', filters.type)
      if (filters?.dj) q = q.eq('dj_id', filters.dj)

      const { data, error } = await q
      if (error) throw error

      return (data ?? []).map((s: any) => {
        const r = (s as any).resultats ?? {}
        return {
          ...s,
          dj_nom:       s.djs?.nom       ?? null,
          dj_cout_base: s.djs?.cout_base ?? null,
          ...r,
        }
      })
    },
    enabled: !!clubId,
  })
}
