'use client'
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type PredictionParams } from '@/lib/analytics/predicteur'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const TYPES = ['Étudiante', 'Latino', 'Techno', 'Années 80/90', 'House', 'Afterwork', 'Match & DJ set', 'Open format', 'Blind test', 'Généraliste', 'Karaoké']
const DJS = ['DJ Martin', 'DJ Sarah', 'DJ Clara', 'DJ Emma', 'DJ Alex', 'DJ Lucas', 'DJ Noé', 'Sans DJ']
const METEOS = ['Soleil', 'Nuageux', 'Pluie légère', 'Forte pluie', 'Froid', 'Canicule']

interface Props {
  label: string
  color: string
  onUpdate: (params: PredictionParams | null) => void
}

export default function ScenarioCard({ label, color, onUpdate }: Props) {
  const [form, setForm] = useState<Partial<PredictionParams>>({ concurrence: 'Faible', meteo: 'Nuageux' })

  const set = (key: keyof PredictionParams, val: unknown) => {
    const next = { ...form, [key]: val }
    setForm(next)
    const isReady = next.jour && next.mois && next.type_evenement && next.dj_nom && next.meteo && next.concurrence
    onUpdate(isReady ? next as PredictionParams : null)
  }

  return (
    <Card className="border-2" style={{ borderColor: color + '40' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: color }} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[
          { key: 'jour' as const, label: 'Jour', options: JOURS },
          { key: 'type_evenement' as const, label: 'Type', options: TYPES },
          { key: 'dj_nom' as const, label: 'DJ', options: DJS },
          { key: 'meteo' as const, label: 'Météo', options: METEOS },
        ].map(({ key, label: l, options }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs">{l}</Label>
            <Select onValueChange={v => set(key, v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="..." /></SelectTrigger>
              <SelectContent>{options.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ))}
        <div className="space-y-1">
          <Label className="text-xs">Mois</Label>
          <Select onValueChange={v => set('mois', Number(v))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="..." /></SelectTrigger>
            <SelectContent>{MOIS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Concurrence</Label>
          <Select defaultValue="Faible" onValueChange={v => set('concurrence', v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Faible" className="text-xs">Faible</SelectItem>
              <SelectItem value="Moyenne" className="text-xs">Moyenne</SelectItem>
              <SelectItem value="Forte" className="text-xs">Forte</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
