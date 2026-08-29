export const JOUR_NOM_TO_GETDAY: Record<string, number> = {
  'Dimanche': 0, 'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4, 'Vendredi': 5, 'Samedi': 6,
}

export const GETDAY_TO_JOUR_NOM: Record<number, string> = {
  0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
}

export function joursOuvertureVersGetDay(joursOuverture: string[]): number[] {
  return joursOuverture
    .map(j => JOUR_NOM_TO_GETDAY[j])
    .filter((n): n is number => n != null)
}
