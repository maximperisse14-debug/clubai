// eslint-disable-next-line @typescript-eslint/no-require-imports
const getJoursFeries = require('@socialgouv/jours-feries') as (year: number) => Record<string, Date>
import { addDays, isSameDay } from 'date-fns'

export function estVeilleFerie(date: Date): boolean {
  const lendemain = addDays(date, 1)
  const feries = getJoursFeries(lendemain.getFullYear())
  return Object.values(feries).some((f: Date) => isSameDay(f, lendemain))
}
