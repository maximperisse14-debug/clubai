'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format, addDays, subDays, getDay, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getHWForecastForDate, SCORE_NEUTRE } from '@/lib/analytics/hw-daily-data'
import { calculerScoreCalendrier } from '@/lib/calendrier/score-calendrier'
import { useClub } from '@/hooks/useClub'
import type { JourData } from '@/lib/analytics/daily-data'

const SCORE_METEO_NEUTRE = 70
const SCORE_THEME_NEUTRE = 70

const NOM_TO_WD: Record<string, number> = {
  Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 0,
}

export function useDailyData() {
  const { data: club } = useClub()
  const supabase = createClient()

  return useQuery({
    queryKey: ['daily-data-v3', club?.id],
    queryFn: async (): Promise<JourData[]> => {
      if (!club?.id) return []

      const now = new Date()
      now.setHours(12, 0, 0, 0)
      const todayStr  = format(now, 'yyyy-MM-dd')
      const dateDebut = subDays(now, 180)
      const dateFin   = addDays(now, 120)

      // ── 1. Soirées réalisées ─────────────────────────────────────────────────
      const { data: soireesRaw } = await supabase
        .from('soirees')
        .select('date, nom_evenement, type_evenement, prediction_freq, prediction_ca, djs(nom), resultats(freq_reelle, ca_total)')
        .eq('club_id', club.id)
        .gte('date', format(dateDebut, 'yyyy-MM-dd'))
        .lt('date', todayStr)
        .order('date')

      // ── 2. Réglages club ─────────────────────────────────────────────────────
      const { data: settings } = await supabase
        .from('club_settings')
        .select('zone_vacances, region, ville, jours_ouverture')
        .eq('club_id', club.id)
        .maybeSingle()

      const joursOuvertureRaw = settings?.jours_ouverture as string[] | null | undefined
      const joursOuvertureWD: Set<number> = new Set(
        joursOuvertureRaw
          ? joursOuvertureRaw.map(j => NOM_TO_WD[j]).filter((n): n is number => n != null)
          : [3, 4, 5, 6],  // mer, jeu, ven, sam par défaut
      )

      const result: JourData[] = []

      // ── 3. PASSÉ : soirées Supabase avec résultats ───────────────────────────
      for (const s of soireesRaw ?? []) {
        const r = s.resultats as any
        if (!r || r.freq_reelle == null) continue

        const freqReelle = r.freq_reelle as number
        const caReel     = r.ca_total   as number | null
        const djNom      = (s.djs as any)?.nom ?? undefined
        const date       = new Date(s.date + 'T12:00:00')

        const precFreq = s.prediction_freq && freqReelle > 0
          ? Math.max(0, +(100 - Math.abs(s.prediction_freq - freqReelle) / freqReelle * 100).toFixed(1))
          : undefined
        const precCA = s.prediction_ca && caReel && caReel > 0
          ? Math.max(0, +(100 - Math.abs(s.prediction_ca - caReel) / caReel * 100).toFixed(1))
          : undefined

        result.push({
          date:            s.date,
          label:           format(date, 'EEE d MMM', { locale: fr }),
          type:            'passe_avec_soiree',
          freq_reelle:     freqReelle,
          ca_reel:         caReel ?? undefined,
          pred_freq_passe: s.prediction_freq ?? undefined,
          pred_ca_passe:   s.prediction_ca   ?? undefined,
          nom_evenement:   s.nom_evenement    ?? undefined,
          type_evenement:  s.type_evenement   ?? undefined,
          dj_nom:          djNom,
          precision_freq:  precFreq,
          precision_ca:    precCA,
          wd:              getDay(date),
        })
      }

      // ── 4. FUTUR : jours ouverts de aujourd'hui à +4 mois ───────────────────
      let cursor = new Date(now)
      const endFutur = new Date(dateFin)
      endFutur.setHours(12, 0, 0, 0)

      while (cursor <= endFutur) {
        const wd = getDay(cursor)
        if (joursOuvertureWD.has(wd)) {
          const dateStr = format(cursor, 'yyyy-MM-dd')
          const hw      = getHWForecastForDate(cursor)
          if (hw.freq > 0) {
            const joursAvant  = differenceInDays(cursor, now)
            const meteoFiable = joursAvant <= 7
            const sCalendrier = calculerScoreCalendrier({
              date:         cursor,
              zoneVacances: settings?.zone_vacances ?? 'B',
              region:       settings?.region        ?? 'Île-de-France',
              ville:        settings?.ville,
            })
            const pCal = 0.30
            const pMet = meteoFiable ? 0.20 : 0.05
            const pTh  = 0.30
            const tot  = pCal + pMet + pTh
            const coeff = (sCalendrier * pCal + SCORE_METEO_NEUTRE * pMet + SCORE_THEME_NEUTRE * pTh) / tot / SCORE_NEUTRE

            result.push({
              date:           dateStr,
              label:          format(cursor, 'EEE d MMM', { locale: fr }),
              type:           'futur',
              wd,
              prev_freq:      Math.round(hw.freq     * coeff),
              prev_ca:        Math.round(hw.ca       * coeff),
              prev_freq_low:  Math.round(hw.freqLow  * coeff),
              prev_freq_high: Math.round(hw.freqHigh * coeff),
              prev_ca_low:    Math.round(hw.caLow    * coeff),
              prev_ca_high:   Math.round(hw.caHigh   * coeff),
              meteo_fiable:   meteoFiable,
              concurrence_dispo: false,
            })
          }
        }
        cursor = addDays(cursor, 1)
      }

      result.sort((a, b) => a.date.localeCompare(b.date))
      return result
    },
    enabled: !!club?.id,
    staleTime: 1000 * 60 * 5,
  })
}
