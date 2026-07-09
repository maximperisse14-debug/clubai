'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import PlanifierSoireeForm from './PlanifierSoireeForm'
import type { CalendrierEvent } from './EventModal'
import type { PredictionScoreResult } from '@/lib/predicteur/scoring-engine'

type CellType = 'hors_ouverture' | 'jour_ouverture' | 'soiree_planifiee' | 'soiree_realisee'

function calcPrecision(
  predFreq: number | null | undefined,
  realFreq: number | null | undefined,
  predCA: number | null | undefined,
  realCA: number | null | undefined,
): number | null {
  if (!predFreq || !predCA || !realFreq || !realCA) return null
  const errFreq = Math.abs(predFreq - realFreq) / realFreq * 100
  const errCA   = Math.abs(predCA - realCA)   / realCA   * 100
  return Math.max(0, Math.round(100 - (errFreq + errCA) / 2))
}

interface Props {
  open: boolean
  date: Date
  type: CellType
  event?: CalendrierEvent | null
  prediction?: PredictionScoreResult | null
  clubId: string
  djs: { id: string; nom: string }[]
  onClose: () => void
  onRefresh: () => void
}

export default function CelluleModal({
  open, date, type, event, prediction, clubId, djs, onClose, onRefresh,
}: Props) {
  const [showForm, setShowForm] = useState(false)

  const isPlanifiee = type === 'soiree_planifiee'
  const isRealisee  = type === 'soiree_realisee'
  const isOuverture = type === 'jour_ouverture'

  const precision = isRealisee
    ? calcPrecision(event?.predictionFreq, event?.freq, event?.predictionCa, event?.ca)
    : null
  const precisionColor = precision == null ? ''
    : precision >= 90 ? '#4fe882' : precision >= 75 ? '#f0954a' : '#f09595'

  function handleSuccess() {
    setShowForm(false)
    onClose()
    onRefresh()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setShowForm(false); onClose() } }}>
      <DialogContent
        className="max-w-sm"
        style={{ background: 'var(--s1)', border: '1px solid var(--b2)' }}
      >
        {showForm ? (
          <PlanifierSoireeForm
            date={date}
            clubId={clubId}
            djs={djs}
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="capitalize text-base" style={{ color: 'var(--t1)' }}>
                {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
              </DialogTitle>
              <DialogDescription style={{ color: 'var(--t3)' }}>
                {isOuverture && 'Prédiction standard — aucune soirée planifiée'}
                {isPlanifiee && (event?.nomEvenement ?? event?.type ?? 'Soirée planifiée')}
                {isRealisee  && (event?.nomEvenement ?? event?.type ?? 'Soirée réalisée')}
              </DialogDescription>
            </DialogHeader>

            {/* ── Ouverture prévue ── */}
            {isOuverture && prediction && (
              <>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="rounded-xl p-4 text-center"
                    style={{ background: 'rgba(79,163,232,0.08)', border: '1px solid rgba(79,163,232,0.2)' }}>
                    <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--t3)' }}>
                      Fréquentation estimée
                    </div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--c1)' }}>
                      {prediction.frequentationEstimee}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>personnes</div>
                  </div>
                  <div className="rounded-xl p-4 text-center"
                    style={{ background: 'rgba(123,92,229,0.08)', border: '1px solid rgba(123,92,229,0.2)' }}>
                    <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--t3)' }}>
                      CA estimé
                    </div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--c2)' }}>
                      {(prediction.caEstime / 1000).toFixed(1)}k
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>euros</div>
                  </div>
                </div>

                <div className="rounded-xl p-3 flex items-center justify-between"
                  style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
                  <span className="text-xs" style={{ color: 'var(--t3)' }}>Score global de la soirée</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--c4)' }}>
                    {prediction.scoreGlobal.toFixed(0)} / 100
                  </span>
                </div>

                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--grad)' }}
                >
                  + Planifier une soirée ce jour
                </button>

                <p className="text-[10px] text-center -mt-2" style={{ color: 'var(--t3)' }}>
                  La prédiction sera affinée une fois le type et le DJ renseignés.
                </p>
              </>
            )}

            {/* ── Soirée planifiée ── */}
            {isPlanifiee && (
              <>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="rounded-xl p-3" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Fréq. prédite</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--c1)' }}>
                      {event?.predictionFreq != null ? `${event.predictionFreq} pers.` : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>CA prédit</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--c2)' }}>
                      {event?.predictionCa != null ? `${Math.round(event.predictionCa).toLocaleString('fr-FR')} €` : '—'}
                    </div>
                  </div>
                </div>
                {event?.type && (
                  <div className="space-y-1 pt-2" style={{ borderTop: '1px solid var(--b1)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-14 shrink-0" style={{ color: 'var(--t3)' }}>Type</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--t2)' }}>{event.type}</span>
                    </div>
                    {event.dj && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-14 shrink-0" style={{ color: 'var(--t3)' }}>DJ</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--t2)' }}>{event.dj}</span>
                      </div>
                    )}
                    {event.predictionScore != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-14 shrink-0" style={{ color: 'var(--t3)' }}>Score</span>
                        <span className="text-xs font-semibold" style={{ color: event.predictionScore >= 70 ? '#4fe882' : event.predictionScore >= 45 ? '#f5a623' : '#ff6b6b' }}>
                          {event.predictionScore.toFixed(1)}/100
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Soirée réalisée ── */}
            {isRealisee && (
              <>
                {/* Comparaison prédiction vs réel */}
                {(event?.predictionFreq != null || event?.freq != null) && (
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="rounded-xl p-3"
                      style={{ background: 'rgba(79,232,130,0.06)', border: '1px solid rgba(79,232,130,0.2)' }}>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Fréq. réelle</div>
                      <div className="text-xl font-bold" style={{ color: '#4fe882' }}>
                        {event?.freq != null ? `${event.freq} pers.` : '—'}
                      </div>
                      {event?.predictionFreq != null && (
                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>
                          Prédit : {event.predictionFreq} pers.
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl p-3"
                      style={{ background: 'rgba(79,232,130,0.06)', border: '1px solid rgba(79,232,130,0.2)' }}>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>CA réel</div>
                      <div className="text-xl font-bold" style={{ color: '#4fe882' }}>
                        {event?.ca != null ? `${Math.round(event.ca).toLocaleString('fr-FR')} €` : '—'}
                      </div>
                      {event?.predictionCa != null && (
                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>
                          Prédit : {Math.round(event.predictionCa).toLocaleString('fr-FR')} €
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Précision prédictive */}
                {precision != null && (
                  <div className="rounded-xl p-3" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: 'var(--t2)' }}>Précision prédictive</span>
                      <span className="text-lg font-bold" style={{ color: precisionColor }}>{precision}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${precision}%`, background: precisionColor }} />
                    </div>
                    <div className="text-[10px] mt-1.5" style={{ color: 'var(--t3)' }}>
                      {precision >= 90 ? 'Très bonne prédiction' : precision >= 75 ? 'Prédiction correcte' : 'Prédiction à améliorer'}
                    </div>
                  </div>
                )}

                {/* Infos */}
                {event?.type && (
                  <div className="space-y-1 pt-1" style={{ borderTop: '1px solid var(--b1)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-14 shrink-0" style={{ color: 'var(--t3)' }}>Type</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--t2)' }}>{event.type}</span>
                    </div>
                    {event.dj && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-14 shrink-0" style={{ color: 'var(--t3)' }}>DJ</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--t2)' }}>{event.dj}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
