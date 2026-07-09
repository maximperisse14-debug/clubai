import type { NormalisedEntry } from './normalisation'

export const DJ_DATA: NormalisedEntry[] = [
  { label: 'DJ Martin', freq_brute: 294.5, impact_pct_freq: 28.4, impact_pct_ca: 31.2, impact_pct_panier: 14.8, ca_brut: 9800,  panier_brut: 38.4, nb_soirees: 36, sat: 4.46, brut_rank: 2, jours: { L: 0, Ma: 0, Me: 4, J: 4, V: 17, S: 11 } },
  { label: 'DJ Sarah',  freq_brute: 216.0, impact_pct_freq: 22.2, impact_pct_ca: 24.6, impact_pct_panier: 11.2, ca_brut: 7200,  panier_brut: 34.1, nb_soirees: 48, sat: 4.21, brut_rank: 4, jours: { L: 4, Ma: 7, Me: 5, J: 14, V: 9, S: 9 } },
  { label: 'DJ Clara',  freq_brute: 309.6, impact_pct_freq: 15.5, impact_pct_ca: 17.3, impact_pct_panier: 8.4,  ca_brut: 10200, panier_brut: 36.8, nb_soirees: 33, sat: 4.23, brut_rank: 1, jours: { L: 0, Ma: 0, Me: 3, J: 2, V: 4, S: 24 } },
  { label: 'DJ Emma',   freq_brute: 229.9, impact_pct_freq: 8.2,  impact_pct_ca: 9.4,  impact_pct_panier: 6.1,  ca_brut: 7800,  panier_brut: 32.2, nb_soirees: 40, sat: 4.06, brut_rank: 3, jours: { L: 3, Ma: 0, Me: 6, J: 9, V: 17, S: 5 } },
  { label: 'DJ Alex',   freq_brute: 138.0, impact_pct_freq: -2.5, impact_pct_ca: -1.8, impact_pct_panier: -2.4, ca_brut: 4600,  panier_brut: 28.6, nb_soirees: 36, sat: 3.78, brut_rank: 5, jours: { L: 9, Ma: 4, Me: 9, J: 9, V: 4, S: 3 } },
  { label: 'DJ Lucas',  freq_brute: 102.5, impact_pct_freq: -10.3, impact_pct_ca: -9.6, impact_pct_panier: -7.8, ca_brut: 3200, panier_brut: 24.3, nb_soirees: 48, sat: 3.70, brut_rank: 6, jours: { L: 10, Ma: 11, Me: 11, J: 10, V: 4, S: 2 } },
  { label: 'DJ Noé',    freq_brute: 55.7,  impact_pct_freq: -5.0, impact_pct_ca: -4.2, impact_pct_panier: -3.1, ca_brut: 1800,  panier_brut: 22.8, nb_soirees: 46, sat: 3.70, brut_rank: 7, jours: { L: 16, Ma: 21, Me: 7, J: 2, V: 0, S: 0 } },
  { label: 'Sans DJ',   freq_brute: 45.3,  impact_pct_freq: -19.9, impact_pct_ca: -18.4, impact_pct_panier: -12.6, ca_brut: 1100, panier_brut: 19.6, nb_soirees: 28, sat: 3.40, brut_rank: 8, jours: { L: 3, Ma: 22, Me: 2, J: 1, V: 0, S: 0 } },
]

export const TYPE_DATA: NormalisedEntry[] = [
  { label: 'Étudiante',      freq_brute: 191.9, impact_pct_freq: 38.3, impact_pct_ca: 42.1, impact_pct_panier: 8.2,   ca_brut: 5800,  panier_brut: 24.1, nb_soirees: 32, brut_rank: 7,  ctx: 'Mer/Jeu · météo neutre',    note: 'Meilleur effet propre du catalogue' },
  { label: 'Latino',         freq_brute: 298.9, impact_pct_freq: 28.3, impact_pct_ca: 30.5, impact_pct_panier: 22.4,  ca_brut: 10800, panier_brut: 35.2, nb_soirees: 32, brut_rank: 1,  ctx: 'Ven/Sam · été',              note: 'Bon réel, gonflé par le positionnement' },
  { label: 'Techno',         freq_brute: 219.2, impact_pct_freq: 22.1, impact_pct_ca: 25.8, impact_pct_panier: 28.1,  ca_brut: 9200,  panier_brut: 38.6, nb_soirees: 13, brut_rank: 5,  ctx: 'Sam · printemps/été',        note: 'Peu de données (13 soirées)' },
  { label: 'Années 80/90',   freq_brute: 291.8, impact_pct_freq: 18.3, impact_pct_ca: 20.2, impact_pct_panier: 14.3,  ca_brut: 10400, panier_brut: 36.1, nb_soirees: 26, brut_rank: 2,  ctx: 'Ven/Sam · soleil' },
  { label: 'House',          freq_brute: 278.9, impact_pct_freq: 11.8, impact_pct_ca: 13.4, impact_pct_panier: 10.2,  ca_brut: 9600,  panier_brut: 33.8, nb_soirees: 31, brut_rank: 3,  ctx: 'Ven/Sam · mixte' },
  { label: 'Afterwork',      freq_brute: 173.5, impact_pct_freq: 10.5, impact_pct_ca: 18.7, impact_pct_panier: 19.6,  ca_brut: 4200,  panier_brut: 28.4, nb_soirees: 28, brut_rank: 8,  ctx: 'Lun–Jeu · toutes saisons',   note: 'Sous-estimé en brut' },
  { label: 'Match & DJ',     freq_brute: 205.3, impact_pct_freq: 8.3,  impact_pct_ca: 9.6,  impact_pct_panier: 5.8,   ca_brut: 7100,  panier_brut: 30.2, nb_soirees: 19, brut_rank: 6,  ctx: 'Jeudi · mixte' },
  { label: 'Open format',    freq_brute: 238.1, impact_pct_freq: 4.1,  impact_pct_ca: 5.1,  impact_pct_panier: 3.2,   ca_brut: 8400,  panier_brut: 32.5, nb_soirees: 15, brut_rank: 4,  ctx: 'Ven/Sam · soleil' },
  { label: 'Blind test',     freq_brute: 62.0,  impact_pct_freq: -4.5, impact_pct_ca: -3.8, impact_pct_panier: 12.4,  ca_brut: 1500,  panier_brut: 22.8, nb_soirees: 34, brut_rank: 9,  ctx: 'Lun/Mar · pluie/froid',      note: 'Panier correct — pb de fréquentation' },
  { label: 'Live acoustique', freq_brute: 50.1, impact_pct_freq: -10.0, impact_pct_ca: -9.2, impact_pct_panier: 6.1,  ca_brut: 1300, panier_brut: 26.1, nb_soirees: 22, brut_rank: 11, ctx: 'Mar/Mer · automne' },
  { label: 'Généraliste',    freq_brute: 73.0,  impact_pct_freq: -11.4, impact_pct_ca: -12.8, impact_pct_panier: -8.4, ca_brut: 1700, panier_brut: 20.4, nb_soirees: 25, brut_rank: 10, ctx: 'Lun/Mar · toutes saisons' },
  { label: 'Karaoké',        freq_brute: 55.5,  impact_pct_freq: -18.3, impact_pct_ca: -21.3, impact_pct_panier: -16.7, ca_brut: 1200, panier_brut: 18.2, nb_soirees: 40, brut_rank: 12, ctx: 'Lun/Mar · pluie/froid',    note: 'Réellement pénalisant' },
]

export const AN_INSIGHTS = {
  freq_dj: `<strong>Biais majeur révélé :</strong> DJ Clara domine en brut (310 pers.) uniquement parce qu'elle joue <strong>24 samedis sur 33 soirées</strong>. En normalisé son effet propre est +15.5% — derrière DJ Martin (+28.4%) et DJ Sarah (+22.2%). DJ Noé semble catastrophique (56 pers.) mais joue <strong>37 lundis/mardis et 0 samedi</strong> : son effet réel est seulement −5%.`,
  freq_type: `<strong>Révélation :</strong> l'Étudiante est au rang 7 en brut (192 pers.) mais génère le <strong>meilleur effet intrinsèque du catalogue (+38%)</strong> — programmée quasi-exclusivement en mer/jeu. Le Karaoké est <strong>réellement mauvais</strong> (−18%) : pas juste mal positionné.`,
  ca_type: `<strong>Révélation CA :</strong> l'Étudiante génère 5 800 € bruts (rang 9) mais son effet normalisé CA est le plus fort (+42%). L'Afterwork surprend en 3ème place (+19%) malgré ses soirées de semaine.`,
  ca_dj: `<strong>Révélation CA DJ :</strong> DJ Clara génère 10 200 € bruts (rang 1) mais son effet normalisé est +17% — derrière DJ Martin (+31%) et DJ Sarah (+25%).`,
  pan_type: `<strong>Révélation panier :</strong> la Techno a le meilleur panier normalisé (+28%). L'Afterwork est 2ème (+20%) : le format apéritif pousse la consommation bar. Le Blind test révèle un panier correct (+12%) : son problème c'est la fréquentation.`,
  pan_dj: `<strong>Révélation panier DJ :</strong> DJ Martin génère le meilleur panier normalisé (+15%) quelle que soit la configuration.`,
}
