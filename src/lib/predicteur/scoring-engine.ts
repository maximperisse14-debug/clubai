import { getHWForecastForDate } from '@/lib/analytics/hw-daily-data'
import { calculerScoreTheme, type CoeffRow } from './score-theme'

const SCORE_NEUTRE_THEME = 70

export interface ClubSettings {
  club_id: string
  capacite: number
}

export interface ScoringInputs {
  clubId: string
  date: Date
  typeEvenement: string
  djId?: string | null
  djNom?: string | null
  nomEvenement?: string
  prevStandard?: number
  prevStandardCA?: number
}

export interface PredictionScoreResult {
  scoreTheme: number
  scoreGlobal: number
  frequentationEstimee: number
  caEstime: number
  freqLow: number
  freqHigh: number
  caLow: number
  caHigh: number
  hwBase: { freq: number; ca: number }
  coeff: number
}

export async function calculerPredictionComplete(
  inputs: ScoringInputs,
  settings: ClubSettings,
  coefficients: CoeffRow[],
): Promise<PredictionScoreResult> {
  const hw = getHWForecastForDate(inputs.date)
  if (hw.freq === 0) throw new Error('Jour non ouvert selon le modèle HW')

  const sTheme = calculerScoreTheme({
    typeEvenement: inputs.typeEvenement,
    djId: inputs.djId ?? null,
    djNom: inputs.djNom,
    coefficients,
  })

  const coeff = sTheme / SCORE_NEUTRE_THEME

  const baseFreq = inputs.prevStandard  ?? hw.freq
  const baseCA   = inputs.prevStandardCA ?? hw.ca

  const freq = Math.min(Math.max(0, Math.round(baseFreq * coeff)), settings.capacite)
  const ca   = Math.max(0, Math.round(baseCA * coeff))

  const icExtra = Math.abs(coeff - 1) * 0.04
  const freqLow  = Math.round(hw.freqLow  * coeff * (1 - icExtra))
  const freqHigh = Math.min(Math.round(hw.freqHigh * coeff * (1 + icExtra)), settings.capacite)
  const caLow    = Math.round(hw.caLow    * coeff * (1 - icExtra))
  const caHigh   = Math.round(hw.caHigh   * coeff * (1 + icExtra))

  return {
    scoreTheme: +sTheme.toFixed(1),
    scoreGlobal: +sTheme.toFixed(1),
    frequentationEstimee: freq,
    caEstime: ca,
    freqLow,
    freqHigh,
    caLow,
    caHigh,
    hwBase: { freq: baseFreq, ca: baseCA },
    coeff: +coeff.toFixed(3),
  }
}
