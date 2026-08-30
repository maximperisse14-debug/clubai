'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useClubSettings(clubId?: string) {
  const supabase = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: ['club_settings', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_settings')
        .select('*')
        .eq('club_id', clubId!)
        .single()
      // PGRST116 = aucune ligne trouvée — normal pour un club qui n'a
      // encore jamais enregistré ses réglages, pas une vraie erreur.
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!clubId,
  })
}
