'use client'
import { useMemo } from 'react'
import { calculerPrediction, type PredictionParams } from '@/lib/analytics/predicteur'

export function usePrediction(params: PredictionParams | null) {
  return useMemo(() => {
    if (!params) return null
    return calculerPrediction(params)
  }, [params])
}
