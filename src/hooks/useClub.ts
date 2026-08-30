'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useClub() {
  const supabase = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: ['club'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user.id)
        .single()
      if (error) throw error
      return data
    },
  })
}
