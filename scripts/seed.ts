import { createClient } from '@supabase/supabase-js'
import { addDays, format, getDay, getWeek } from 'date-fns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const CLUB_ID  = '68da695d-71a8-4689-b59c-9ae127da9999'
const CAPACITE = 350

// ─── Coefficients terrain ────────────────────────────────────────────────────

const COEF_JOUR: Record<number, number> = { 1:0.38, 2:0.44, 3:0.73, 4:1.10, 5:1.52, 6:1.80, 0:0.50 }

// ─── Saisonnalité hebdomadaire ───────────────────────────────────────────────

function construireCoefficientsSaisonniers(): number[] {
  const coef = new Array(52).fill(0)

  // Mapping semaine ISO → mois approximatif (1-12)
  const semaineVersMois = (s: number) => Math.min(12, Math.floor((s - 1) / 52 * 12) + 1)

  // Regroupement semaines par mois
  const moisSemaines: Record<number, number[]> = {}
  for (let m = 1; m <= 12; m++) moisSemaines[m] = []
  for (let s = 0; s < 52; s++) moisSemaines[semaineVersMois(s + 1)].push(s)

  // 1. Base mensuelle
  const coefMensuel: Record<number, number> = {
    1:0.55, 2:0.58, 3:0.65, 4:0.75, 5:0.82, 6:0.95,
    7:1.00, 8:1.00, 9:0.80, 10:0.88, 11:0.68, 12:0.92,
  }
  for (let s = 0; s < 52; s++) coef[s] = coefMensuel[semaineVersMois(s + 1)]

  // 2. Montée progressive début juin → pic mi-août
  const debutMontee = moisSemaines[6][0]
  const semainesAout = moisSemaines[8]
  const pic = semainesAout[Math.floor(semainesAout.length / 2)]
  for (let s = debutMontee; s <= pic; s++) {
    const t = (s - debutMontee) / (pic - debutMontee)
    coef[s] = coefMensuel[semaineVersMois(s + 1)] + t * 0.55
  }

  // 3. Redescente progressive pic → fin septembre
  const finSept = moisSemaines[9][moisSemaines[9].length - 1]
  const valPic  = coef[pic]
  for (let s = pic + 1; s <= finSept; s++) {
    const t = (s - pic) / (finSept - pic)
    coef[s] = valPic - t * (valPic - coefMensuel[semaineVersMois(s + 1)])
  }

  // 4. Dernière semaine de chaque mois : −20%, sauf juin/juillet/août
  for (const [mStr, semaines] of Object.entries(moisSemaines)) {
    if (![6, 7, 8].includes(Number(mStr)))
      coef[semaines[semaines.length - 1]] *= 0.80
  }

  // 5. Vacances scolaires hiver : 2 dernières semaines de février
  moisSemaines[2].slice(-2).forEach(s => { coef[s] *= 0.72 })

  // 6. Vacances scolaires printemps : 2 semaines mi-avril
  const miAvril = Math.floor(moisSemaines[4].length / 2)
  moisSemaines[4].slice(miAvril - 1, miAvril + 1).forEach(s => { coef[s] *= 0.75 })

  return coef
}

const COEF_SAISONNIER_HEBDO = construireCoefficientsSaisonniers()

const COEF_METEO: Record<string, number> = {
  'Soleil':1.18,'Nuageux':1.00,'Pluie légère':0.82,'Forte pluie':0.60,'Froid':0.85,'Canicule':0.88,
}

// Qualité intrinsèque du DJ (indépendante du jour de programmation)
const COEF_DJ_VERITE: Record<string, number> = {
  'DJ Martin': 1.15,
  'DJ Sarah':  1.20,
  'DJ Clara':  1.05, // DJ moyen — son brut sera gonflé par le samedi
  'DJ Noé':    1.10, // DJ correct — son brut sera écrasé par lundi/mardi
  'DJ Emma':   0.95,
  'DJ Alex':   0.90,
  'DJ Lucas':  0.85,
  'Sans DJ':   0.75,
}

// Qualité intrinsèque du type (indépendante du jour de programmation)
const COEF_TYPE_VERITE: Record<string, number> = {
  'Étudiante':    1.30, // bon effet intrinsèque, mais programmé mer/jeu → brut bas
  'Latino':       1.05, // effet correct, programmé ven/sam → brut gonflé
  'Années 80/90': 1.15,
  'House':        1.10,
  'Techno':       1.20,
  'Afterwork':    1.00,
  'Match & DJ set':1.05,
  'Open format':  1.00,
  'Blind test':   0.90,
  'Généraliste':  0.85,
  'Live acoustique':0.88,
  'Karaoké':      0.80,
}

// ─── Courbe d'apprentissage ───────────────────────────────────────────────────

const PRECISION_CIBLE_PAR_INDEX: number[] = [
  65.0, 71.6, 76.9, 81.2, 84.5, 87.2, 89.3, 91.0, 92.4, 93.5, 94.3, 95.0,
]
const STD_BRUIT_PAR_INDEX: number[] = [
  0.4387, 0.3559, 0.2895, 0.2356, 0.1943, 0.1604, 0.1341, 0.1128, 0.0953, 0.0815, 0.0714, 0.0627,
]

// ─── Séquence des 12 mois glissants (basée sur année+mois, robuste) ──────────

const startDate = new Date()
startDate.setDate(1)
startDate.setMonth(startDate.getMonth() - 11)
startDate.setHours(0, 0, 0, 0)

const moisDuSeed: Date[] = []
for (let i = 0; i < 12; i++) {
  const d = new Date(startDate)
  d.setMonth(d.getMonth() + i)
  moisDuSeed.push(d)
}

function getIndexMoisEcoule(date: Date): number {
  for (let i = moisDuSeed.length - 1; i >= 0; i--) {
    const m = moisDuSeed[i]
    if (date.getFullYear() === m.getFullYear() && date.getMonth() === m.getMonth()) return i
  }
  return date < moisDuSeed[0] ? 0 : 11
}

// ─── Données affichage ────────────────────────────────────────────────────────

const JOURS_NOMS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
const METEOS = ['Soleil','Nuageux','Pluie légère','Forte pluie','Froid','Canicule']
const NOMS_PAR_TYPE: Record<string, string> = {
  'Étudiante':'Campus Night','Latino':'Noche Latina','Techno':'Techno Session',
  'Années 80/90':'Disco Fever','House':'Deep House Set','Afterwork':'Afterwork Mix',
  'Match & DJ set':'Fan Zone Party','Open format':'Open Format Club',
  'Blind test':'Quiz Musical','Généraliste':'Bar Dansant','Live acoustique':'Live Acoustique',
  'Karaoké':'Karaoké Night',
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function pickWeighted(weights: Record<string, number>): string {
  const entries = Object.entries(weights)
  const total   = entries.reduce((s, [, w]) => s + w, 0)
  let r         = Math.random() * total
  for (const [k, w] of entries) { r -= w; if (r <= 0) return k }
  return entries[0][0]
}

function randn(mean: number, std: number) {
  const u1 = Math.random(), u2 = Math.random()
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

function avg(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }

// ─── Assignation DJ forcée pour créer un contraste brut/normalisé garanti ─────

function choisirDJ(jourSemaine: number): string {
  const r = Math.random()
  // DJ Clara → quasi-exclusive au samedi (son brut sera élevé, normalisé moyen)
  if (jourSemaine === 6 && r < 0.60) return 'DJ Clara'
  // DJ Noé → quasi-exclusif lundi/mardi (son brut sera bas, normalisé remontera)
  if ([1, 2].includes(jourSemaine) && r < 0.60) return 'DJ Noé'
  // DJ Martin → programmé tous les jours (brut et normalisé alignés)
  return pickWeighted({
    'DJ Martin': 20, 'DJ Sarah': 18, 'DJ Emma': 12,
    'DJ Alex': 10,  'DJ Lucas': 8,  'Sans DJ': 7,
    'DJ Clara': 5,  'DJ Noé': 5,
  })
}

// ─── Assignation type forcée ──────────────────────────────────────────────────

function choisirType(jourSemaine: number): string {
  const r = Math.random()
  // Étudiante → quasi-exclusif mer/jeu (brut bas → normalisé remonte)
  if ([3, 4].includes(jourSemaine) && r < 0.65) return 'Étudiante'
  // Latino → quasi-exclusif ven/sam (brut haut → normalisé redescend)
  if ([5, 6].includes(jourSemaine) && r < 0.55) return 'Latino'

  if ([1, 2].includes(jourSemaine)) {
    return pickWeighted({ 'Karaoké':3,'Blind test':3,'Généraliste':2,'Live acoustique':2,'Afterwork':2 })
  } else if (jourSemaine === 3) {
    return pickWeighted({ 'Open format':3,'Afterwork':2,'House':1 })
  } else if (jourSemaine === 4) {
    return pickWeighted({ 'Afterwork':3,'Match & DJ set':2,'House':1 })
  } else {
    return pickWeighted({ 'Années 80/90':3,'House':3,'Open format':2,'Techno':1 })
  }
}

// ─── Seed principal ────────────────────────────────────────────────────────────

async function seed() {
  const { data: djsData, error: djsError } = await supabase
    .from('djs').select('id, nom').eq('club_id', CLUB_ID)
  if (djsError) { console.error('Erreur lecture DJs:', djsError); return }
  if (!djsData?.length) {
    console.error('Aucun DJ trouvé pour ce club. Insère d\'abord les DJs via le SQL v7.')
    return
  }
  const djMap = Object.fromEntries(djsData.map(d => [d.nom, d.id]))
  console.log('DJs trouvés:', Object.keys(djMap).join(', '))

  const soireesToInsert: any[]   = []
  const resultatsToInsert: any[] = []

  const endDate = new Date()
  let current   = new Date(startDate)

  while (current <= endDate) {
    const jourSemaine = getDay(current)
    const mois        = current.getMonth() + 1

    const ouvre = [4, 5, 6].includes(jourSemaine)
      || ([1, 2, 3].includes(jourSemaine) && Math.random() < 0.55)

    if (ouvre) {
      const djNom = choisirDJ(jourSemaine)
      const type  = choisirType(jourSemaine)
      const meteo = METEOS[Math.floor(Math.random() * METEOS.length)]

      const coefDJ       = COEF_DJ_VERITE[djNom] ?? 1.0
      const coefType     = COEF_TYPE_VERITE[type] ?? 1.0
      const semaineISO   = getWeek(current, { weekStartsOn: 1 })
      const coefSaison   = COEF_SAISONNIER_HEBDO[Math.min(51, semaineISO - 1)]
      const coef         = COEF_JOUR[jourSemaine] * coefSaison * COEF_METEO[meteo] * coefType * coefDJ

      const noise     = randn(1.0, 0.05)
      const freq      = Math.min(Math.round(160 * coef * noise), CAPACITE)
      const caBar     = Math.round(4250 * coef * noise)
      const caEntrees = Math.round(750 * coef * noise)
      const caTotal   = caBar + caEntrees
      const panier    = freq > 0 ? +(caTotal / freq).toFixed(2) : 0

      const tempBase  = mois >= 6 && mois <= 8 ? 25 : mois <= 2 || mois === 12 ? 7 : 15
      const tempC     = +(tempBase + randn(0, 3)).toFixed(1)

      const soireeId  = crypto.randomUUID()
      const dateStr   = format(current, 'yyyy-MM-dd')

      const idx      = getIndexMoisEcoule(current)
      const stdBruit = STD_BRUIT_PAR_INDEX[idx]
      const predFreq = Math.max(0, Math.round(freq * randn(1, stdBruit)))
      const predCA   = Math.max(0, Math.round(caTotal * randn(1, stdBruit)))
      const predScore= Math.min(100, Math.max(0, +(50 + coef * 20).toFixed(1)))

      soireesToInsert.push({
        id:      soireeId, club_id: CLUB_ID,
        dj_id:   djNom === 'Sans DJ' ? null : (djMap[djNom] ?? null),
        date:    dateStr, jour: JOURS_NOMS[jourSemaine],
        type_evenement: type, nom_evenement: NOMS_PAR_TYPE[type] ?? type,
        meteo, temperature_c: tempC,
        concurrence:        pickWeighted({ 'Faible':55, 'Moyenne':32, 'Forte':13 }),
        vacances_scolaires: Math.random() < 0.25,
        veille_ferie:       false,
        evenement_local:    Math.random() < 0.08,
        prix_entree:        [5,6].includes(jourSemaine) && Math.random() < 0.5
                              ? [5,8,10][Math.floor(Math.random()*3)] : 0,
        budget_com:         Math.round(50 + freq * 0.5 + randn(0, 25)),
        staff:              Math.max(2, Math.min(6, Math.round(freq / 60) + 2)),
        heure_ouverture:    '22:00', heure_fermeture: '05:00',
        canal_acquisition:  pickWeighted({ 'Instagram':38,'Bouche-à-oreille':27,'Email/SMS':17,'Affichage':10,'Partenariat étudiant':8 }),
        prediction_freq: predFreq, prediction_ca: predCA,
        prediction_score_global: predScore,
        prediction_calculee_le:  new Date(current).toISOString(),
      })

      resultatsToInsert.push({
        soiree_id:         soireeId,
        freq_reelle:       freq,
        ca_bar:            caBar,
        ca_entrees:        caEntrees,
        panier_moyen:      panier,
        charges_variables: Math.round(150 + freq * 1.2),
        satisfaction:      +Math.min(5, Math.max(2.5, 3.2 + coef * 0.6 + randn(0, 0.2))).toFixed(1),
        nb_avis_google:    Math.floor(Math.random() * 8),
        nb_stories_ig:     Math.floor(Math.random() * 5),
        reach_ig:          Math.round(freq * 15 + randn(0, 300)),
      })
    }

    current = addDays(current, 1)
  }

  // ─── Vérification 1 : Monotonie de la précision ────────────────────────────

  console.log('\n--- Vérification 1 : Monotonie de la précision ---')
  const precisionsParIndex: number[] = []
  for (let idx = 0; idx < 12; idx++) {
    const indices = soireesToInsert
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => getIndexMoisEcoule(new Date(s.date)) === idx)
    if (indices.length === 0) { precisionsParIndex.push(NaN); continue }
    const errs = indices.map(({ s, i }) => {
      const r    = resultatsToInsert[i]
      const caTot = r.ca_bar + r.ca_entrees
      const eFreq = s.prediction_freq ? Math.abs(s.prediction_freq - r.freq_reelle) / r.freq_reelle * 100 : 0
      const eCA   = s.prediction_ca && caTot ? Math.abs(s.prediction_ca - caTot) / caTot * 100 : 0
      return (eFreq + eCA) / 2
    })
    precisionsParIndex.push(+(100 - avg(errs)).toFixed(1))
  }
  console.log('Précisions (index 0-11):', precisionsParIndex.map((p, i) =>
    `M${i+1}:${isNaN(p)?'—':p+'%'}(cible:${PRECISION_CIBLE_PAR_INDEX[i]}%)`).join(' '))
  let monotonieOk = true
  for (let i = 1; i < 12; i++) {
    if (!isNaN(precisionsParIndex[i]) && !isNaN(precisionsParIndex[i - 1])) {
      if (precisionsParIndex[i] < precisionsParIndex[i - 1] - 3) {
        console.error(`  ⚠️ Rupture entre M${i} (${precisionsParIndex[i-1]}%) → M${i+1} (${precisionsParIndex[i]}%)`)
        monotonieOk = false
      }
    }
  }
  console.log(monotonieOk ? '  ✅ Monotonie respectée' : '  ❌ Relancer le seed')

  // ─── Vérification 2 : CA mensuel juillet/août dominants ───────────────────

  console.log('\n--- Vérification 2 : CA mensuel ---')
  const MOIS_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
  const caParMois: number[] = Array(12).fill(0)
  soireesToInsert.forEach((s, i) => {
    const r = resultatsToInsert[i]
    caParMois[new Date(s.date).getMonth()] += r.ca_bar + r.ca_entrees
  })
  console.log('CA total par mois:', caParMois.map((c, i) => `${MOIS_LABELS[i]}:${Math.round(c/1000)}k`).join(' '))
  const caJuillet = caParMois[6], caAout = caParMois[7]
  const maxAutres = Math.max(...caParMois.filter((_, i) => i !== 6 && i !== 7))
  if (caJuillet > maxAutres && caAout > maxAutres) {
    console.log(`  ✅ Juillet (${Math.round(caJuillet/1000)}k) et Août (${Math.round(caAout/1000)}k) dominent (max autres: ${Math.round(maxAutres/1000)}k)`)
  } else {
    console.error(`  ⚠️ Juillet ou Août ne dominent pas — augmenter COEF_SAISONNIER_HEBDO et relancer`)
  }

  // ─── Vérification 3 : Saisonnalité hebdomadaire ───────────────────────────

  console.log('\n--- Vérification 3 : Saisonnalité hebdomadaire ---')
  const parSemaineISO: Record<number, number[]> = {}
  soireesToInsert.forEach((s, i) => {
    const idx = Math.min(51, getWeek(new Date(s.date), { weekStartsOn: 1 }) - 1)
    if (!parSemaineISO[idx]) parSemaineISO[idx] = []
    parSemaineISO[idx].push(resultatsToInsert[i].freq_reelle)
  })
  const lignes: string[] = []
  for (let i = 0; i < 52; i++) {
    const vals = parSemaineISO[i]
    if (!vals) continue
    const moy = vals.reduce((a, b) => a + b, 0) / vals.length
    lignes.push(`S${String(i+1).padStart(2,'0')}:${moy.toFixed(0)}(${vals.length})`)
  }
  console.log(lignes.join(' '))
  const picEntry = Object.entries(parSemaineISO)
    .map(([idx, vals]) => ({ idx: Number(idx), moy: vals.reduce((a,b)=>a+b,0)/vals.length }))
    .sort((a, b) => b.moy - a.moy)[0]
  if (picEntry) console.log(`  Pic détecté semaine ${picEntry.idx + 1} (attendu S30-S35, mi-août)`)

  // ─── Insertion ────────────────────────────────────────────────────────────

  console.log(`\nInsertion de ${soireesToInsert.length} soirées + résultats...`)

  for (let i = 0; i < soireesToInsert.length; i += 50) {
    const { error } = await supabase.from('soirees').insert(soireesToInsert.slice(i, i + 50))
    if (error) { console.error(`Erreur batch soirees [${i}]:`, error.message); return }
    process.stdout.write(`  soirees ${Math.min(i+50, soireesToInsert.length)}/${soireesToInsert.length}\r`)
  }
  console.log('\nSoirées insérées.')

  for (let i = 0; i < resultatsToInsert.length; i += 50) {
    const { error } = await supabase.from('resultats').insert(resultatsToInsert.slice(i, i + 50))
    if (error) { console.error(`Erreur batch resultats [${i}]:`, error.message); return }
    process.stdout.write(`  resultats ${Math.min(i+50, resultatsToInsert.length)}/${resultatsToInsert.length}\r`)
  }
  console.log('\nRésultats insérés.')

  // ─── Recalcul coefficients ────────────────────────────────────────────────

  console.log('Recalcul des coefficients...')
  const { error: rpcError } = await supabase.rpc('recalcul_coefficients', { p_club_id: CLUB_ID })
  if (rpcError) {
    console.warn('RPC recalcul_coefficients non disponible:', rpcError.message)
  }

  // ─── Normalisation propre (ajustée jour/mois/météo) ──────────────────────
  // Le RPC calcule une moyenne brute pour impact_pct — on le remplace par
  // impact = (actual_avg / expected_avg - 1) * 100, où expected est calculé
  // sans le DJ ni le type (bruit de fond jour × mois × météo uniquement).

  console.log('\n--- Normalisation propre des coefficients ---')
  const djIdToNom = Object.fromEntries(djsData.map(d => [d.id, d.nom]))

  type Acc = { freqActual: number[]; freqExpected: number[]; caActual: number[]; caExpected: number[] }
  const djAcc:   Record<string, Acc> = {}
  const typeAcc: Record<string, Acc> = {}

  soireesToInsert.forEach((s, i) => {
    const r          = resultatsToInsert[i]
    const djNom      = s.dj_id ? (djIdToNom[s.dj_id] ?? 'Sans DJ') : 'Sans DJ'
    const typeName   = s.type_evenement
    const jourNum    = getDay(new Date(s.date))
    const meteoCoef  = COEF_METEO[s.meteo] ?? 1.0
    const semISO     = getWeek(new Date(s.date), { weekStartsOn: 1 })
    const coefSaison = COEF_SAISONNIER_HEBDO[Math.min(51, semISO - 1)]
    const expFreq    = 160 * COEF_JOUR[jourNum] * coefSaison * meteoCoef
    const expCA      = 5000 * COEF_JOUR[jourNum] * coefSaison * meteoCoef
    const actFreq    = r.freq_reelle
    const actCA      = r.ca_bar + r.ca_entrees

    if (!djAcc[djNom])   djAcc[djNom]   = { freqActual:[], freqExpected:[], caActual:[], caExpected:[] }
    if (!typeAcc[typeName]) typeAcc[typeName] = { freqActual:[], freqExpected:[], caActual:[], caExpected:[] }

    djAcc[djNom].freqActual.push(actFreq);   djAcc[djNom].freqExpected.push(expFreq)
    djAcc[djNom].caActual.push(actCA);       djAcc[djNom].caExpected.push(expCA)
    typeAcc[typeName].freqActual.push(actFreq); typeAcc[typeName].freqExpected.push(expFreq)
    typeAcc[typeName].caActual.push(actCA);     typeAcc[typeName].caExpected.push(expCA)
  })

  async function updateImpacts(dimension: string, acc: Record<string, Acc>) {
    for (const [valeur, a] of Object.entries(acc)) {
      const avgActFreq  = avg(a.freqActual),  avgExpFreq = avg(a.freqExpected)
      const avgActCA    = avg(a.caActual),    avgExpCA   = avg(a.caExpected)
      const impactFreq  = avgExpFreq > 0 ? +((avgActFreq / avgExpFreq - 1) * 100).toFixed(2) : 0
      const impactCA    = avgExpCA   > 0 ? +((avgActCA   / avgExpCA   - 1) * 100).toFixed(2) : 0
      const { error } = await supabase.from('coefficients')
        .update({ impact_pct_freq: impactFreq, impact_pct_ca: impactCA })
        .eq('club_id', CLUB_ID).eq('dimension', dimension).eq('valeur', valeur)
      if (error) console.warn(`  Erreur update ${dimension} "${valeur}":`, error.message)
    }
  }

  await updateImpacts('dj', djAcc)
  await updateImpacts('type', typeAcc)
  console.log('  Impacts normalisés mis à jour.')

  // ─── Vérification 3 : contraste brut/normalisé ───────────────────────────

  console.log('\n--- Vérification 3 : Contraste brut/normalisé (DJs) ---')
  const { data: brutDJ } = await supabase.from('coefficients')
    .select('valeur,freq_brute_moy').eq('club_id', CLUB_ID).eq('dimension', 'dj')
    .order('freq_brute_moy', { ascending: false })
  const { data: normDJ } = await supabase.from('coefficients')
    .select('valeur,impact_pct_freq').eq('club_id', CLUB_ID).eq('dimension', 'dj')
    .order('impact_pct_freq', { ascending: false })
  console.log('  Brut:', brutDJ?.map((c, i) => `${i+1}.${c.valeur}`).join(' > '))
  console.log('  Norm:', normDJ?.map((c, i) => `${i+1}.${c.valeur}`).join(' > '))
  const rangBrutClara = brutDJ?.findIndex(c => c.valeur === 'DJ Clara') ?? -1
  const rangNormClara = normDJ?.findIndex(c => c.valeur === 'DJ Clara') ?? -1
  const rangBrutNoe   = brutDJ?.findIndex(c => c.valeur === 'DJ Noé')   ?? -1
  const rangNormNoe   = normDJ?.findIndex(c => c.valeur === 'DJ Noé')   ?? -1
  console.log(`  DJ Clara : brut #${rangBrutClara+1} → normalisé #${rangNormClara+1} (écart attendu ≥ 2)`)
  console.log(`  DJ Noé   : brut #${rangBrutNoe+1}   → normalisé #${rangNormNoe+1} (écart attendu ≥ 2)`)
  if (Math.abs(rangBrutClara - rangNormClara) >= 2 && Math.abs(rangBrutNoe - rangNormNoe) >= 2) {
    console.log('  ✅ Contraste brut/normalisé validé')
  } else {
    console.warn('  ⚠️ Contraste encore insuffisant')
  }

  console.log('\n✓ Seed terminé.')
  console.log(`  Soirées : ${soireesToInsert.length} | Résultats : ${resultatsToInsert.length}`)
}

seed().catch(console.error)
