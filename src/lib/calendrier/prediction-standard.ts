import {
  SEED_START,
  FREQ_HEBDO, CA_HEBDO,
  FORECAST_FREQ_COMBINED_24, FORECAST_CA_COMBINED_24,
} from '@/lib/analytics/combined-model-data'

export function calculerPredictionStandard(date: Date): { frequentationEstimee: number; caEstime: number } {
  const diffSemaines = Math.floor((date.getTime() - SEED_START.getTime()) / (7 * 24 * 3600 * 1000))
  if (diffSemaines >= 0 && diffSemaines < 52) {
    return {
      frequentationEstimee: FREQ_HEBDO[diffSemaines] ?? 130,
      caEstime: CA_HEBDO[diffSemaines] ?? 3800,
    }
  }
  if (diffSemaines >= 52 && diffSemaines < 76) {
    const idx = diffSemaines - 52
    return {
      frequentationEstimee: FORECAST_FREQ_COMBINED_24[idx] ?? 130,
      caEstime: FORECAST_CA_COMBINED_24[idx] ?? 3800,
    }
  }
  return { frequentationEstimee: 130, caEstime: 3800 }
}
