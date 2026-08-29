'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getTypeAccent } from '@/lib/planning/type-couleurs'
import type { JourPlanning } from '@/hooks/usePlanning'

export default function ModalDetailSoiree({ jour, onClose }: { jour: JourPlanning; onClose: () => void }) {
  const { soiree } = jour
  if (!soiree) return null
  const accent = getTypeAccent(soiree.typeEvenement)
  const dateFormatee = format(new Date(jour.date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent style={{
        background: '#0d0d14',
        border: `1px solid ${accent.color}40`,
        boxShadow: `0 0 40px ${accent.glow}`,
        borderRadius: 20,
        maxWidth: 480,
        padding: 0,
        overflow: 'hidden',
      }}>
        {/* Bande colorée en haut */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${accent.color}, ${accent.color}60)` }} />

        <div style={{ padding: '24px 28px' }}>
          <DialogHeader>
            <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.4)', marginBottom: 4, textTransform: 'capitalize' }}>
              {dateFormatee}
            </div>
            <DialogTitle style={{ color: '#f0f0f8', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{accent.label}</span>
              {soiree.nomEvenement || soiree.typeEvenement}
            </DialogTitle>
            <div style={{ fontSize: 12, color: accent.color, fontWeight: 600, marginTop: 4 }}>
              {soiree.typeEvenement}
            </div>
          </DialogHeader>

          {/* Infos pratiques */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 10, margin: '20px 0',
          }}>
            {soiree.heureOuverture && (
              <InfoBlock label="Horaires" value={`${soiree.heureOuverture} → ${soiree.heureFermeture ?? '—'}`} />
            )}
            {soiree.djNom && <InfoBlock label="DJ" value={soiree.djNom} />}
            {soiree.promotion && <InfoBlock label="Promotion" value={soiree.promotion} colSpan />}
          </div>

          {/* Prévisions */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '16px 18px',
          }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)', marginBottom: 14 }}>
              Prévisions actualisées
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <PrevBlock
                label="Fréquentation"
                actuelle={soiree.predFreqActuelle}
                initiale={soiree.predFreqInitiale}
                variation={soiree.variationFreq24h}
                unite="pers."
                color={accent.color}
              />
              <PrevBlock
                label="CA estimé"
                actuelle={soiree.predCAActuelle}
                initiale={soiree.predCAInitiale}
                variation={soiree.variationCA24h}
                unite="€"
                formatFn={v => `${(v / 1000).toFixed(1)}k`}
                color={accent.color}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoBlock({ label, value, colSpan }: { label: string; value: string; colSpan?: boolean }) {
  return (
    <div style={{ gridColumn: colSpan ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(240,240,248,0.3)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f8' }}>{value}</div>
    </div>
  )
}

function PrevBlock({ label, actuelle, initiale, variation, unite, formatFn, color }: {
  label: string; actuelle: number; initiale?: number; variation?: number
  unite: string; formatFn?: (v: number) => string; color: string
}) {
  const fmt = formatFn ?? ((v: number) => `${v}`)
  const hasVariation = variation != null && Math.abs(variation) >= 1
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(240,240,248,0.3)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 2 }}>
        {fmt(actuelle)} {unite}
      </div>
      {!!initiale && (
        <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.3)' }}>
          Initiale : {fmt(initiale)} {unite}
        </div>
      )}
      {hasVariation && (
        <div style={{
          fontSize: 11, fontWeight: 700, marginTop: 3,
          color: variation! > 0 ? '#4fe882' : '#f09595',
        }}>
          {variation! > 0 ? '▲' : '▼'} {Math.abs(variation!).toFixed(1)}% vs hier
        </div>
      )}
    </div>
  )
}
