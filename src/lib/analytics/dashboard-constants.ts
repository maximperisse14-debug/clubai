export const DASHBOARD_METRICS = {
  freq_moy:    { value: 170,   label: '170 pers.',   sub: 'sur 313 soirées · capacité 350', trend: 19.4  },
  ca_moy:      { value: 5152,  label: '5 152 €',     sub: 'médiane : 3 837 €',              trend: 17.4  },
  panier_moy:  { value: 33.06, label: '33,06 €',     sub: 'par personne',                   trend: 5.2   },
  satisfaction:{ value: 4.19,  label: '4,19 / 5',    sub: '313 notes',                      trend: 1.9   },
  precision:   { value: 95.0,  label: '95,0%',       sub: 'moy. fréq. + CA · 313 soirées', trend: null  },
}

export const CA_MENSUEL = [
  { mois: 'Jan', ca: 96_200  },
  { mois: 'Fév', ca: 112_400 },
  { mois: 'Mar', ca: 118_000 },
  { mois: 'Avr', ca: 124_600 },
  { mois: 'Mai', ca: 128_200 },
  { mois: 'Jun', ca: 141_400 },
  { mois: 'Jul', ca: 168_800 },
  { mois: 'Aoû', ca: 172_100 },
  { mois: 'Sep', ca: 122_400 },
  { mois: 'Oct', ca: 134_800 },
  { mois: 'Nov', ca: 130_600 },
  { mois: 'Déc', ca: 153_200 },
]

export const FREQ_PAR_JOUR = [
  { jour: 'Lundi',    freq: 65,   color: '#ff6b6b' },
  { jour: 'Mardi',    freq: 74,   color: '#ff9f9f' },
  { jour: 'Mercredi', freq: 128,  color: '#f5a623' },
  { jour: 'Jeudi',    freq: 184,  color: '#5ddab0' },
  { jour: 'Vendredi', freq: 253,  color: '#7c5cfc' },
  { jour: 'Samedi',   freq: 297,  color: '#a07cff' },
]

export const CA_PAR_JOUR = [
  { jour: 'Lundi',    ca: 1208,   color: '#ff6b6b' },
  { jour: 'Mardi',    ca: 1516,   color: '#ff9f9f' },
  { jour: 'Mercredi', ca: 3051,   color: '#f5a623' },
  { jour: 'Jeudi',    ca: 4622,   color: '#5ddab0' },
  { jour: 'Vendredi', ca: 8934,   color: '#7c5cfc' },
  { jour: 'Samedi',   ca: 11632,  color: '#a07cff' },
]

export const PRECISION_MENSUELLE = [
  { mois: 'Jan', precision: 65.0 },
  { mois: 'Fév', precision: 72.0 },
  { mois: 'Mar', precision: 77.0 },
  { mois: 'Avr', precision: 79.7 },
  { mois: 'Mai', precision: 84.3 },
  { mois: 'Jun', precision: 86.9 },
  { mois: 'Jul', precision: 89.3 },
  { mois: 'Aoû', precision: 90.5 },
  { mois: 'Sep', precision: 92.3 },
  { mois: 'Oct', precision: 93.1 },
  { mois: 'Nov', precision: 93.3 },
  { mois: 'Déc', precision: 95.0 },
]

export const MOIS_PRECEDENT = 'nov.'
