'use client'
import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { fr } from 'date-fns/locale'

const TYPES_EVENEMENT = [
  'Étudiante','Latino','Techno','Années 80/90','House','Afterwork',
  'Match & DJ set','Open format','Blind test','Live acoustique',
  'Généraliste','Karaoké','Fête de la musique','Spéciale Halloween','Nouvel an',
  'Autre',
]

export interface PredicteurFormValues {
  date: Date
  typeEvenement: string
  nomEvenement: string
  djId: string | null
  djNom: string | null
}

interface Props {
  djs: { id: string; nom: string }[]
  onSubmit: (values: PredicteurFormValues) => void
  loading?: boolean
  submitLabel?: string
}

export default function PredicteurForm({ djs, onSubmit, loading, submitLabel = 'Calculer la prédiction' }: Props) {
  const [date, setDate]             = useState<Date | undefined>(new Date())
  const [typeEvenement, setType]    = useState('')
  const [typeAutre, setTypeAutre]   = useState('')
  const [nomEvenement, setNom]      = useState('')
  const [djId, setDjId]             = useState('none')

  const typeFinal = typeEvenement === 'Autre' ? typeAutre.trim() || 'Autre' : typeEvenement
  const canSubmit = !!date && !!typeEvenement && (typeEvenement !== 'Autre' || !!typeAutre.trim()) && !!nomEvenement

  function handleSubmit() {
    if (!canSubmit || !date) return
    const resolvedDjId  = djId === 'none' ? null : djId
    const resolvedDjNom = resolvedDjId ? (djs.find(d => d.id === resolvedDjId)?.nom ?? null) : null
    onSubmit({ date, typeEvenement: typeFinal, nomEvenement, djId: resolvedDjId, djNom: resolvedDjNom })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Colonne gauche — calendrier */}
      <div>
        <Label className="text-xs uppercase text-muted-foreground mb-2 block">Date de la soirée</Label>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          locale={fr}
          className="rounded-md border border-border"
        />
      </div>

      {/* Colonne droite — selects */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase text-muted-foreground">Type d'événement</Label>
          <Select value={typeEvenement} onValueChange={v => setType(v as string)}>
            <SelectTrigger><SelectValue placeholder="Choisir un type…" /></SelectTrigger>
            <SelectContent>
              {TYPES_EVENEMENT.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          {typeEvenement === 'Autre' && (
            <Input
              className="mt-1.5"
              placeholder="Précise le type d'événement"
              value={typeAutre}
              onChange={e => setTypeAutre(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase text-muted-foreground">Nom de l'événement</Label>
          <Input
            placeholder="Ex : Soirée Latino Spéciale"
            value={nomEvenement}
            onChange={e => setNom(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase text-muted-foreground">DJ</Label>
          <Select value={djId} onValueChange={v => setDjId(v as string)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sans DJ</SelectItem>
              {djs.map(dj => <SelectItem key={dj.id} value={dj.id}>{dj.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" disabled={!canSubmit || loading} onClick={handleSubmit}>
          {loading ? 'Calcul en cours…' : submitLabel}
        </Button>
      </div>
    </div>
  )
}
