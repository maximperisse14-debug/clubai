'use client'
import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export function useDJs(clubId?: string) {
  return useQuery({
    queryKey: ['djs', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('djs')
        .select('id, nom')
        .eq('club_id', clubId!)
        .eq('actif', true)
        .order('nom')
      if (error) throw error
      return data as { id: string; nom: string }[]
    },
    enabled: !!clubId,
  })
}
