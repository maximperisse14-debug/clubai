export interface SoireePredite {
  date: Date
  typeEvenement: string
  nomEvenement: string
  djId: string | null
  djNom: string | null
  freq: number
  ca: number
  scoreGlobal: number
  scoreTheme: number
  hwFreqBase: number
  hwCABase: number
  freqLow: number
  freqHigh: number
  caLow: number
  caHigh: number
  coeff: number
}
