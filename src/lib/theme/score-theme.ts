export interface CoeffRow {
  dimension: string
  valeur: string
  impact_pct_freq: number
  nb_soirees: number
}

export interface MappingRow {
  nom_evenement_specifique: string
  type_evenement_parent: string
}

const MIN_SOIREES = 3
const DEFAULT_SCORE = 80

function convertirImpactEnScore(impactPct: number): number {
  return Math.max(0, Math.min(100, 50 + impactPct))
}

export function calculerScoreTheme(
  typeEvenement: string,
  nomEvenement: string | undefined,
  coefficients: CoeffRow[],
  mappings: MappingRow[],
): number {
  const typeCoeffs = coefficients.filter(c => c.dimension === 'type')

  // 1. Correspondance exacte
  const exact = typeCoeffs.find(c => c.valeur === typeEvenement)
  if (exact && exact.nb_soirees >= MIN_SOIREES) {
    return convertirImpactEnScore(exact.impact_pct_freq)
  }

  // 2. Via mapping événement dérivé
  if (nomEvenement) {
    const mapping = mappings.find(m => m.nom_evenement_specifique === nomEvenement)
    if (mapping) {
      const parent = typeCoeffs.find(c => c.valeur === mapping.type_evenement_parent)
      if (parent && parent.nb_soirees >= MIN_SOIREES) {
        return convertirImpactEnScore(parent.impact_pct_freq)
      }
    }
  }

  return DEFAULT_SCORE
}
