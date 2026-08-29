'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useClubSettings(clubId?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['club_settings', clubId],
    queryFn: async () => {
      const { data } = await supabase
        .from('club_settings')
        .select('*')
        .eq('club_id', clubId!)
        .single()
      return data
    },
    enabled: !!clubId,
  })
}
