export interface EtudeConcurrence {
  directs_petites:   number
  directs_moyennes:  number
  directs_grosses:   number
  lointains_petites:   number
  lointains_moyennes:  number
  lointains_grosses:   number
}

export interface ConcurrenceInput {
  typeEtablissement: 'bar' | 'discotheque'
  idxPopulation: number
  directs:  { petites: number; moyennes: number; grosses: number }
  lointains:{ petites: number; moyennes: number; grosses: number }
  bucketJour: 'semaine_hors_veille_ferie' | 'weekend_ou_veille_ferie'
}

const ALPHA = { petite: 0.3, moyenne: 0.6, grosse: 0.9 }
const COEFF_DIRECT   = 25
const COEFF_LOINTAIN = 15

interface Buckets { x_p: number; x_m: number; x_g: number; y_p: number; y_m: number; y_g: number }

const TABLE_XY: Record<string, Record<string, Buckets>> = {
  bar: {
    semaine_hors_veille_ferie: { x_p:1, x_m:0, x_g:0, y_p:0, y_m:0, y_g:0 },
    weekend_ou_veille_ferie:   { x_p:2, x_m:1, x_g:0, y_p:1, y_m:0, y_g:0 },
  },
  discotheque: {
    semaine_hors_veille_ferie: { x_p:1, x_m:1, x_g:0, y_p:0, y_m:0, y_g:0 },
    weekend_ou_veille_ferie:   { x_p:2, x_m:1, x_g:1, y_p:1, y_m:1, y_g:0 },
  },
}

export function calculerScoreConcurrence(input: ConcurrenceInput): number {
  const table = TABLE_XY[input.typeEtablissement]?.[input.bucketJour]
  if (!table) return 50

  const volumeDirects =
    input.directs.petites  * ALPHA.petite  * table.x_p +
    input.directs.moyennes * ALPHA.moyenne * table.x_m +
    input.directs.grosses  * ALPHA.grosse  * table.x_g

  const volumeLointains =
    input.lointains.petites  * ALPHA.petite  * table.y_p +
    input.lointains.moyennes * ALPHA.moyenne * table.y_m +
    input.lointains.grosses  * ALPHA.grosse  * table.y_g

  const pressionBrute     = (volumeDirects * COEFF_DIRECT / 10) + (volumeLointains * COEFF_LOINTAIN / 10)
  const pressionNormalisee = pressionBrute / input.idxPopulation

  return Math.max(0, Math.min(100, 100 - pressionNormalisee))
}
