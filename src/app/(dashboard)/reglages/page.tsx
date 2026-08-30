'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/types/database'
import JoursOuvertureSection from '@/components/reglages/JoursOuvertureSection'
import AlertesSection from '@/components/reglages/AlertesSection'
import HorairesSection, { type HorairePreset } from '@/components/reglages/HorairesSection'

const REGIONS = [
  'Auvergne-Rhône-Alpes','Bourgogne-Franche-Comté','Bretagne','Centre-Val de Loire',
  'Corse','Grand Est','Hauts-de-France','Île-de-France','Normandie',
  'Nouvelle-Aquitaine','Occitanie','PACA','Pays de la Loire',
]

const IDX_POP_OPTIONS = [
  { value: '0.8',  label: 'Zone peu dense (0.8)' },
  { value: '1.0',  label: 'Zone normale (1.0)' },
  { value: '1.1',  label: 'Zone dense (1.1)' },
  { value: '1.3',  label: 'Grande zone urbaine (1.3)' },
  { value: '1.8',  label: 'Zone littorale / touristique (1.8)' },
]

const schema = z.object({
  type_etablissement: z.enum(['bar', 'discotheque']),
  type_lieu: z.string(),
  accessibilite: z.enum(['centre_ville', 'hors_centre_ville']),
  region: z.string().min(1),
  ville: z.string().optional(),
  adresse: z.string().optional(),
  zone_vacances: z.enum(['A', 'B', 'C']),
  idx_population: z.coerce.number(),
  pct_etudiants: z.coerce.number().int().min(0).max(100),
  pct_jeunes_actifs: z.coerce.number().int().min(0).max(100),
  pct_adultes: z.coerce.number().int().min(0).max(100),
  panier_base: z.coerce.number().positive(),
  capacite: z.coerce.number().int().positive(),
}).refine(d => d.pct_etudiants + d.pct_jeunes_actifs + d.pct_adultes === 100, {
  message: 'La somme étudiants + jeunes actifs + adultes doit être égale à 100%',
  path: ['pct_adultes'],
})

type FormData = z.infer<typeof schema>

const supabase = createClient()

async function geocodeAdresse(adresse: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse)}&countrycodes=fr&limit=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'ClubAI/1.0' } })
    const data = await res.json() as Array<{ lat: string; lon: string }>
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

export default function ReglagesPage() {
  const [clubId, setClubId] = useState<string | null>(null)
  const [capaciteDefault, setCapaciteDefault] = useState(350)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [joursOuverture, setJoursOuverture] = useState<string[]>([])
  const [seuilAlerte, setSeuilAlerte] = useState(10)
  const [horairesPreferentiels, setHorairesPreferentiels] = useState<HorairePreset[]>([])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      type_etablissement: 'bar',
      type_lieu: 'bar_interieur',
      accessibilite: 'centre_ville',
      region: 'Île-de-France',
      zone_vacances: 'C',
      idx_population: 1.0,
      pct_etudiants: 33,
      pct_jeunes_actifs: 34,
      pct_adultes: 33,
      panier_base: 20,
      capacite: 350,
    },
  })

  const typeEtabl = watch('type_etablissement')

  const typeLieuOptions = typeEtabl === 'bar'
    ? [
        { value: 'bar_interieur',     label: 'Bar intérieur' },
        { value: 'bar_avec_terrasse', label: 'Bar avec terrasse' },
        { value: 'bar_rooftop',       label: 'Bar rooftop' },
      ]
    : [
        { value: 'club_interieur',     label: 'Club intérieur' },
        { value: 'club_avec_terrasse', label: 'Club avec terrasse' },
        { value: 'club_rooftop',       label: 'Club rooftop' },
      ]

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: club } = await supabase.from('clubs').select('id, capacite').eq('owner_id', user.id).single()
      if (!club) return
      setClubId(club.id)
      setCapaciteDefault(club.capacite ?? 350)
      setValue('capacite', club.capacite ?? 350)

      const { data: s } = await supabase.from('club_settings').select('*').eq('club_id', club.id).single()
      if (!s) return
      setValue('type_etablissement', s.type_etablissement)
      setValue('type_lieu',          s.type_lieu)
      setValue('accessibilite',      s.accessibilite)
      setValue('region',             s.region)
      setValue('ville',              s.ville ?? '')
      setValue('adresse',            s.adresse ?? '')
      if (s.jours_ouverture) setJoursOuverture(s.jours_ouverture)
      if (s.seuil_alerte_variation != null) setSeuilAlerte(s.seuil_alerte_variation)
      if (s.horaires_preferentiels) setHorairesPreferentiels(s.horaires_preferentiels as unknown as HorairePreset[])
      setValue('zone_vacances',      s.zone_vacances ?? 'C')
      setValue('idx_population',     Number(s.idx_population))
      setValue('pct_etudiants',      s.pct_etudiants)
      setValue('pct_jeunes_actifs',  s.pct_jeunes_actifs)
      setValue('pct_adultes',        s.pct_adultes)
      setValue('panier_base',        Number(s.panier_base))
    }
    loadSettings()
  }, [setValue])

  const onSubmit = async (data: FormData) => {
    if (!clubId) return
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    try {
      // Géocoder l'adresse si renseignée
      let lat: number | null = null
      let lon: number | null = null
      if (data.adresse) {
        const geo = await geocodeAdresse(data.adresse)
        if (geo) { lat = geo.lat; lon = geo.lon }
      }

      // Mettre à jour la capacité dans clubs
      const { error: clubError } = await supabase
        .from('clubs')
        .update({ capacite: data.capacite })
        .eq('id', clubId)

      if (clubError) {
        console.error('[reglages] update clubs', clubError)
        setSaveError(`Erreur (clubs) : ${clubError.message}`)
        return
      }

      // Upsert club_settings
      const { error: settingsError } = await supabase.from('club_settings').upsert({
        club_id:            clubId,
        type_etablissement: data.type_etablissement,
        type_lieu:          data.type_lieu,
        accessibilite:      data.accessibilite,
        region:             data.region,
        ville:              data.ville || null,
        adresse:            data.adresse || null,
        lat,
        lon,
        zone_vacances:      data.zone_vacances,
        idx_population:     data.idx_population,
        pct_etudiants:      data.pct_etudiants,
        pct_jeunes_actifs:  data.pct_jeunes_actifs,
        pct_adultes:        data.pct_adultes,
        panier_base:        data.panier_base,
        jours_ouverture:    joursOuverture,
        seuil_alerte_variation: seuilAlerte,
        horaires_preferentiels: horairesPreferentiels as unknown as Json,
        updated_at:         new Date().toISOString(),
      }, { onConflict: 'club_id' })

      if (settingsError) {
        console.error('[reglages] upsert club_settings', settingsError)
        setSaveError(`Erreur (club_settings) : ${settingsError.message}`)
        return
      }

      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-grad">Configuration</div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--t1)' }}>Réglages du club</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>
          Ces paramètres alimentent le moteur de prédiction — à renseigner une seule fois.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">

        {/* Établissement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Établissement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type d'établissement</Label>
                <Select value={watch('type_etablissement')} onValueChange={v => setValue('type_etablissement', v as 'bar' | 'discotheque')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="discotheque">Discothèque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Exposition météo</Label>
                <Select value={watch('type_lieu')} onValueChange={v => setValue('type_lieu', v as string)}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>
                    {typeLieuOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Accessibilité</Label>
              <Select value={watch('accessibilite')} onValueChange={v => setValue('accessibilite', v as 'centre_ville' | 'hors_centre_ville')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="centre_ville">Centre-ville</SelectItem>
                  <SelectItem value="hors_centre_ville">Hors centre-ville</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Localisation</CardTitle>
            <CardDescription className="text-xs">L'adresse est utilisée pour la météo (géocodage automatique)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Région</Label>
                <Select value={watch('region')} onValueChange={v => setValue('region', v as string)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ville (optionnel)</Label>
                <Input {...register('ville')} placeholder="Paris, Lyon..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Adresse complète</Label>
              <Input {...register('adresse')} placeholder="12 rue de la Paix, 75001 Paris" />
            </div>
            <div className="space-y-1.5">
              <Label>Zone de vacances scolaires</Label>
              <Select value={watch('zone_vacances')} onValueChange={v => setValue('zone_vacances', v as 'A' | 'B' | 'C')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Zone A (Lyon, Bordeaux, Clermont-Fd…)</SelectItem>
                  <SelectItem value="B">Zone B (Marseille, Nantes, Lille…)</SelectItem>
                  <SelectItem value="C">Zone C (Paris, Toulouse, Montpellier…)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Marché local */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Marché local</CardTitle>
            <CardDescription className="text-xs">Ajuste l'impact de la concurrence selon la densité de votre zone</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label>Indice de densité de population</Label>
              <Select value={watch('idx_population')?.toFixed(1)} onValueChange={v => setValue('idx_population', parseFloat(v as string))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IDX_POP_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clientèle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Clientèle type</CardTitle>
            <CardDescription className="text-xs">La somme doit être égale à 100%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>% Étudiants</Label>
                <Input type="number" min="0" max="100" {...register('pct_etudiants')} />
              </div>
              <div className="space-y-1.5">
                <Label>% Jeunes actifs</Label>
                <Input type="number" min="0" max="100" {...register('pct_jeunes_actifs')} />
              </div>
              <div className="space-y-1.5">
                <Label>% Adultes</Label>
                <Input type="number" min="0" max="100" {...register('pct_adultes')} />
              </div>
            </div>
            {errors.pct_adultes && (
              <p className="text-xs text-red-400">{errors.pct_adultes.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Économie */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Économie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Capacité du lieu</Label>
                <Input type="number" min="1" {...register('capacite')} />
              </div>
              <div className="space-y-1.5">
                <Label>Panier de base (€)</Label>
                <Input type="number" min="1" step="0.5" {...register('panier_base')} />
                <p className="text-[11px] text-muted-foreground">Bar ≈ 15 €, Club ≈ 20 €, Bar restauration ≈ 25 €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jours d'ouverture */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Jours d'ouverture</CardTitle>
          </CardHeader>
          <CardContent>
            <JoursOuvertureSection value={joursOuverture} onChange={setJoursOuverture} />
          </CardContent>
        </Card>

        {/* Horaires préférentiels */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Horaires</CardTitle>
          </CardHeader>
          <CardContent>
            <HorairesSection value={horairesPreferentiels} onChange={setHorairesPreferentiels} />
          </CardContent>
        </Card>

        {/* Alertes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertesSection value={seuilAlerte} onChange={setSeuilAlerte} />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer les réglages'}
        </Button>

        {saved && (
          <p className="text-center text-sm text-emerald-500">Réglages enregistrés avec succès.</p>
        )}
        {saveError && (
          <p className="text-center text-sm text-red-400">{saveError}</p>
        )}
      </form>
    </div>
  )
}
