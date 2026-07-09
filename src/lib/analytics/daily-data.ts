export interface JourData {
  date: string
  label: string
  type: 'passe_avec_soiree' | 'passe_sans_soiree' | 'futur'
  wd?: number
  freq_reelle?: number
  ca_reel?: number
  hw_fitted?: number
  nom_evenement?: string
  type_evenement?: string
  dj_nom?: string
  pred_freq_passe?: number
  pred_ca_passe?: number
  precision_freq?: number
  precision_ca?: number
  prev_freq?: number
  prev_ca?: number
  prev_freq_low?: number
  prev_freq_high?: number
  prev_ca_low?: number
  prev_ca_high?: number
  meteo_fiable?: boolean
  concurrence_dispo?: boolean
}
