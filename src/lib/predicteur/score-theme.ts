export interface CoeffRow {
  dimension: string
  valeur: string
  impact_pct_freq: number
  nb_soirees: number
}

const COEF_TYPE_DEFAUT: Record<string, number> = {
  'Étudiante':      1.38,
  'Latino':         1.28,
  'Techno':         1.22,
  'Années 80/90':   1.18,
  'House':          1.12,
  'Afterwork':      1.10,
  'Match & DJ set': 1.08,
  'Open format':    1.05,
  'Blind test':     0.95,
  'Live acoustique':0.90,
  'Généraliste':    0.88,
  'Karaoké':        0.82,
}

const COEF_DJ_DEFAUT: Record<string, number> = {
  'DJ Martin': 1.28,
  'DJ Sarah':  1.22,
  'DJ Clara':  1.15,
  'DJ Emma':   1.08,
  'DJ Alex':   0.97,
  'DJ Lucas':  0.90,
  'DJ Noé':    0.95,
  'Sans DJ':   0.80,
}

export function calculerScoreTheme({
  typeEvenement,
  djId,
  djNom,
  coefficients,
}: {
  typeEvenement: string
  djId: string | null
  djNom?: string | null
  coefficients: CoeffRow[]
}): number {
  let coefType = COEF_TYPE_DEFAUT[typeEvenement] ?? 1.0
  let coefDJ   = djId ? 1.0 : (COEF_DJ_DEFAUT['Sans DJ'] ?? 0.8)

  if (coefficients.length > 0) {
    const coefTypeReel = coefficients.find(c => c.dimension === 'type' && c.valeur === typeEvenement)
    if (coefTypeReel?.impact_pct_freq != null) {
      coefType = 1 + coefTypeReel.impact_pct_freq / 100
    }

    if (djNom) {
      const coefDJReel = coefficients.find(c => c.dimension === 'dj' && c.valeur === djNom)
      if (coefDJReel?.impact_pct_freq != null) {
        coefDJ = 1 + coefDJReel.impact_pct_freq / 100
      } else {
        coefDJ = COEF_DJ_DEFAUT[djNom] ?? 1.0
      }
    }
  } else if (djNom) {
    coefDJ = COEF_DJ_DEFAUT[djNom] ?? 1.0
  }

  const coefCombine = coefType * coefDJ
  // Neutre (coef 1.0) → 70, coef 1.8 → 94, coef 0.8 → 64
  const score = Math.max(0, Math.min(100, 70 + 30 * (coefCombine - 1.0)))
  return +score.toFixed(1)
}
