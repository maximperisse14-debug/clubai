'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getWeek, getYear } from 'date-fns'

const JOURS_ORDER = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
const MOIS_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const JOUR_COLORS: Record<string, string> = {
  Lundi:    '#ff6b6b',
  Mardi:    '#ff9f9f',
  Mercredi: '#f5a623',
  Jeudi:    '#5ddab0',
  Vendredi: '#7c5cfc',
  Samedi:   '#a07cff',
  Dimanche: '#888780',
}

function avg(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }
function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0) }
function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key])
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export function useDashboardStats(clubId: string | undefined) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['dashboard-stats', clubId],
    queryFn: async () => {
      const { data: soireesRaw, error } = await supabase
        .from('soirees')
        .select('*, djs ( nom ), resultats ( * )')
        .eq('club_id', clubId!)
      if (error) throw error
      if (!soireesRaw?.length) return null

      // Fusion — resultats est un tableau has-many, on prend le premier élément
      const soirees = soireesRaw
        .map(s => {
          const r = (s as any).resultats ?? {}
          return { ...s, dj_nom: (s.djs as any)?.nom ?? null, ...r }
        })
        .filter(s => (s as any).freq_reelle != null)

      if (!soirees.length) return null

      const freqMoy = avg(soirees.map(s => Number(s.freq_reelle)))
      const caMoy   = avg(soirees.map(s => Number(s.ca_total)).filter(Boolean))
      const panierMoy = avg(soirees.map(s => Number(s.panier_moyen)).filter(Boolean))
      const satMoy  = avg(soirees.map(s => Number(s.satisfaction)).filter(Boolean))

      // Précision prédictive = moyenne du dernier mois uniquement
      const dernierMois  = new Date(); dernierMois.setDate(1); dernierMois.setHours(0,0,0,0)
      const soireesLastM = soirees.filter(s => {
        const d = new Date((s as any).date)
        return d.getFullYear() === dernierMois.getFullYear() && d.getMonth() === dernierMois.getMonth()
      })
      const avecPred = soireesLastM.filter(s => s.prediction_freq && s.freq_reelle)
      const precisionFreq = avecPred.length > 0
        ? 100 - avg(avecPred.map(s => Math.abs(Number(s.freq_reelle) - Number(s.prediction_freq)) / Number(s.freq_reelle) * 100))
        : null
      const avecPredCA = soireesLastM.filter(s => s.prediction_ca && s.ca_total)
      const precisionCA = avecPredCA.length > 0
        ? 100 - avg(avecPredCA.map(s => Math.abs(Number(s.ca_total) - Number(s.prediction_ca)) / Number(s.ca_total) * 100))
        : null

      // Stats par jour de semaine
      const parJour = groupBy(soirees, 'jour')
      const freqParJour = JOURS_ORDER
        .filter(j => parJour[j]?.length)
        .map(j => ({
          jour: j,
          freq: Math.round(avg(parJour[j].map(s => Number(s.freq_reelle)))),
          color: JOUR_COLORS[j] ?? '#888780',
        }))
      const caParJour = JOURS_ORDER
        .filter(j => parJour[j]?.length)
        .map(j => ({
          jour: j,
          ca: Math.round(avg(parJour[j].map(s => Number(s.ca_total)).filter(Boolean))),
          color: JOUR_COLORS[j] ?? '#888780',
        }))

      // CA mensuel (somme par mois)
      const parMois = groupBy(soirees, 'mois')
      const caMensuel = MOIS_LABELS.map((label, i) => ({
        mois: label,
        ca: Math.round(sum((parMois[String(i + 1)] ?? []).map(s => Number(s.ca_total) || 0))),
      }))

      // Précision sur les 12 mois glissants en ordre CHRONOLOGIQUE (pas jan-déc)
      const now = new Date()
      const rollingMonths = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
        return {
          key:   `${d.getFullYear()}-${d.getMonth() + 1}`,
          label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
                  .replace('.', '').replace(' ', ' '),
        }
      })

      const parMoisRolling: Record<string, typeof soirees> = {}
      for (const s of soirees) {
        const d   = new Date((s as any).date)
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`
        if (!parMoisRolling[key]) parMoisRolling[key] = []
        parMoisRolling[key].push(s)
      }

      const precisionParMois = rollingMonths.map(({ key, label }) => {
        const ms = (parMoisRolling[key] ?? []).filter(
          s => (s as any).prediction_freq && (s as any).freq_reelle
            && (s as any).prediction_ca  && (s as any).ca_total
        )
        if (ms.length === 0) return { mois: label, precision: null }
        const pFreq = 100 - avg(ms.map(s => Math.abs(Number((s as any).freq_reelle) - Number((s as any).prediction_freq)) / Number((s as any).freq_reelle) * 100))
        const pCA   = 100 - avg(ms.map(s => Math.abs(Number((s as any).ca_total)    - Number((s as any).prediction_ca))  / Number((s as any).ca_total)    * 100))
        return { mois: label, precision: +Math.max(0, Math.min(100, (pFreq + pCA) / 2)).toFixed(1) }
      })

      // Dynamique mois actuel vs précédent
      const moisActuel   = new Date().getMonth() + 1
      const moisPrec     = moisActuel === 1 ? 12 : moisActuel - 1
      const moisPrecLabel = MOIS_LABELS[moisPrec - 1].toLowerCase() + '.'
      function dynamique(getter: (s: any) => number | null) {
        const vals = (arr: any[]) => arr.map(getter).filter((x): x is number => x != null)
        const actuel   = avg(vals(parMois[String(moisActuel)] ?? []))
        const precedent = avg(vals(parMois[String(moisPrec)] ?? []))
        return precedent ? ((actuel - precedent) / precedent) * 100 : null
      }

      // Stats hebdomadaires (semaine ISO année+numéro)
      const parSemaine: Record<string, typeof soirees> = {}
      for (const s of soirees) {
        const d   = new Date((s as any).date)
        const cle = `${getYear(d)}-S${String(getWeek(d, { weekStartsOn: 1 })).padStart(2, '0')}`
        if (!parSemaine[cle]) parSemaine[cle] = []
        parSemaine[cle].push(s)
      }
      const semainesTriees = Object.keys(parSemaine).sort((a, b) => {
        const [anA, sA] = a.split('-S').map(Number)
        const [anB, sB] = b.split('-S').map(Number)
        return anA !== anB ? anA - anB : sA - sB
      })
      const caHebdo = semainesTriees.map(cle => ({
        semaine:    cle,
        caMoyen:    Math.round(avg(parSemaine[cle].map(s => Number((s as any).ca_total) || 0))),
        nbSoirees:  parSemaine[cle].length,
      }))
      const freqHebdo = semainesTriees.map(cle => ({
        semaine:      cle,
        freqMoyenne:  Math.round(avg(parSemaine[cle].map(s => Number((s as any).freq_reelle) || 0))),
        nbSoirees:    parSemaine[cle].length,
      }))

      return {
        freqMoy, caMoy, panierMoy, satMoy,
        precisionFreq, precisionCA,
        freqParJour, caParJour, caMensuel, precisionParMois,
        caHebdo, freqHebdo,
        dynamiqueFreq:   dynamique(s => s.freq_reelle   != null ? Number(s.freq_reelle)   : null),
        dynamiqueCA:     dynamique(s => s.ca_total      != null ? Number(s.ca_total)      : null),
        dynamiquePanier: dynamique(s => s.panier_moyen  != null ? Number(s.panier_moyen)  : null),
        dynamiqueSat:    dynamique(s => s.satisfaction  != null ? Number(s.satisfaction)  : null),
        nbSoirees: soirees.length,
        moisPrecLabel,
      }
    },
    enabled: !!clubId,
  })
}
