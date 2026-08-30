// eslint-disable-next-line @typescript-eslint/no-require-imports
const getJoursFeries = require('@socialgouv/jours-feries') as (year: number) => Record<string, Date>

import { format } from 'date-fns'
import {
  estEnVacances,
  estPremiereSemainePostVacances,
  getAvantVacancesInfo,
} from './vacances-fr'
import { getCoeffMensuel, convertirCoeffMensuelEnBonus } from './coeffs-regionaux'

export interface CalendrierInput {
  date: Date
  zoneVacances: 'A' | 'B' | 'C'
  region: string
  ville?: string
}

const SCORE_JOUR: Record<number, number> = {
  1: 5,   // lundi
  2: 8,   // mardi
  3: 15,  // mercredi
  4: 35,  // jeudi
  5: 60,  // vendredi
  6: 70,  // samedi
  0: 20,  // dimanche
}

const BONUS_SEMAINE_MOIS: Record<string, number> = {
  premiere: 10,
  deuxieme: 5,
  troisieme: 0,
  derniere: -10,
}

function getSemaineDuMois(date: Date): keyof typeof BONUS_SEMAINE_MOIS {
  const jour = date.getDate()
  if (jour <= 7)  return 'premiere'
  if (jour <= 14) return 'deuxieme'
  if (jour <= 21) return 'troisieme'
  return 'derniere'
}

function toYMD(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function estJourFerie(date: Date): boolean {
  const feries = getJoursFeries(date.getFullYear())
  const d = toYMD(date)
  return Object.values(feries).some(f => toYMD(f as unknown as Date) === d)
}

export function estVeilleFerie(date: Date): boolean {
  const demain = new Date(date.getTime() + 86400000)
  return estJourFerie(demain)
}

export function estWeekendOuVeilleFerie(date: Date): boolean {
  const jour = date.getDay()
  // Fri = 5, Sat = 6, Sun = 0
  if (jour === 5 || jour === 6 || jour === 0) return true
  return estVeilleFerie(date)
}

export function calculerScoreCalendrier(input: CalendrierInput): number {
  const jourSemaine = input.date.getDay()
  let score = SCORE_JOUR[jourSemaine] ?? 20

  const semaine = getSemaineDuMois(input.date)
  score += BONUS_SEMAINE_MOIS[semaine]

  if (estEnVacances(input.date, input.zoneVacances)) {
    score += -10
  }

  if (estVeilleFerie(input.date)) {
    score += 25
  }

  const avantVac = getAvantVacancesInfo(input.date, input.zoneVacances)
  if (avantVac === 'jeudi')   score += 12
  if (avantVac === 'vendredi') score += 18

  if (estPremiereSemainePostVacances(input.date, input.zoneVacances)) {
    score += -8
  }

  const mois = input.date.getMonth() + 1
  if ([6, 7, 8].includes(mois)) score += 10

  const coeff = getCoeffMensuel(input.region, input.ville, mois)
  score += convertirCoeffMensuelEnBonus(coeff)

  return Math.max(0, Math.min(100, score))
}
