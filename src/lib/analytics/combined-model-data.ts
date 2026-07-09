// Données pré-calculées du modèle Holt-Winters × Scoring (seed 2025, 318 soirées, 52 semaines)

// Score global moyen par semaine (0-100) — calendrier×0.30 + météo×0.20 + thème×0.30 + conc×0.20
export const SCORES_HEBDO = [
  76.2, 70.2, 72.2, 66.9, 70.7, 69.5, 72.0, 67.8,
  75.5, 73.8, 71.0, 70.3, 70.3, 66.7, 67.5, 68.4,
  70.9, 72.8, 64.5, 74.0, 71.9, 72.3, 81.5, 73.6,
  81.8, 73.5, 76.8, 71.3, 83.3, 79.3, 73.2, 75.7,
  73.3, 71.3, 72.3, 72.2, 70.4, 69.9, 76.8, 71.4,
  68.4, 72.8, 74.9, 74.5, 72.1, 72.5, 72.9, 76.0,
  76.0, 76.0, 76.0, 76.0,
]

// Fréquentation moyenne par semaine (pers.)
export const FREQ_HEBDO = [
  106.8, 102.5, 119.5,  72.2, 107.6, 104.6,  87.2,  66.2,
  146.3, 129.7, 115.0, 117.6,  99.3, 102.6,  75.1,  82.3,
  114.8, 154.6,  98.2, 147.0, 150.0, 103.3, 234.7, 164.7,
  252.6, 204.3, 241.1, 232.8, 291.6, 289.7, 268.0, 264.9,
  238.4, 257.0, 201.8, 186.6, 145.0, 127.6, 150.0, 143.4,
  125.5, 134.7, 175.6, 129.6, 121.3, 105.0, 112.7, 110.3,
  110.3, 110.3, 110.3, 110.3,
]

// CA moyen par semaine (€)
export const CA_HEBDO = [
  3342, 3300, 3650, 2174, 3144, 3256, 2587, 2121,
  4282, 3815, 3504, 3333, 2947, 3058, 2296, 2385,
  3354, 4883, 3054, 4381, 4527, 3183, 7699, 5015,
  7607, 6056, 7047, 6910, 9096, 8920, 8018, 7677,
  7083, 7860, 5897, 5463, 3804, 3880, 4446, 4403,
  3660, 4007, 5352, 3597, 3429, 3386, 3358, 3262,
  3262, 3262, 3262, 3262,
]

// Prévisions HW scores — 24 semaines (S53→S76)
export const FORECAST_SCORES_24 = [
  77.2, 75.6, 76.5, 75.4, 77.5, 76.0, 76.8, 75.8,
  77.8, 76.3, 77.1, 76.1, 78.2, 76.6, 77.5, 76.4,
  78.5, 77.0, 77.8, 76.8, 78.8, 77.3, 78.1, 77.1,
]

// Prévisions modèle COMBINÉ fréquentation — 24 semaines
export const FORECAST_FREQ_COMBINED_24 = [
  128.3, 119.0, 125.5, 110.9, 129.9, 120.6, 127.1, 112.5,
  131.6, 122.2, 128.7, 114.1, 133.2, 123.8, 130.4, 115.7,
  134.9, 125.5, 132.0, 117.2, 136.6, 127.1, 133.7, 118.8,
]

// Prévisions modèle COMBINÉ CA — 24 semaines
export const FORECAST_CA_COMBINED_24 = [
  3760, 3656, 3851, 3199, 3815, 3710, 3906, 3250,
  3870, 3764, 3961, 3302, 3925, 3818, 4016, 3355,
  3981, 3873, 4072, 3407, 4037, 3928, 4128, 3460,
]

// Intervalles de confiance 90% (bootstrap 1000 itérations)
export const CI_FREQ_LOW_24 = [
   68.4,  59.1,  66.2,  51.0,  70.0,  61.3,  67.2,  52.6,
   71.7,  61.4,  68.8,  53.3,  73.3,  63.9,  70.5,  55.8,
   75.0,  65.6,  72.1,  57.3,  77.3,  67.2,  72.9,  58.9,
]

export const CI_FREQ_HIGH_24 = [
  187.6, 178.3, 184.8, 170.2, 189.2, 179.9, 186.4, 171.8,
  190.9, 181.5, 188.0, 173.4, 192.5, 183.1, 189.7, 175.0,
  194.2, 184.8, 191.3, 176.5, 195.9, 186.4, 193.0, 178.1,
]

// Score moyen historique = soirée "standard" du club
export const SCORE_NEUTRE = 72.9

export const MODEL_STATS = {
  mape_hw_freq_seul:       16.7,
  mape_combined:           17.2,
  mape_hw_scores:           3.6,
  correlation_score_freq:   0.60,
  n_soirees:               318,
  n_semaines:               52,
}

// Labels
export const LABELS_52       = Array.from({ length: 52 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`)
export const LABELS_24_FORE  = Array.from({ length: 24 }, (_, i) => `S${String(53 + i).padStart(2, '0')}`)
export const ALL_LABELS      = [...LABELS_52, ...LABELS_24_FORE]

// Date de début du seed (semaine 1 = 1er jan 2025)
export const SEED_START = new Date(2025, 0, 1)
