import type { PredictionScoreResult } from '@/lib/predicteur/scoring-engine'

function scoreColor(v: number): string {
  if (v >= 75) return '#30c98e'
  if (v >= 65) return '#f5a623'
  return '#ff6b6b'
}

interface Props {
  result: PredictionScoreResult
}

export default function SubScoreGauges({ result }: Props) {
  const score = result.scoreTheme

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground mb-1">
        La base HW intègre calendrier, météo moyenne et concurrence habituelle.
        Seul le thème module cette base.
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Score thème (DJ + type d'événement)</span>
          <span className="font-semibold tabular-nums" style={{ color: scoreColor(score) }}>
            {score.toFixed(1)}
          </span>
        </div>
        <div className="h-2 bg-muted rounded overflow-hidden">
          <div
            className="h-full rounded transition-all duration-500"
            style={{ width: `${score}%`, background: scoreColor(score) }}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <span>Prévision std {result.hwBase.freq} pers.</span>
            <span className="mx-1">×</span>
            <span style={{ color: result.coeff >= 1 ? '#30c98e' : '#ff6b6b' }}>
              {result.coeff >= 1 ? '+' : ''}{((result.coeff - 1) * 100).toFixed(1)}%
            </span>
          </div>
          <span className="text-lg font-bold tabular-nums" style={{ color: scoreColor(result.scoreGlobal) }}>
            {result.frequentationEstimee} pers.
          </span>
        </div>
      </div>
    </div>
  )
}
