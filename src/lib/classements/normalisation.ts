import { createClient } from '@/lib/supabase/client'

export interface LigneClassement {
  rang: number
  valeur: string              // nom du thème, DJ, ou catégorie offre
  score_composite: number     // (impact_freq + impact_ca) / 2 — pour le tri
  impact_freq: number         // impact normalisé fréquentation en %
  impact_ca: number           // impact normalisé CA en %
  freq_brute_moy: number      // fréquentation brute moyenne (non normalisée)
  ca_brut_moy: number         // CA brut moyen (non normalisé)
  nb_soirees: number
  jours_par_semaine: Record<string, number>  // {Lundi: 0, Mardi: 2, ...}
  libelles_complets?: string[]  // pour les offres : liste des libellés réels
}

function joursVides(): Record<string, number> {
  return {
    Lundi: 0, Mardi: 0, Mercredi: 0, Jeudi: 0,
    Vendredi: 0, Samedi: 0, Dimanche: 0,
  }
}

export async function getClassement(
  clubId: string,
  dimension: 'type' | 'dj' | 'offre'
): Promise<LigneClassement[]> {
  if (dimension === 'offre') {
    return getClassementOffres(clubId)
  }

  const supabase = createClient()
  const { data } = await supabase
    .from('coefficients')
    .select('valeur, impact_pct_freq, impact_pct_ca, freq_brute_moy, ca_brut_moy, nb_soirees')
    .eq('club_id', clubId)
    .eq('dimension', dimension)
    .not('impact_pct_freq', 'is', null)

  if (!data) return []

  const champFiltre = dimension === 'type' ? 'type_evenement' : 'dj_nom'

  // Récupérer la distribution par jour de semaine pour chaque valeur
  const resultats = await Promise.all(
    data.map(async (c) => {
      const { data: soirees } = await supabase
        .from('soirees_completes')
        .select('jour')
        .eq('club_id', clubId)
        .eq(champFiltre, c.valeur)
        .not('freq_reelle', 'is', null)

      const joursCount = joursVides()
      soirees?.forEach(s => {
        if (s.jour && s.jour in joursCount) joursCount[s.jour]++
      })

      const scoreComposite = ((c.impact_pct_freq ?? 0) + (c.impact_pct_ca ?? 0)) / 2

      return {
        valeur: c.valeur,
        score_composite: scoreComposite,
        impact_freq: c.impact_pct_freq ?? 0,
        impact_ca: c.impact_pct_ca ?? 0,
        freq_brute_moy: Math.round(c.freq_brute_moy ?? 0),
        ca_brut_moy: Math.round(c.ca_brut_moy ?? 0),
        nb_soirees: c.nb_soirees ?? 0,
        jours_par_semaine: joursCount,
      }
    })
  )

  return resultats
    .sort((a, b) => b.score_composite - a.score_composite)
    .map((r, i) => ({ ...r, rang: i + 1 }))
}

async function getClassementOffres(clubId: string): Promise<LigneClassement[]> {
  const supabase = createClient()

  // Récupérer toutes les soirées avec résultats réels (avec et sans offre :
  // les soirées sans offre servent de référence pour isoler l'effet propre
  // de chaque offre du simple fait qu'elle soit programmée tel ou tel jour)
  const { data: soirees } = await supabase
    .from('soirees_completes')
    .select('offre_categorie, promotion, freq_reelle, ca_total, jour')
    .eq('club_id', clubId)
    .not('freq_reelle', 'is', null)

  if (!soirees || soirees.length === 0) return []

  // Baseline "sans offre" par jour de semaine
  const sansOffre = soirees.filter(s => !s.offre_categorie)
  const baseParJour: Record<string, { freq: number; ca: number }> = {}
  for (const jour of Object.keys(joursVides())) {
    const items = sansOffre.filter(s => s.jour === jour)
    if (items.length === 0) continue
    baseParJour[jour] = {
      freq: items.reduce((s, i) => s + (i.freq_reelle ?? 0), 0) / items.length,
      ca:   items.reduce((s, i) => s + (i.ca_total ?? 0), 0) / items.length,
    }
  }
  const baseGlobale = {
    freq: sansOffre.reduce((s, i) => s + (i.freq_reelle ?? 0), 0) / Math.max(1, sansOffre.length),
    ca:   sansOffre.reduce((s, i) => s + (i.ca_total ?? 0), 0) / Math.max(1, sansOffre.length),
  }

  // Grouper les soirées avec offre par catégorie
  const avecOffre = soirees.filter(s => !!s.offre_categorie)
  const parCategorie: Record<string, typeof avecOffre> = {}
  avecOffre.forEach(s => {
    const cat = s.offre_categorie as string
    if (!parCategorie[cat]) parCategorie[cat] = []
    parCategorie[cat].push(s)
  })

  const resultats = Object.entries(parCategorie).map(([categorie, items]) => {
    const freqBrute = items.reduce((s, i) => s + (i.freq_reelle ?? 0), 0) / items.length
    const caBrut = items.reduce((s, i) => s + (i.ca_total ?? 0), 0) / items.length

    const impacts = items.map(i => {
      const base = (i.jour && baseParJour[i.jour]) || baseGlobale
      return {
        freq: base.freq > 0 ? (i.freq_reelle! - base.freq) / base.freq * 100 : 0,
        ca:   base.ca   > 0 ? (i.ca_total!   - base.ca)   / base.ca   * 100 : 0,
      }
    })
    const impactFreq = impacts.reduce((s, i) => s + i.freq, 0) / impacts.length
    const impactCA   = impacts.reduce((s, i) => s + i.ca,   0) / impacts.length

    const libelles = [...new Set(items.map(i => i.promotion).filter(Boolean))] as string[]

    const joursCount = joursVides()
    items.forEach(s => { if (s.jour && s.jour in joursCount) joursCount[s.jour]++ })

    const scoreComposite = (impactFreq + impactCA) / 2

    return {
      valeur: categorie,
      score_composite: +scoreComposite.toFixed(1),
      impact_freq: +impactFreq.toFixed(1),
      impact_ca: +impactCA.toFixed(1),
      freq_brute_moy: Math.round(freqBrute),
      ca_brut_moy: Math.round(caBrut),
      nb_soirees: items.length,
      jours_par_semaine: joursCount,
      libelles_complets: libelles,
    }
  })

  return resultats
    .sort((a, b) => b.score_composite - a.score_composite)
    .map((r, i) => ({ ...r, rang: i + 1 }))
}
