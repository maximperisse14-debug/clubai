'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useCoefficients(clubId: string, dimension?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['coefficients', clubId, dimension],
    queryFn: async () => {
      let q = supabase.from('coefficients').select('*').eq('club_id', clubId)
      if (dimension) q = q.eq('dimension', dimension)
      const { data, error } = await q
      if (error) throw error
      return data
    },
    enabled: !!clubId,
  })
}
