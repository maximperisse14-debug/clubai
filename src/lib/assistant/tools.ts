import { createClient } from '@/lib/supabase/server'
import { calculerPredictionComplete } from '@/lib/predicteur/scoring-engine'
import { getHWForecastForDate } from '@/lib/analytics/hw-daily-data'
import { joursOuvertureVersGetDay } from '@/lib/planning/jours'
import { format, parseISO, eachDayOfInterval, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'

const JOURS_NOM: Record<number, string> = {
  0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
}

function formatPct(n: number | null | undefined): string {
  if (n == null) return 'N/A'
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`
}

function getScoreLabel(score: number): string {
  if (score >= 85) return '⚡ Soirée forte'
  if (score >= 70) return '✦ Bonne soirée'
  if (score >= 50) return '◎ Soirée correcte'
  if (score >= 30) return '↓ Soirée faible'
  return '✕ Déconseillée'
}

// ── Outil 1 — Calculer une prévision ─────────────────────────
export async function calculer_prevision(clubId: string, params: {
  date: string          // 'YYYY-MM-DD'
  type_evenement: string
  dj_nom?: string
}) {
  const supabase = await createClient()
  const date = parseISO(params.date)

  const [{ data: club }, { data: coefficients }] = await Promise.all([
    supabase.from('clubs').select('capacite').eq('id', clubId).single(),
    supabase.from('coefficients').select('dimension, valeur, impact_pct_freq, nb_soirees').eq('club_id', clubId),
  ])

  let djId: string | null = null
  if (params.dj_nom) {
    const { data: dj } = await supabase
      .from('djs')
      .select('id, nom')
      .eq('club_id', clubId)
      .ilike('nom', `%${params.dj_nom}%`)
      .maybeSingle()
    djId = dj?.id ?? null
  }

  const result = await calculerPredictionComplete(
    {
      clubId,
      date,
      typeEvenement: params.type_evenement,
      djId,
      djNom: params.dj_nom ?? null,
    },
    { club_id: clubId, capacite: club?.capacite ?? 350 },
    coefficients ?? [],
  )

  const dateLabel = format(date, 'EEEE d MMMM yyyy', { locale: fr })

  return {
    date: dateLabel,
    type_evenement: params.type_evenement,
    dj: params.dj_nom ?? 'Sans DJ',
    frequentation_estimee: result.frequentationEstimee,
    ca_estime: result.caEstime,
    ca_estime_format: `${(result.caEstime / 1000).toFixed(1)}k€`,
    score_theme: result.scoreTheme,
    label_score: getScoreLabel(result.scoreTheme),
    hw_base: result.hwBase?.freq ?? null,
    coeff_theme: result.coeff,
  }
}

// ── Outil 2 — Obtenir les coefficients d'impact ───────────────
export async function get_coefficients(clubId: string, params: {
  dimension: 'dj' | 'type'
  valeur?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('coefficients')
    .select('valeur, impact_pct_freq, impact_pct_ca, nb_soirees')
    .eq('club_id', clubId)
    .eq('dimension', params.dimension)
    .order('impact_pct_freq', { ascending: false })

  if (params.valeur) {
    query = query.ilike('valeur', `%${params.valeur}%`)
  }

  const { data } = await query

  return {
    dimension: params.dimension,
    resultats: (data ?? []).map(c => ({
      nom: c.valeur,
      impact_frequentation: formatPct(c.impact_pct_freq),
      impact_ca: formatPct(c.impact_pct_ca),
      nb_soirees_analysees: c.nb_soirees,
    })),
    note: 'Ces impacts sont normalisés — ils représentent l\'effet propre du DJ/type, indépendamment du jour et de la saison.',
  }
}

// ── Outil 3 — Obtenir les prévisions HW sur une période ───────
export async function get_hw_forecast(clubId: string, params: {
  date_debut: string  // 'YYYY-MM-DD'
  date_fin: string
}) {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('club_settings')
    .select('jours_ouverture')
    .eq('club_id', clubId)
    .single()

  const joursOuvertureGetDay = joursOuvertureVersGetDay(
    settings?.jours_ouverture ?? ['Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  )

  const jours = eachDayOfInterval({
    start: parseISO(params.date_debut),
    end: parseISO(params.date_fin),
  }).filter(d => joursOuvertureGetDay.includes(getDay(d)))

  const previsions = jours.map(d => {
    const hw = getHWForecastForDate(d)
    return {
      date: format(d, 'EEE d MMM', { locale: fr }),
      jour: JOURS_NOM[getDay(d)],
      freq_base: hw.freq,
      ca_base: `${(hw.ca / 1000).toFixed(1)}k€`,
      ic_freq: `${hw.freqLow} – ${hw.freqHigh} pers.`,
    }
  })

  return {
    periode: `${params.date_debut} → ${params.date_fin}`,
    nb_jours_ouverts: previsions.length,
    previsions,
    note: 'Ce sont les prévisions de base (thème neutre). Le CA/fréq réels dépendront du thème et du DJ programmé.',
  }
}

// ── Outil 4 — Statistiques agrégées historiques ───────────────
// NE retourne JAMAIS freq_reelle ou ca_total individuels
// Uniquement des moyennes et tendances agrégées
export async function get_stats_agregees(clubId: string, params: {
  type_evenement?: string
  dj_nom?: string
}) {
  const supabase = await createClient()

  const { data: coefType } = await supabase
    .from('coefficients')
    .select('valeur, impact_pct_freq, impact_pct_ca, nb_soirees, freq_brute_moy')
    .eq('club_id', clubId)
    .eq('dimension', 'type')
    .ilike('valeur', params.type_evenement ? `%${params.type_evenement}%` : '%')

  const { data: coefDJ } = params.dj_nom ? await supabase
    .from('coefficients')
    .select('valeur, impact_pct_freq, impact_pct_ca, nb_soirees, freq_brute_moy')
    .eq('club_id', clubId)
    .eq('dimension', 'dj')
    .ilike('valeur', `%${params.dj_nom}%`) : { data: null }

  return {
    type_evenement: coefType?.[0] ? {
      nom: coefType[0].valeur,
      impact_moyen_frequentation: formatPct(coefType[0].impact_pct_freq),
      frequentation_moyenne_brute: Math.round(coefType[0].freq_brute_moy ?? 0),
      nb_soirees_historiques: coefType[0].nb_soirees,
    } : null,
    dj: coefDJ?.[0] ? {
      nom: coefDJ[0].valeur,
      impact_moyen_frequentation: formatPct(coefDJ[0].impact_pct_freq),
      nb_soirees_historiques: coefDJ[0].nb_soirees,
    } : null,
    note: 'Données agrégées sur l\'ensemble de l\'historique du club. Les résultats individuels ne sont pas accessibles.',
  }
}

// ── Outil 5 — Planifier une soirée ───────────────────────────
// Appelé UNIQUEMENT après confirmation explicite de l'utilisateur
export async function planifier_soiree(clubId: string, params: {
  date: string           // 'YYYY-MM-DD' — doit être dans le futur
  type_evenement: string
  nom_evenement?: string
  dj_nom?: string
  heure_ouverture?: string   // format 'HH:MM' ex: '22:00'
  heure_fermeture?: string   // format 'HH:MM' ex: '05:00'
  promotion?: string
}) {
  const dateSoiree = parseISO(params.date)
  const aujourdHui = new Date()
  aujourdHui.setHours(0, 0, 0, 0)

  if (dateSoiree < aujourdHui) {
    return {
      succes: false,
      erreur: 'Impossible de planifier une soirée dans le passé.',
    }
  }

  const supabase = await createClient()

  const [{ data: club }, { data: coefficients }] = await Promise.all([
    supabase.from('clubs').select('capacite').eq('id', clubId).single(),
    supabase.from('coefficients').select('dimension, valeur, impact_pct_freq, nb_soirees').eq('club_id', clubId),
  ])

  let djId: string | null = null
  if (params.dj_nom) {
    const { data: dj } = await supabase
      .from('djs')
      .select('id, nom')
      .eq('club_id', clubId)
      .ilike('nom', `%${params.dj_nom}%`)
      .maybeSingle()
    djId = dj?.id ?? null
  }

  let predFreq: number | null = null
  let predCA: number | null = null
  try {
    const result = await calculerPredictionComplete(
      {
        clubId,
        date: dateSoiree,
        typeEvenement: params.type_evenement,
        djId,
        djNom: params.dj_nom ?? null,
        nomEvenement: params.nom_evenement ?? params.type_evenement,
      },
      { club_id: clubId, capacite: club?.capacite ?? 350 },
      coefficients ?? [],
    )
    predFreq = result.frequentationEstimee
    predCA = result.caEstime
  } catch {
    // Prévision non calculée (ex: jour non ouvert) — on insère quand même la soirée
  }

  const { data: soiree, error } = await supabase
    .from('soirees')
    .insert({
      club_id: clubId,
      date: params.date,
      jour: JOURS_NOM[getDay(dateSoiree)],
      nom_evenement: params.nom_evenement || params.type_evenement,
      type_evenement: params.type_evenement,
      dj_id: djId,
      heure_ouverture: params.heure_ouverture ?? '22:00',
      heure_fermeture: params.heure_fermeture ?? '05:00',
      promotion: params.promotion ?? null,
      prediction_freq: predFreq,
      prediction_ca: predCA,
    })
    .select()
    .single()

  if (error) {
    return {
      succes: false,
      erreur: error.message,
    }
  }

  return {
    succes: true,
    soiree_id: soiree.id,
    recap: {
      nom: params.nom_evenement || params.type_evenement,
      type: params.type_evenement,
      dj: params.dj_nom ?? 'Sans DJ',
      date: format(dateSoiree, 'EEEE d MMMM yyyy', { locale: fr }),
      horaires: `${params.heure_ouverture ?? '22:00'} → ${params.heure_fermeture ?? '05:00'}`,
      promotion: params.promotion ?? null,
      frequentation_estimee: predFreq,
      ca_estime: predCA ? `${(predCA / 1000).toFixed(1)}k€` : null,
    },
    message: '✅ Soirée planifiée avec succès ! Elle est maintenant visible dans ton planning.',
  }
}
