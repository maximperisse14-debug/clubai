'use client'
import { useState, useEffect } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameMonth, isToday,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { estVeilleFerie } from '@/lib/calendrier/jours-feries'
import type { CalendrierEvent } from './EventModal'
import type { PredictionScoreResult } from '@/lib/predicteur/scoring-engine'

const JOUR_NOMS: Record<number, string> = {
  0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi',
  4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
}

type CellType = 'hors_ouverture' | 'jour_ouverture' | 'soiree_planifiee' | 'soiree_realisee'

export interface CellClickInfo {
  date: Date
  type: CellType
  event?: CalendrierEvent | null
  prediction?: PredictionScoreResult | null
}

interface Props {
  events: CalendrierEvent[]
  joursOuverture?: string[]
  ouvertureVeillesFeries?: boolean
  onDayClick?: (info: CellClickInfo) => void
}

function classifyCell(
  date: Date,
  events: CalendrierEvent[],
  joursOuverture: string[],
  ouvertureVeillesFeries: boolean,
): CellType {
  const dateStr = format(date, 'yyyy-MM-dd')
  const jourNom = JOUR_NOMS[getDay(date)]
  if (events.find(e => e.date.slice(0, 10) === dateStr && e.freq != null)) return 'soiree_realisee'
  if (events.find(e => e.date.slice(0, 10) === dateStr && e.freq == null)) return 'soiree_planifiee'
  const isVeille = ouvertureVeillesFeries && estVeilleFerie(date)
  if (joursOuverture.includes(jourNom) || isVeille) return 'jour_ouverture'
  return 'hors_ouverture'
}

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

const CELL_STYLE: Record<CellType, React.CSSProperties> = {
  hors_ouverture: { background: 'var(--s2)', border: '1px solid var(--b1)', opacity: 0.35, cursor: 'default' },
  jour_ouverture: { background: 'rgba(79,163,232,0.04)', border: '1px dashed rgba(79,163,232,0.3)', cursor: 'pointer' },
  soiree_planifiee: { background: 'rgba(123,92,229,0.08)', border: '1px solid rgba(123,92,229,0.3)', cursor: 'pointer' },
  soiree_realisee:  { background: 'rgba(79,232,130,0.06)', border: '1px solid rgba(79,232,130,0.25)', cursor: 'pointer' },
}

interface CellProps {
  date: Date
  type: CellType
  event: CalendrierEvent | null
  prediction: PredictionScoreResult | null
  predLoading: boolean
  clickLoading: boolean
  onCellClick: (date: Date, type: CellType, event: CalendrierEvent | null) => void
}

function Cell({ date, type, event, prediction, predLoading, clickLoading, onCellClick }: CellProps) {
  const today = isToday(date)
  const style: React.CSSProperties = today
    ? { background: 'rgba(123,92,229,0.1)', border: '1px solid rgba(123,92,229,0.6)', cursor: type !== 'hors_ouverture' ? 'pointer' : 'default' }
    : { ...CELL_STYLE[type] }

  const precision = type === 'soiree_realisee'
    ? calcPrecision(event?.predictionFreq, event?.freq, event?.predictionCa, event?.ca)
    : null
  const precisionColor = precision == null ? '' : precision >= 90 ? '#4fe882' : precision >= 75 ? '#f0954a' : '#f09595'

  return (
    <div
      className="min-h-[88px] p-1.5 rounded-xl text-xs transition-all select-none"
      style={style}
      onClick={() => type !== 'hors_ouverture' && onCellClick(date, type, event)}
    >
      {/* Numéro du jour */}
      <div
        className="font-semibold mb-1 text-right text-[11px]"
        style={{ color: today ? 'var(--c2)' : type === 'hors_ouverture' ? 'var(--t3)' : 'var(--t2)' }}
      >
        {format(date, 'd')}
      </div>

      {/* Ouverture prévue */}
      {type === 'jour_ouverture' && (
        <>
          <div className="text-[8px] font-bold uppercase tracking-widest mb-1.5"
            style={{ color: 'rgba(79,163,232,0.6)' }}>
            Ouverture prévue
          </div>
          {predLoading ? (
            <div className="space-y-1">
              <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.06)', width: '80%' }} />
              <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.06)', width: '60%' }} />
            </div>
          ) : prediction ? (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px]" style={{ color: 'var(--t3)' }}>Fréq.</span>
                <span className="text-[10px] font-bold" style={{ color: 'var(--c1)' }}>
                  {prediction.frequentationEstimee} pers.
                </span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px]" style={{ color: 'var(--t3)' }}>CA</span>
                <span className="text-[10px] font-bold" style={{ color: 'var(--c2)' }}>
                  {(prediction.caEstime / 1000).toFixed(1)}k €
                </span>
              </div>
            </div>
          ) : clickLoading ? (
            <div className="text-[9px] animate-pulse" style={{ color: 'var(--t3)' }}>Calcul…</div>
          ) : null}
        </>
      )}

      {/* Soirée planifiée */}
      {type === 'soiree_planifiee' && event && (
        <>
          <div className="text-[10px] font-semibold truncate mb-0.5" style={{ color: 'var(--c2)' }}>
            {event.nomEvenement ?? event.type}
          </div>
          {event.predictionFreq != null && (
            <div className="text-[9px]" style={{ color: 'var(--t3)' }}>
              {event.predictionFreq} pers. · {((event.predictionCa ?? 0) / 1000).toFixed(1)}k€
            </div>
          )}
        </>
      )}

      {/* Soirée réalisée */}
      {type === 'soiree_realisee' && event && (
        <>
          <div className="text-[10px] font-semibold truncate mb-0.5" style={{ color: '#4fe882' }}>
            {event.nomEvenement ?? event.type}
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px]" style={{ color: 'var(--t3)' }}>Réel</span>
            <span className="text-[9px] font-bold" style={{ color: '#4fe882' }}>
              {event.freq} pers.
            </span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px]" style={{ color: 'var(--t3)' }}>CA</span>
            <span className="text-[9px] font-bold" style={{ color: '#4fe882' }}>
              {((event.ca ?? 0) / 1000).toFixed(1)}k€
            </span>
          </div>
          {/* Précision prédictive */}
          {precision != null && (
            <div className="mt-1 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--t3)' }}>Précision</span>
                <span className="text-[10px] font-bold" style={{ color: precisionColor }}>{precision}%</span>
              </div>
              <div className="h-1 rounded-full mt-0.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${precision}%`, background: precisionColor }} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function CalendrierGrid({
  events,
  joursOuverture = [],
  ouvertureVeillesFeries = false,
  onDayClick,
}: Props) {
  const [current, setCurrent] = useState(new Date())
  const [predictionsCache, setPredictionsCache] = useState<Record<string, PredictionScoreResult>>({})
  const [fetchingDates, setFetchingDates] = useState<Set<string>>(new Set())
  const [clickLoadingDate, setClickLoadingDate] = useState<string | null>(null)

  const start    = startOfMonth(current)
  const end      = endOfMonth(current)
  const days     = eachDayOfInterval({ start, end })
  const startDay = (getDay(start) + 6) % 7

  const eventsByDate = events.reduce((acc, e) => {
    const key = e.date.slice(0, 10)
    return { ...acc, [key]: e }
  }, {} as Record<string, CalendrierEvent>)

  // Pré-charger les prédictions pour tous les jours d'ouverture du mois
  useEffect(() => {
    setPredictionsCache({})
    setFetchingDates(new Set())

    const monthStart = startOfMonth(current)
    const monthEnd   = endOfMonth(current)
    const monthDays  = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const joursOuvertureDates = monthDays.filter(day =>
      classifyCell(day, events, joursOuverture, ouvertureVeillesFeries) === 'jour_ouverture'
    )

    if (!joursOuvertureDates.length) return

    const dateStrs = joursOuvertureDates.map(d => format(d, 'yyyy-MM-dd'))
    setFetchingDates(new Set(dateStrs))

    Promise.allSettled(
      dateStrs.map(async (dateStr) => {
        try {
          const res = await fetch('/api/predicteur/v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr, typeEvenement: 'Open format', nomEvenement: 'Soirée standard' }),
          })
          if (!res.ok) return
          const pred: PredictionScoreResult = await res.json()
          setPredictionsCache(prev => ({ ...prev, [dateStr]: pred }))
        } finally {
          setFetchingDates(prev => { const next = new Set(prev); next.delete(dateStr); return next })
        }
      })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.getFullYear(), current.getMonth(), joursOuverture.join(','), ouvertureVeillesFeries])

  async function handleCellClick(date: Date, type: CellType, event: CalendrierEvent | null) {
    if (!onDayClick) return
    if (type === 'jour_ouverture') {
      const dateStr = format(date, 'yyyy-MM-dd')
      const cached = predictionsCache[dateStr]
      if (cached) {
        onDayClick({ date, type, event, prediction: cached })
        return
      }
      // Fallback si pas encore en cache
      setClickLoadingDate(dateStr)
      try {
        const res = await fetch('/api/predicteur/v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateStr, typeEvenement: 'Open format', nomEvenement: 'Soirée standard' }),
        })
        const prediction: PredictionScoreResult = await res.json()
        setPredictionsCache(prev => ({ ...prev, [dateStr]: prediction }))
        onDayClick({ date, type, event, prediction })
      } catch {
        onDayClick({ date, type, event, prediction: null })
      } finally {
        setClickLoadingDate(null)
      }
    } else {
      onDayClick({ date, type, event, prediction: null })
    }
  }

  return (
    <div className="space-y-4">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1))}
          className="p-1.5 rounded-lg transition-colors hover:opacity-80"
          style={{ color: 'var(--t2)' }}
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="font-semibold capitalize text-sm" style={{ color: 'var(--t1)' }}>
          {format(current, 'MMMM yyyy', { locale: fr })}
        </h3>
        <button
          onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1))}
          className="p-1.5 rounded-lg transition-colors hover:opacity-80"
          style={{ color: 'var(--t2)' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-1">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold py-1 uppercase tracking-wider" style={{ color: 'var(--t3)' }}>
            {d}
          </div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const event   = eventsByDate[dateStr] ?? null
          const type    = isSameMonth(day, current)
            ? classifyCell(day, events, joursOuverture, ouvertureVeillesFeries)
            : 'hors_ouverture'

          return (
            <Cell
              key={dateStr}
              date={day}
              type={type}
              event={event}
              prediction={predictionsCache[dateStr] ?? null}
              predLoading={fetchingDates.has(dateStr)}
              clickLoading={clickLoadingDate === dateStr}
              onCellClick={handleCellClick}
            />
          )
        })}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2">
        {[
          { label: 'Soirée réalisée',  bg: 'rgba(79,232,130,0.08)',  border: 'rgba(79,232,130,0.28)',  solid: true },
          { label: 'Soirée planifiée', bg: 'rgba(123,92,229,0.10)', border: 'rgba(123,92,229,0.35)', solid: true },
          { label: 'Ouverture prévue', bg: 'rgba(79,163,232,0.06)', border: 'rgba(79,163,232,0.30)', solid: false },
        ].map(({ label, bg, border, solid }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: bg, border: `1px ${solid ? 'solid' : 'dashed'} ${border}` }} />
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
