export interface NormalisedEntry {
  label: string
  freq_brute: number
  impact_pct_freq: number
  impact_pct_ca: number
  impact_pct_panier: number
  ca_brut: number
  panier_brut: number
  nb_soirees: number
  brut_rank_freq?: number
  brut_rank?: number
  sat?: number
  jours?: Record<string, number>
  ctx?: string
  note?: string
}

export function computeNormRanks(
  entries: NormalisedEntry[],
  metric: 'freq' | 'ca' | 'panier'
): Record<string, number> {
  const key = `impact_pct_${metric}` as keyof NormalisedEntry
  return [...entries]
    .sort((a, b) => (b[key] as number) - (a[key] as number))
    .reduce((acc, e, i) => ({ ...acc, [e.label]: i + 1 }), {} as Record<string, number>)
}

export function getRankShift(
  label: string,
  normRanks: Record<string, number>,
  brutRanks: Record<string, number>,
  sortMode: 'norm' | 'brut'
): number {
  const nr = normRanks[label] ?? 0
  const br = brutRanks[label] ?? 0
  return sortMode === 'norm' ? br - nr : nr - br
}
