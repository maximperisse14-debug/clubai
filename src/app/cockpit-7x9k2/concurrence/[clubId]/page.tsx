'use client'
import { useState, useEffect, useCallback, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface JourConcurrence {
  date: string
  directs_petites: number
  directs_moyennes: number
  directs_grosses: number
  lointains_petites: number
  lointains_moyennes: number
  lointains_grosses: number
  notes: string | null
}

const supabase = createClient()

function getNiveau(jour: JourConcurrence | undefined): 'none' | 'faible' | 'moyen' | 'fort' {
  if (!jour) return 'none'
  const total =
    jour.directs_petites + jour.directs_moyennes * 2 + jour.directs_grosses * 3 +
    jour.lointains_petites * 0.5 + jour.lointains_moyennes + jour.lointains_grosses * 1.5
  if (total === 0) return 'none'
  if (total <= 2)  return 'faible'
  if (total <= 5)  return 'moyen'
  return 'fort'
}

const CELL_CLASS: Record<string, string> = {
  none:   'bg-zinc-900 border-zinc-800 hover:border-zinc-600',
  faible: 'bg-emerald-950/40 border-emerald-800/40 hover:border-emerald-600',
  moyen:  'bg-amber-950/40 border-amber-800/40 hover:border-amber-600',
  fort:   'bg-red-950/40 border-red-800/40 hover:border-red-600',
}

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function CockpitConcurrenceCalendrier({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [data, setData]             = useState<Record<string, JourConcurrence>>({})
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [clubNom, setClubNom]       = useState('')

  const loadMonth = useCallback(async () => {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end   = format(endOfMonth(currentMonth),   'yyyy-MM-dd')
    const { data: rows } = await supabase
      .from('concurrence_calendrier')
      .select('*')
      .eq('club_id', clubId)
      .gte('date', start)
      .lte('date', end)
    const map: Record<string, JourConcurrence> = {}
    rows?.forEach(r => { map[r.date] = r as JourConcurrence })
    setData(map)
  }, [currentMonth, clubId])

  useEffect(() => {
    supabase.from('clubs').select('nom').eq('id', clubId).single()
      .then(({ data: club }) => { if (club) setClubNom(club.nom) })
  }, [clubId])

  useEffect(() => { loadMonth() }, [loadMonth])

  const jours = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })

  // Padding pour aligner le 1er sur le bon jour de semaine (Lun=0 ... Dim=6)
  const firstDow = (getDay(jours[0]) + 6) % 7 // convertit dim=0 → lun=0
  const padding  = Array.from({ length: firstDow })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">{clubNom || clubId}</h1>
          <p className="text-zinc-400 text-sm">Calendrier des coefficients de concurrence</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>‹</Button>
          <span className="text-white text-sm w-36 text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </span>
          <Button size="sm" variant="outline" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>›</Button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex gap-4 mb-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-zinc-800 bg-zinc-900 inline-block" />Non renseigné</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-emerald-800/40 bg-emerald-950/40 inline-block" />Faible</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-amber-800/40 bg-amber-950/40 inline-block" />Moyenne</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-red-800/40 bg-red-950/40 inline-block" />Forte</span>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-1.5">
        {JOURS_SEMAINE.map(j => (
          <div key={j} className="text-center text-xs text-zinc-600 uppercase pb-1 font-medium">{j}</div>
        ))}
        {padding.map((_, i) => <div key={`pad-${i}`} />)}
        {jours.map(jour => {
          const key     = format(jour, 'yyyy-MM-dd')
          const jourData = data[key]
          const niveau  = getNiveau(jourData)
          const totalD  = jourData ? jourData.directs_petites + jourData.directs_moyennes + jourData.directs_grosses : 0
          const totalL  = jourData ? jourData.lointains_petites + jourData.lointains_moyennes + jourData.lointains_grosses : 0
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(jour)}
              className={`aspect-square rounded-lg border p-1.5 text-left transition-colors ${CELL_CLASS[niveau]}`}
            >
              <div className="text-sm text-white leading-none">{format(jour, 'd')}</div>
              {jourData && (totalD > 0 || totalL > 0) && (
                <div className="text-[9px] text-zinc-400 mt-1 leading-tight">
                  {totalD > 0 && <span>{totalD}D </span>}
                  {totalL > 0 && <span>{totalL}L</span>}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selectedDay && (
        <JourEditDialog
          clubId={clubId}
          date={selectedDay}
          existing={data[format(selectedDay, 'yyyy-MM-dd')]}
          onClose={() => setSelectedDay(null)}
          onSaved={() => { setSelectedDay(null); loadMonth() }}
        />
      )}
    </div>
  )
}

function JourEditDialog({
  clubId, date, existing, onClose, onSaved,
}: {
  clubId: string; date: Date
  existing?: JourConcurrence
  onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({
    directs_petites:    existing?.directs_petites   ?? 0,
    directs_moyennes:   existing?.directs_moyennes  ?? 0,
    directs_grosses:    existing?.directs_grosses   ?? 0,
    lointains_petites:  existing?.lointains_petites  ?? 0,
    lointains_moyennes: existing?.lointains_moyennes ?? 0,
    lointains_grosses:  existing?.lointains_grosses  ?? 0,
    notes: existing?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase.from('concurrence_calendrier').upsert(
      { club_id: clubId, date: format(date, 'yyyy-MM-dd'), ...form },
      { onConflict: 'club_id,date' },
    )
    setSaving(false)
    onSaved()
  }

  function numField(key: keyof typeof form, label: string) {
    return (
      <div className="space-y-1">
        <Label className="text-zinc-400 text-xs">{label}</Label>
        <Input
          type="number" min={0}
          value={form[key] as number}
          onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
          className="bg-zinc-900 border-zinc-700 text-white h-8 text-sm"
        />
      </div>
    )
  }

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white capitalize">
            {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2">Concurrents directs</p>
            <div className="grid grid-cols-3 gap-2">
              {numField('directs_petites',  'Petits')}
              {numField('directs_moyennes', 'Moyens')}
              {numField('directs_grosses',  'Gros')}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2">Concurrents lointains</p>
            <div className="grid grid-cols-3 gap-2">
              {numField('lointains_petites',  'Petits')}
              {numField('lointains_moyennes', 'Moyens')}
              {numField('lointains_grosses',  'Gros')}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Notes</Label>
            <Input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Festival concurrent, événement spécial…"
              className="bg-zinc-900 border-zinc-700 text-white text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
