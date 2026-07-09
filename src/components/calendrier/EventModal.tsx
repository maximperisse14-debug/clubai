'use client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface CalendrierEvent {
  date: string
  type: string
  dj?: string | null
  nomEvenement?: string | null
  // Données réelles
  freq?: number | null
  ca?: number | null
  tauxRemplissage?: number | null
  panierMoyen?: number | null
  // Prédictions stockées
  predictionFreq?: number | null
  predictionCa?: number | null
  predictionScore?: number | null
}

interface Props {
  event: CalendrierEvent | null
  open: boolean
  onClose: () => void
}

function scoreColor(score: number) {
  if (score >= 70) return '#30c98e'
  if (score >= 45) return '#f5a623'
  return '#ff6b6b'
}

function BarCompare({ label, reel, pred, max, fmtReel, fmtPred }: {
  label: string
  reel: number | null | undefined
  pred: number | null | undefined
  max: number
  fmtReel: (v: number) => string
  fmtPred: (v: number) => string
}) {
  const pctReel = reel != null && max > 0 ? (reel / max) * 100 : 0
  const pctPred = pred != null && max > 0 ? (pred / max) * 100 : 0
  const hasReel = reel != null
  const hasPred = pred != null

  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</div>
      {hasPred && (
        <div className="flex items-center gap-2">
          <span className="w-14 text-[10px] text-muted-foreground shrink-0">Prédiction</span>
          <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{ width: `${Math.max(pctPred, 6)}%`, background: '#7c5cfc80' }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-20 text-right">{fmtPred(pred!)}</span>
        </div>
      )}
      {hasReel && (
        <div className="flex items-center gap-2">
          <span className="w-14 text-[10px] text-muted-foreground shrink-0">Réel</span>
          <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{ width: `${Math.max(pctReel, 6)}%`, background: '#30c98ecc' }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-20 text-right">{fmtReel(reel!)}</span>
        </div>
      )}
      {!hasPred && !hasReel && (
        <div className="text-[10px] text-muted-foreground italic">Non disponible</div>
      )}
    </div>
  )
}

export default function EventModal({ event, open, onClose }: Props) {
  if (!event) return null

  const date = new Date(event.date + 'T12:00:00')
  const hasReel = event.freq != null || event.ca != null
  const hasPred = event.predictionFreq != null || event.predictionCa != null
  const maxFreq = Math.max(event.freq ?? 0, event.predictionFreq ?? 0, 1)
  const maxCa   = Math.max(event.ca ?? 0, event.predictionCa ?? 0, 1)

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base capitalize">
            {format(date, "EEEE d MMMM yyyy", { locale: fr })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Infos soirée */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Type</span>
              <span className="text-xs font-medium">{event.type}</span>
            </div>
            {event.nomEvenement && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 shrink-0">Nom</span>
                <span className="text-xs font-medium">{event.nomEvenement}</span>
              </div>
            )}
            {event.dj && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 shrink-0">DJ</span>
                <span className="text-xs font-medium">{event.dj}</span>
              </div>
            )}
            {event.predictionScore != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 shrink-0">Score préd.</span>
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: scoreColor(event.predictionScore) }}
                >
                  {event.predictionScore.toFixed(1)}/100
                </span>
              </div>
            )}
          </div>

          {/* Comparaison */}
          {(hasReel || hasPred) && (
            <div className="space-y-3 border-t border-border pt-3">
              <BarCompare
                label="Fréquentation"
                reel={event.freq}
                pred={event.predictionFreq}
                max={maxFreq}
                fmtReel={v => `${v} pers.`}
                fmtPred={v => `${v} pers.`}
              />
              <BarCompare
                label="CA"
                reel={event.ca}
                pred={event.predictionCa}
                max={maxCa}
                fmtReel={v => `${v.toLocaleString('fr-FR')} €`}
                fmtPred={v => `${v.toLocaleString('fr-FR')} €`}
              />
            </div>
          )}

          {/* Pas encore de données */}
          {!hasReel && !hasPred && (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              Aucune donnée ni prédiction disponible pour cette soirée.
            </p>
          )}

          {/* Légende */}
          {hasPred && (
            <div className="flex gap-4 justify-center pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded" style={{ background: '#7c5cfc80' }} />
                <span className="text-[10px] text-muted-foreground">Prédiction</span>
              </div>
              {hasReel && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded" style={{ background: '#30c98ecc' }} />
                  <span className="text-[10px] text-muted-foreground">Réel</span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
