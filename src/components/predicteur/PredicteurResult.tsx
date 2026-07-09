import { Badge } from '@/components/ui/badge'
import { type PredictionResult } from '@/lib/analytics/predicteur'

const CONFIANCE_COLORS = {
  haute: 'text-emerald-500',
  moyenne: 'text-amber-500',
  faible: 'text-red-400',
}

export default function PredicteurResult({ result }: { result: PredictionResult }) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border border-border bg-muted/30 text-sm">{result.conseil}</div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Fréquentation estimée', value: `${result.freq_estimee} pers.` },
          { label: 'Taux de remplissage', value: `${result.taux_remplissage}%` },
          { label: 'CA estimé', value: `${(result.ca_estime / 1000).toFixed(1)}k €` },
          { label: 'Marge estimée', value: `${(result.marge_estimee / 1000).toFixed(1)}k €` },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 rounded-lg border border-border bg-card">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xl font-bold mt-1">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Confiance :</span>
        <span className={`font-medium ${CONFIANCE_COLORS[result.confiance]}`}>{result.confiance}</span>
        <span className="text-muted-foreground ml-2">Coef. total :</span>
        <span className="font-mono font-medium">{result.total_coef.toFixed(3)}</span>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Décomposition des coefficients</p>
        {Object.entries(result.coefs).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span className="w-16 text-muted-foreground capitalize">{key}</span>
            <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.min((val / 2) * 100, 100)}%`,
                  background: val >= 1 ? 'rgb(48,201,142,0.7)' : 'rgb(255,107,107,0.7)',
                }}
              />
            </div>
            <span className="w-12 text-right font-mono text-xs">{val.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
