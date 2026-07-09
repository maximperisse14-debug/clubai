export const COEFS_PILOTE = {
  jour: {
    'Lundi': 0.38, 'Mardi': 0.44, 'Mercredi': 0.73,
    'Jeudi': 1.10, 'Vendredi': 1.52, 'Samedi': 1.80,
    'Dimanche': 0.60,
  },
  mois: {
    1: 0.70, 2: 0.80, 3: 0.88, 4: 1.00, 5: 0.98, 6: 1.10,
    7: 1.22, 8: 1.38, 9: 0.88, 10: 0.96, 11: 0.82, 12: 1.00,
  },
  meteo: {
    'Soleil': 1.18, 'Nuageux': 1.00, 'Pluie légère': 0.82,
    'Forte pluie': 0.60, 'Froid': 0.85, 'Canicule': 0.88,
  },
  type: {
    'Étudiante': 1.38, 'Latino': 1.28, 'Techno': 1.22,
    'Années 80/90': 1.18, 'House': 1.12, 'Afterwork': 1.10,
    'Match & DJ set': 1.08, 'Open format': 1.05,
    'Blind test': 0.95, 'Généraliste': 0.88,
    'Live acoustique': 0.90, 'Karaoké': 0.82,
    'Fête de la musique': 1.60, 'Spéciale Halloween': 1.80, 'Nouvel an': 1.55,
  },
  dj: {
    'DJ Martin': 1.28, 'DJ Sarah': 1.22, 'DJ Clara': 1.15,
    'DJ Emma': 1.08, 'DJ Alex': 0.97, 'DJ Lucas': 0.90,
    'DJ Noé': 0.95, 'Sans DJ': 0.80,
  },
  concurrence: { 'Faible': 1.00, 'Moyenne': 0.90, 'Forte': 0.76 },
} as const

export interface PredictionParams {
  jour: string
  mois: number
  type_evenement: string
  dj_nom: string
  meteo: string
  concurrence: string
  capacite?: number
  base_freq?: number
  base_ca?: number
}

export interface PredictionResult {
  freq_estimee: number
  taux_remplissage: number
  ca_estime: number
  marge_estimee: number
  coefs: Record<string, number>
  total_coef: number
  confiance: 'haute' | 'moyenne' | 'faible'
  conseil: string
}

export function calculerPrediction(
  params: PredictionParams,
  coefs: typeof COEFS_PILOTE = COEFS_PILOTE
): PredictionResult {
  const capacite = params.capacite ?? 350
  const base_freq = params.base_freq ?? 160
  const base_ca = params.base_ca ?? 5000

  const c = {
    jour: (coefs.jour as Record<string, number>)[params.jour] ?? 1,
    mois: (coefs.mois as Record<number, number>)[params.mois] ?? 1,
    type: (coefs.type as Record<string, number>)[params.type_evenement] ?? 1,
    dj: (coefs.dj as Record<string, number>)[params.dj_nom] ?? 1,
    meteo: (coefs.meteo as Record<string, number>)[params.meteo] ?? 1,
    conc: (coefs.concurrence as Record<string, number>)[params.concurrence] ?? 1,
  }

  const total_coef = c.jour * c.mois * c.type * c.dj * c.meteo * c.conc
  const freq_estimee = Math.min(Math.round(base_freq * total_coef), capacite)
  const taux_remplissage = Math.round((freq_estimee / capacite) * 100)
  const ca_estime = Math.round(base_ca * total_coef)
  const charges_est = Math.round(300 + ca_estime * 0.08)
  const marge_estimee = ca_estime - charges_est

  const spread = Math.abs(total_coef - 1.0)
  const confiance: PredictionResult['confiance'] =
    spread < 0.4 ? 'haute' : spread < 0.8 ? 'moyenne' : 'faible'

  const conseil =
    taux_remplissage > 85
      ? '✨ Configuration haute performance — à prioriser'
      : taux_remplissage > 60
      ? '👍 Bonne configuration — potentiel solide'
      : taux_remplissage > 35
      ? '⚡ Configuration moyenne — optimisations possibles'
      : '⚠️ Configuration faible — envisage de changer le jour ou le type'

  return {
    freq_estimee,
    taux_remplissage,
    ca_estime,
    marge_estimee,
    coefs: c,
    total_coef,
    confiance,
    conseil,
  }
}
