// Coefficients d'activité mensuelle par région et par ville
// Index: [jan, fév, mar, avr, mai, jun, jul, aoû, sep, oct, nov, déc]

export const COEFF_MENSUEL_REGION: Record<string, number[]> = {
  'Auvergne-Rhône-Alpes':    [0.95,0.95,1.00,1.05,1.08,1.12,1.20,1.18,1.02,1.00,0.98,1.05],
  'Bourgogne-Franche-Comté': [0.96,0.96,0.99,1.01,1.03,1.05,1.08,1.07,1.00,0.99,0.97,1.00],
  'Bretagne':                [0.92,0.92,0.98,1.05,1.12,1.25,1.45,1.50,1.12,1.02,0.96,1.02],
  'Centre-Val de Loire':     [0.98,0.98,1.00,1.03,1.05,1.10,1.12,1.10,1.02,1.00,0.99,1.00],
  'Corse':                   [0.70,0.72,0.82,1.00,1.20,1.55,2.10,2.30,1.35,1.00,0.82,0.72],
  'Grand Est':               [0.98,0.98,1.00,1.02,1.03,1.05,1.02,1.00,1.00,1.02,1.05,1.10],
  'Hauts-de-France':         [0.99,0.99,1.00,1.01,1.03,1.05,0.98,0.97,1.00,1.00,1.00,1.03],
  'Île-de-France':           [1.06,1.05,1.02,1.00,0.98,0.93,0.82,0.78,0.96,1.00,1.03,1.08],
  'Normandie':               [0.95,0.95,0.99,1.04,1.10,1.18,1.32,1.36,1.08,1.01,0.97,1.00],
  'Nouvelle-Aquitaine':      [0.93,0.94,0.98,1.05,1.12,1.25,1.45,1.50,1.15,1.04,0.98,0.96],
  'Occitanie':               [0.92,0.93,0.98,1.06,1.15,1.28,1.48,1.55,1.18,1.06,0.98,0.94],
  'PACA':                    [0.90,0.92,0.98,1.08,1.18,1.35,1.62,1.72,1.22,1.08,0.98,0.94],
  'Pays de la Loire':        [0.95,0.95,0.99,1.04,1.10,1.18,1.30,1.34,1.08,1.01,0.97,1.00],
}

export const COEFF_MENSUEL_VILLE: Record<string, number[]> = {
  'Paris': [1.08,1.07,1.03,1.00,0.97,0.90,0.76,0.72,0.95,1.01,1.05,1.10],
  'Lyon':  [1.00,1.00,1.02,1.04,1.05,1.00,0.90,0.88,1.02,1.03,1.01,1.04],
}

export function getCoeffMensuel(region: string, ville: string | undefined, mois: number): number {
  if (ville && COEFF_MENSUEL_VILLE[ville]) {
    return COEFF_MENSUEL_VILLE[ville][mois - 1]
  }
  return COEFF_MENSUEL_REGION[region]?.[mois - 1] ?? 1.0
}

const BAREME: Array<{ coeff: number; bonus: number }> = [
  { coeff: 0.7, bonus: -15 },
  { coeff: 0.8, bonus: -10 },
  { coeff: 0.9, bonus: -5  },
  { coeff: 1.0, bonus: 0   },
  { coeff: 1.1, bonus: 5   },
  { coeff: 1.2, bonus: 10  },
  { coeff: 1.3, bonus: 15  },
  { coeff: 1.5, bonus: 25  },
]

export function convertirCoeffMensuelEnBonus(coeff: number): number {
  if (coeff <= BAREME[0].coeff) return BAREME[0].bonus
  if (coeff >= BAREME[BAREME.length - 1].coeff) return BAREME[BAREME.length - 1].bonus
  for (let i = 0; i < BAREME.length - 1; i++) {
    const lo = BAREME[i], hi = BAREME[i + 1]
    if (coeff >= lo.coeff && coeff <= hi.coeff) {
      const t = (coeff - lo.coeff) / (hi.coeff - lo.coeff)
      return Math.round(lo.bonus + t * (hi.bonus - lo.bonus))
    }
  }
  return 0
}
