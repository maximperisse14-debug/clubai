'use client'
import { useState, useRef } from 'react'
import { format, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Sparkles, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

const TYPES_EVENEMENT = [
  'Étudiante','Latino','Techno','Années 80/90','House','Afterwork',
  'Match & DJ set','Open format','Blind test','Live acoustique',
  'Généraliste','Karaoké','Fête de la musique','Spéciale Halloween','Nouvel an','Autre',
]

const JOUR_NOMS: Record<number, string> = {
  0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi',
  4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
}

const INPUT_STYLE: React.CSSProperties = {
  background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)',
}

interface Props {
  date: Date
  clubId: string
  djs: { id: string; nom: string }[]
  onSuccess: () => void
  onCancel: () => void
}

export default function PlanifierSoireeForm({ date, clubId, djs, onSuccess, onCancel }: Props) {
  const queryClient = useQueryClient()

  // Champs principaux
  const [nomEvenement,   setNomEvenement]   = useState('')
  const [typeEvenement,  setTypeEvenement]  = useState('')
  const [djId,           setDjId]           = useState<string | null>(null)
  const [goodies,        setGoodies]        = useState('')
  const [animations,     setAnimations]     = useState('')

  // Type d'événement : liste vs libre
  const [typeMode,  setTypeMode]  = useState<'liste' | 'libre'>('liste')
  const [typeLibre, setTypeLibre] = useState('')

  // DJ : liste vs nouveau
  const [djMode,       setDjMode]       = useState<'liste' | 'nouveau'>('liste')
  const [nouveauDjNom, setNouveauDjNom] = useState('')

  // Zone IA
  const [modeIA,     setModeIA]     = useState<'image' | 'texte'>('image')
  const [image,      setImage]      = useState<{ base64: string; preview: string } | null>(null)
  const [textePost,  setTextePost]  = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')

  // Soumission
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helpers
  const effectiveType = typeMode === 'libre' ? typeLibre : typeEvenement
  const canSubmit = !!nomEvenement && !!effectiveType && !submitting

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      setImage({ base64: result.split(',')[1], preview: result })
    }
    reader.readAsDataURL(file)
  }

  function applyExtracted(data: any) {
    if (data.nomEvenement)  setNomEvenement(data.nomEvenement)
    if (data.typeEvenement) {
      if (TYPES_EVENEMENT.includes(data.typeEvenement)) {
        setTypeMode('liste'); setTypeEvenement(data.typeEvenement)
      } else {
        setTypeMode('libre'); setTypeLibre(data.typeEvenement)
      }
    }
    if (data.djNom) {
      const match = djs.find(d => d.nom.toLowerCase().includes(data.djNom.toLowerCase()))
      if (match) { setDjMode('liste'); setDjId(match.id) }
      else        { setDjMode('nouveau'); setNouveauDjNom(data.djNom) }
    }
    if (data.goodies)    setGoodies(data.goodies)
    if (data.animations) setAnimations(data.animations)
  }

  async function handleExtractImage() {
    if (!image) return
    setExtracting(true); setExtractError('')
    try {
      const res = await fetch('/api/ia/extract-soiree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: image.base64, date: date.toISOString() }),
      })
      const data = await res.json() as any
      if (data.error) { setExtractError(data.error); return }
      applyExtracted(data)
    } catch {
      setExtractError('Erreur lors de l\'extraction.')
    } finally {
      setExtracting(false)
    }
  }

  async function handleExtractTexte() {
    if (!textePost.trim()) return
    setExtracting(true); setExtractError('')
    try {
      const res = await fetch('/api/ia/extract-soiree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texte: textePost, date: date.toISOString() }),
      })
      const data = await res.json() as any
      if (data.error) { setExtractError(data.error); return }
      applyExtracted(data)
    } catch {
      setExtractError('Erreur lors de l\'extraction.')
    } finally {
      setExtracting(false)
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true); setSubmitError('')
    try {
      const supabase = createClient()

      // Créer le DJ si mode nouveau
      let djIdFinal = djId
      if (djMode === 'nouveau' && nouveauDjNom.trim()) {
        const { data: newDj } = await supabase
          .from('djs')
          .insert({ club_id: clubId, nom: nouveauDjNom.trim(), cout_base: 200, actif: true })
          .select()
          .single()
        djIdFinal = newDj?.id ?? null
        queryClient.invalidateQueries({ queryKey: ['djs', clubId] })
      }

      // Insérer la soirée
      const { data: soiree, error: insertErr } = await supabase.from('soirees').insert({
        club_id:        clubId,
        date:           format(date, 'yyyy-MM-dd'),
        jour:           JOUR_NOMS[getDay(date)],
        type_evenement: effectiveType,
        nom_evenement:  nomEvenement,
        dj_id:          djIdFinal || null,
        goodies:        goodies   || null,
        animations:     animations || null,
        ia_extraction:  !!(image?.base64 || textePost),
      }).select().single()

      if (insertErr) throw insertErr

      // Calculer la prédiction
      const predRes = await fetch('/api/predicteur/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: format(date, 'yyyy-MM-dd'), typeEvenement: effectiveType, nomEvenement }),
      })
      if (predRes.ok && soiree) {
        const pred = await predRes.json() as any
        await supabase.from('soirees').update({
          prediction_freq:         pred.frequentationEstimee,
          prediction_ca:           pred.caEstime,
          prediction_score_global: pred.scoreGlobal,
          prediction_calculee_le:  new Date().toISOString(),
        }).eq('id', soiree.id)
      }

      onSuccess()
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Erreur lors de l\'enregistrement.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      <div>
        <div className="font-bold text-base" style={{ color: 'var(--t1)' }}>Planifier une soirée</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>
          {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
        </div>
      </div>

      {/* ── Zone IA ── */}
      <div className="rounded-xl p-4" style={{ background: 'var(--s2)', border: '1px dashed rgba(123,92,229,0.4)' }}>
        {/* Header + toggle image/texte */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: 'var(--c2)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--c2)' }}>Extraction via IA</span>
          </div>
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: 'var(--s3)' }}>
            {(['image', 'texte'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setModeIA(mode)}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all"
                style={{
                  background: modeIA === mode ? 'var(--c2)' : 'transparent',
                  color: modeIA === mode ? '#fff' : 'var(--t3)',
                }}
              >
                {mode === 'image' ? '📷 Image' : '📝 Texte'}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs mb-3" style={{ color: 'var(--t3)' }}>
          {modeIA === 'image'
            ? 'Importe une publication Instagram ou une affiche de soirée.'
            : 'Colle le texte de ta publication Instagram ou de ton annonce.'}
        </p>

        {/* Mode image */}
        {modeIA === 'image' && (
          !image ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium w-full justify-center hover:opacity-80"
              style={{ background: 'rgba(123,92,229,0.1)', border: '1px solid rgba(123,92,229,0.25)', color: 'var(--c2)' }}
            >
              <Upload size={14} /> Importer une image
            </button>
          ) : (
            <div className="space-y-2">
              <div className="relative inline-block">
                <img src={image.preview} alt="aperçu" className="h-20 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--s3)', border: '1px solid var(--b2)' }}
                >
                  <X size={10} style={{ color: 'var(--t2)' }} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleExtractImage}
                disabled={extracting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white w-full justify-center disabled:opacity-50"
                style={{ background: 'var(--grad)' }}
              >
                <Sparkles size={14} />
                {extracting ? 'Extraction en cours...' : 'Extraire les informations'}
              </button>
            </div>
          )
        )}

        {/* Mode texte */}
        {modeIA === 'texte' && (
          <div className="space-y-2">
            <textarea
              value={textePost}
              onChange={e => setTextePost(e.target.value)}
              rows={4}
              placeholder={'Colle ici le texte de ton post Instagram...\n\nEx: 🎉 SOIRÉE LATINO ce samedi avec DJ Carlos !\nShots offerts avant 23h 🍹'}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ ...INPUT_STYLE, fontFamily: 'inherit' }}
            />
            <button
              type="button"
              onClick={handleExtractTexte}
              disabled={!textePost.trim() || extracting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white w-full justify-center disabled:opacity-40"
              style={{ background: 'var(--grad)' }}
            >
              <Sparkles size={14} />
              {extracting ? 'Extraction en cours...' : 'Extraire les informations'}
            </button>
          </div>
        )}

        {extractError && <p className="text-xs mt-2" style={{ color: '#f09595' }}>{extractError}</p>}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* ── Champs ── */}
      <div className="space-y-3">
        {/* Nom */}
        <div>
          <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--t3)' }}>
            Nom de l'événement *
          </label>
          <input
            value={nomEvenement}
            onChange={e => setNomEvenement(e.target.value)}
            placeholder="Ex: Noche Latina Spéciale"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={INPUT_STYLE}
          />
        </div>

        {/* Type d'événement */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t3)' }}>
              Type d'événement *
            </label>
            <button
              type="button"
              onClick={() => setTypeMode(m => m === 'liste' ? 'libre' : 'liste')}
              className="text-[10px] font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--c1)' }}
            >
              {typeMode === 'liste' ? '+ Autre type' : '← Retour à la liste'}
            </button>
          </div>
          {typeMode === 'liste' ? (
            <select
              value={typeEvenement}
              onChange={e => setTypeEvenement(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={INPUT_STYLE}
            >
              <option value="">Choisir un type</option>
              {TYPES_EVENEMENT.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          ) : (
            <input
              value={typeLibre}
              onChange={e => setTypeLibre(e.target.value)}
              placeholder="Ex: Années 2000, Drag show..."
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={INPUT_STYLE}
            />
          )}
        </div>

        {/* DJ */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t3)' }}>DJ</label>
            <button
              type="button"
              onClick={() => setDjMode(m => m === 'liste' ? 'nouveau' : 'liste')}
              className="text-[10px] font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--c1)' }}
            >
              {djMode === 'liste' ? '+ Nouveau DJ' : '← Retour à la liste'}
            </button>
          </div>
          {djMode === 'liste' ? (
            <select
              value={djId ?? ''}
              onChange={e => setDjId(e.target.value || null)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={INPUT_STYLE}
            >
              <option value="">Sans DJ</option>
              {djs.map(dj => <option key={dj.id} value={dj.id}>{dj.nom}</option>)}
            </select>
          ) : (
            <div className="space-y-1.5">
              <input
                value={nouveauDjNom}
                onChange={e => setNouveauDjNom(e.target.value)}
                placeholder="Nom du DJ"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={INPUT_STYLE}
              />
              <p className="text-[10px]" style={{ color: 'var(--t3)' }}>
                Ce DJ sera ajouté à la liste de ton club et disponible pour les prochaines soirées.
              </p>
            </div>
          )}
        </div>

        {/* Goodies */}
        <div>
          <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--t3)' }}>
            Goodies / offres spéciales
          </label>
          <input
            value={goodies}
            onChange={e => setGoodies(e.target.value)}
            placeholder="Ex: Shot offert, Happy hour 21h-23h"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={INPUT_STYLE}
          />
        </div>

        {/* Animations */}
        <div>
          <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--t3)' }}>
            Animations
          </label>
          <input
            value={animations}
            onChange={e => setAnimations(e.target.value)}
            placeholder="Ex: Roue de la fortune, Photo booth"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={INPUT_STYLE}
          />
        </div>
      </div>

      {submitError && <p className="text-sm" style={{ color: '#f09595' }}>{submitError}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--s3)', color: 'var(--t2)', border: '1px solid var(--b1)' }}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
          style={{ background: 'var(--grad)' }}
        >
          {submitting ? 'Enregistrement...' : 'Planifier + prédire'}
        </button>
      </div>
    </div>
  )
}
