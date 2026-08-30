'use client'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { parseISO } from 'date-fns'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const
const TYPES = [
  'Étudiante', 'Latino', 'Techno', 'Années 80/90', 'House', 'Afterwork',
  'Match & DJ set', 'Open format', 'Blind test', 'Live acoustique',
  'Généraliste', 'Karaoké', 'Fête de la musique', 'Spéciale Halloween', 'Nouvel an',
] as const
const METEOS = ['Soleil', 'Nuageux', 'Pluie légère', 'Forte pluie', 'Froid', 'Canicule'] as const
const CANAUX = ['Instagram', 'Bouche-à-oreille', 'Email/SMS', 'Affichage', 'Partenariat étudiant'] as const

const schema = z.object({
  date: z.string().min(1),
  type_evenement: z.enum(TYPES),
  nom_evenement: z.string().optional(),
  dj_id: z.string().optional(),
  meteo: z.enum(METEOS).optional(),
  temperature_c: z.coerce.number().min(-20).max(50).optional(),
  concurrence: z.enum(['Faible', 'Moyenne', 'Forte']),
  vacances_scolaires: z.boolean(),
  prix_entree: z.coerce.number().min(0),
  budget_com: z.coerce.number().min(0),
  staff: z.coerce.number().min(1).max(20),
  canal_acquisition: z.enum(CANAUX),
  freq_reelle: z.coerce.number().min(0).optional(),
  ca_bar: z.coerce.number().min(0).optional(),
  ca_entrees: z.coerce.number().min(0),
  panier_moyen: z.coerce.number().min(0).optional(),
  charges_variables: z.coerce.number().min(0).optional(),
  satisfaction: z.coerce.number().min(1).max(5).optional(),
  reach_ig: z.coerce.number().min(0),
})

type FormData = z.infer<typeof schema>

interface Props {
  clubId: string
  djs: { id: string; nom: string }[]
  onSuccess?: () => void
}

function jourFromDate(dateStr: string): string {
  const d = parseISO(dateStr)
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return jours[d.getDay()]
}

export default function SoireeForm({ clubId, djs, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      concurrence: 'Faible',
      vacances_scolaires: false,
      prix_entree: 0,
      budget_com: 0,
      staff: 2,
      canal_acquisition: 'Instagram',
      ca_entrees: 0,
      reach_ig: 0,
    },
  })

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const supabase = createClient()
    const jour = jourFromDate(data.date)

    const { data: soiree, error: soireeErr } = await supabase
      .from('soirees')
      .insert({
        club_id: clubId,
        date: data.date,
        jour,
        type_evenement: data.type_evenement,
        nom_evenement: data.nom_evenement || null,
        dj_id: data.dj_id || null,
        meteo: data.meteo || null,
        temperature_c: data.temperature_c ?? null,
        concurrence: data.concurrence,
        vacances_scolaires: data.vacances_scolaires,
        prix_entree: data.prix_entree,
        budget_com: data.budget_com,
        staff: data.staff,
        canal_acquisition: data.canal_acquisition,
      })
      .select()
      .single()

    if (soireeErr || !soiree) {
      toast.error('Erreur lors de l\'enregistrement de la soirée', { description: soireeErr?.message })
      return
    }

    if (data.freq_reelle !== undefined) {
      const { error: resultatsErr } = await supabase.from('resultats').insert({
        soiree_id: soiree.id,
        club_id: clubId,
        freq_reelle: data.freq_reelle,
        ca_bar: data.ca_bar ?? null,
        ca_entrees: data.ca_entrees,
        panier_moyen: data.panier_moyen ?? null,
        charges_variables: data.charges_variables ?? null,
        satisfaction: data.satisfaction ?? null,
        reach_ig: data.reach_ig,
      })

      if (resultatsErr) {
        toast.error('La soirée est enregistrée, mais les résultats n\'ont pas pu être sauvegardés', { description: resultatsErr.message })
        return
      }

      await fetch('/api/coefficients/recalcul', { method: 'POST' })
    }

    toast.success('Soirée enregistrée')
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      <div>
        <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input type="date" {...register('date')} />
          </div>
          <div className="space-y-1.5">
            <Label>Type d'événement *</Label>
            <Select onValueChange={(v) => setValue('type_evenement', v as typeof TYPES[number])}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nom de l'événement</Label>
            <Input {...register('nom_evenement')} placeholder="Optionnel" />
          </div>
          <div className="space-y-1.5">
            <Label>DJ</Label>
            <Select onValueChange={(v) => setValue('dj_id', v as string)}>
              <SelectTrigger><SelectValue placeholder="Sans DJ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sans DJ</SelectItem>
                {djs.map(d => <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Météo</Label>
            <Select onValueChange={(v) => setValue('meteo', v as typeof METEOS[number])}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                {METEOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Température (°C)</Label>
            <Input type="number" {...register('temperature_c')} placeholder="Ex: 18" />
          </div>
          <div className="space-y-1.5">
            <Label>Concurrence</Label>
            <Select defaultValue="Faible" onValueChange={(v) => setValue('concurrence', v as 'Faible' | 'Moyenne' | 'Forte')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Faible">Faible</SelectItem>
                <SelectItem value="Moyenne">Moyenne</SelectItem>
                <SelectItem value="Forte">Forte</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Canal d'acquisition</Label>
            <Select defaultValue="Instagram" onValueChange={(v) => setValue('canal_acquisition', v as typeof CANAUX[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CANAUX.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Prix d'entrée (€)</Label>
            <Input type="number" {...register('prix_entree')} defaultValue={0} />
          </div>
          <div className="space-y-1.5">
            <Label>Budget com. (€)</Label>
            <Input type="number" {...register('budget_com')} defaultValue={0} />
          </div>
          <div className="space-y-1.5">
            <Label>Staff</Label>
            <Input type="number" {...register('staff')} defaultValue={2} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox id="vacances" onCheckedChange={(v) => setValue('vacances_scolaires', !!v)} />
            <Label htmlFor="vacances">Vacances scolaires</Label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">Résultats (après soirée)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Fréquentation réelle</Label>
            <Input type="number" {...register('freq_reelle')} placeholder="Ex: 240" />
          </div>
          <div className="space-y-1.5">
            <Label>CA bar (€)</Label>
            <Input type="number" {...register('ca_bar')} placeholder="Ex: 7500" />
          </div>
          <div className="space-y-1.5">
            <Label>CA entrées (€)</Label>
            <Input type="number" {...register('ca_entrees')} defaultValue={0} />
          </div>
          <div className="space-y-1.5">
            <Label>Panier moyen (€)</Label>
            <Input type="number" step="0.1" {...register('panier_moyen')} placeholder="Ex: 28.5" />
          </div>
          <div className="space-y-1.5">
            <Label>Charges variables (€)</Label>
            <Input type="number" {...register('charges_variables')} placeholder="Ex: 900" />
          </div>
          <div className="space-y-1.5">
            <Label>Satisfaction (1–5)</Label>
            <Input type="number" step="0.1" min="1" max="5" {...register('satisfaction')} placeholder="Ex: 4.2" />
          </div>
          <div className="space-y-1.5">
            <Label>Reach Instagram</Label>
            <Input type="number" {...register('reach_ig')} defaultValue={0} />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Enregistrement...' : 'Enregistrer la soirée'}
      </Button>
    </form>
  )
}
