'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getHWForecastForDate, SCORE_NEUTRE } from '@/lib/analytics/hw-daily-data'
import { calculerScoreCalendrier } from '@/lib/calendrier/score-calendrier'

const JOURS_NOM: Record<number, string> = {
  0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
}

export interface JourPlanning {
  date: string
  label: string
  jourNom: string
  estOuvert: boolean
  soiree?: {
    id: string
    nomEvenement: string
    typeEvenement: string
    djNom?: string
    heureOuverture?: string
    heureFermeture?: string
    promotion?: string
    predFreqActuelle: number
    predCAActuelle: number
    predFreqInitiale?: number
    predCAInitiale?: number
    variationFreq24h?: number
    variationCA24h?: number
  }
  previsionStandard?: { freq: number; ca: number }
}

export function usePlanning(
  mode: 'semaine' | 'mois',
  dateRef: Date,
  clubId: string | undefined,
) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['planning', mode, format(dateRef, 'yyyy-MM-dd'), clubId],
    queryFn: async () => {
      if (!clubId) return []

      const debut = mode === 'semaine'
        ? startOfWeek(dateRef, { weekStartsOn: 1 })
        : startOfMonth(dateRef)
      const fin = mode === 'semaine'
        ? endOfWeek(dateRef, { weekStartsOn: 1 })
        : endOfMonth(dateRef)

      const { data: settings } = await supabase
        .from('club_settings')
        .select('jours_ouverture, zone_vacances, region')
        .eq('club_id', clubId)
        .single()

      const joursOuverture: string[] = settings?.jours_ouverture ?? ['Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

      const { data: soirees } = await supabase
        .from('soirees')
        .select(`
          id, date, nom_evenement, type_evenement,
          heure_ouverture, heure_fermeture, promotion,
          prediction_freq, prediction_ca,
          prediction_freq_initiale, prediction_ca_initiale,
          variation_freq_24h, variation_ca_24h,
          djs ( nom )
        `)
        .eq('club_id', clubId)
        .gte('date', format(debut, 'yyyy-MM-dd'))
        .lte('date', format(fin, 'yyyy-MM-dd'))
        .order('date')

      const soireeByDate: Record<string, any> = {}
      soirees?.forEach((s: any) => { soireeByDate[s.date] = s })

      const jours = eachDayOfInterval({ start: debut, end: fin })
      const result: JourPlanning[] = []

      for (const jour of jours) {
        const dateStr = format(jour, 'yyyy-MM-dd')
        const jourNom = JOURS_NOM[getDay(jour)]
        const estOuvert = joursOuverture.includes(jourNom)
        const soiree = soireeByDate[dateStr]

        let previsionStandard: { freq: number; ca: number } | undefined
        if (estOuvert && !soiree) {
          const hw = getHWForecastForDate(jour)
          const sCalendrier = calculerScoreCalendrier({ date: jour, zoneVacances: settings?.zone_vacances ?? 'B', region: settings?.region ?? 'PACA' })
          const coeff = (sCalendrier * 0.40 + 70 * 0.60) / SCORE_NEUTRE
          previsionStandard = {
            freq: Math.round(hw.freq * coeff),
            ca: Math.round(hw.ca * coeff),
          }
        }

        result.push({
          date: dateStr,
          label: format(jour, 'EEE d', { locale: fr }),
          jourNom,
          estOuvert,
          soiree: soiree ? {
            id: soiree.id,
            nomEvenement: soiree.nom_evenement,
            typeEvenement: soiree.type_evenement,
            djNom: soiree.djs?.nom,
            heureOuverture: soiree.heure_ouverture,
            heureFermeture: soiree.heure_fermeture,
            promotion: soiree.promotion,
            predFreqActuelle: soiree.prediction_freq,
            predCAActuelle: soiree.prediction_ca,
            predFreqInitiale: soiree.prediction_freq_initiale,
            predCAInitiale: soiree.prediction_ca_initiale,
            variationFreq24h: soiree.variation_freq_24h,
            variationCA24h: soiree.variation_ca_24h,
          } : undefined,
          previsionStandard,
        })
      }

      return result
    },
    enabled: !!clubId,
    staleTime: 1000 * 60 * 2,
  })
}
