// Calendrier officiel des vacances scolaires françaises 2024-2026
// Source : https://www.education.gouv.fr/calendrier-scolaire
// À mettre à jour chaque année ou remplacer par un fetch de l'API gouvernementale.

type Zone = 'A' | 'B' | 'C'

interface Periode {
  zones: Zone[]
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD (inclus)
}

const PERIODES: Periode[] = [
  // 2024-2025
  { zones: ['A','B','C'], start: '2024-10-19', end: '2024-11-03' }, // Toussaint
  { zones: ['A','B','C'], start: '2024-12-21', end: '2025-01-06' }, // Noël
  { zones: ['A'],         start: '2025-02-08', end: '2025-02-23' }, // Hiver
  { zones: ['B'],         start: '2025-02-15', end: '2025-03-02' },
  { zones: ['C'],         start: '2025-02-22', end: '2025-03-09' },
  { zones: ['A'],         start: '2025-04-05', end: '2025-04-20' }, // Printemps
  { zones: ['B'],         start: '2025-04-12', end: '2025-04-27' },
  { zones: ['C'],         start: '2025-04-19', end: '2025-05-04' },
  { zones: ['A','B','C'], start: '2025-07-05', end: '2025-08-31' }, // Été

  // 2025-2026
  { zones: ['A','B','C'], start: '2025-10-18', end: '2025-11-02' }, // Toussaint
  { zones: ['A','B','C'], start: '2025-12-20', end: '2026-01-05' }, // Noël
  { zones: ['A'],         start: '2026-02-07', end: '2026-02-22' }, // Hiver
  { zones: ['B'],         start: '2026-02-14', end: '2026-03-01' },
  { zones: ['C'],         start: '2026-02-21', end: '2026-03-08' },
  { zones: ['A'],         start: '2026-04-04', end: '2026-04-19' }, // Printemps
  { zones: ['B'],         start: '2026-04-11', end: '2026-04-26' },
  { zones: ['C'],         start: '2026-04-18', end: '2026-05-03' },
  { zones: ['A','B','C'], start: '2026-07-04', end: '2026-08-31' }, // Été
]

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function estEnVacances(date: Date, zone: Zone): boolean {
  const d = toYMD(date)
  return PERIODES.some(p => p.zones.includes(zone) && d >= p.start && d <= p.end)
}

/** Retourne la date de début des prochaines vacances (ou null si aucune dans les 30 jours). */
export function getProchainDebutVacances(date: Date, zone: Zone): Date | null {
  const d = toYMD(date)
  const futures = PERIODES
    .filter(p => p.zones.includes(zone) && p.start > d)
    .sort((a, b) => a.start.localeCompare(b.start))
  if (futures.length === 0) return null
  const [y, m, day] = futures[0].start.split('-').map(Number)
  return new Date(y, m - 1, day)
}

/** Retourne la date de fin des vacances en cours (ou null si pas en vacances). */
export function getFinVacancesEnCours(date: Date, zone: Zone): Date | null {
  const d = toYMD(date)
  const enCours = PERIODES.find(p => p.zones.includes(zone) && d >= p.start && d <= p.end)
  if (!enCours) return null
  const [y, m, day] = enCours.end.split('-').map(Number)
  return new Date(y, m - 1, day)
}

export function estPremiereSemainePostVacances(date: Date, zone: Zone): boolean {
  const fin = getFinVacancesEnCours(new Date(date.getTime() - 7 * 86400000), zone)
  if (!fin) return false
  const diffMs = date.getTime() - fin.getTime()
  return diffMs > 0 && diffMs <= 7 * 86400000
}

export function getAvantVacancesInfo(date: Date, zone: Zone): 'jeudi' | 'vendredi' | null {
  if (estEnVacances(date, zone)) return null
  const prochain = getProchainDebutVacances(date, zone)
  if (!prochain) return null
  const diffDays = Math.round((prochain.getTime() - date.getTime()) / 86400000)
  const jourSemaine = date.getDay() // 0=dim,1=lun,...,4=jeu,5=ven
  if (diffDays <= 3 && jourSemaine === 4) return 'jeudi'
  if (diffDays <= 3 && jourSemaine === 5) return 'vendredi'
  return null
}
