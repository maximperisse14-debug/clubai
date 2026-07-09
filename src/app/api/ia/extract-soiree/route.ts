import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic()

const TYPES_LIST = [
  'Étudiante','Latino','Techno','Années 80/90','House','Afterwork',
  'Match & DJ set','Open format','Blind test','Live acoustique',
  'Généraliste','Karaoké','Fête de la musique','Spéciale Halloween','Nouvel an','Autre',
].join(', ')

function detectMimeType(base64: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  try {
    const header = atob(base64.slice(0, 16))
    if (header.charCodeAt(0) === 0xFF && header.charCodeAt(1) === 0xD8) return 'image/jpeg'
    if (header.startsWith('\x89PNG')) return 'image/png'
    if (header.startsWith('RIFF')) return 'image/webp'
    if (header.startsWith('GIF')) return 'image/gif'
  } catch { /* ignore */ }
  return 'image/jpeg'
}

function buildPrompt(dateLabel: string): string {
  return `Extrais les informations suivantes et renvoie-les en JSON strict (pas de texte avant ou après, pas de balises markdown) :

{
  "nomEvenement": "string — nom exact de la soirée",
  "typeEvenement": "string — parmi uniquement : ${TYPES_LIST}. Choisir le plus proche.",
  "djNom": "string ou null — nom du DJ s'il est mentionné, sinon null",
  "goodies": "string ou null — offres spéciales, consommations offertes, réductions, sinon null",
  "animations": "string ou null — animations, concours, activités spéciales, sinon null",
  "dateDetectee": "string ou null — date si détectable (format YYYY-MM-DD), sinon null"
}

La soirée est prévue le ${dateLabel}. Si une information est absente, mettre null. Ne jamais inventer.`
}

export async function POST(req: Request) {
  const body = await req.json() as {
    imageBase64?: string
    texte?: string
    date?: string
  }

  const { imageBase64, texte, date } = body

  if (!imageBase64 && !texte) {
    return NextResponse.json({ error: 'Image ou texte manquant' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Clé API Anthropic non configurée' }, { status: 500 })
  }

  const dateLabel = date
    ? new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'inconnue'

  const prompt = buildPrompt(dateLabel)

  // Construire le contenu selon le mode image ou texte
  type ContentBlock =
    | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'; data: string } }
    | { type: 'text'; text: string }

  let content: ContentBlock[]

  if (imageBase64) {
    const mediaType = detectMimeType(imageBase64)
    content = [
      {
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: mediaType, data: imageBase64 },
      },
      { type: 'text' as const, text: `Tu analyses une publication Instagram ou affiche de soirée de club.\n\n${prompt}` },
    ]
  } else {
    content = [{
      type: 'text' as const,
      text: `Tu analyses le texte d'une annonce de soirée de club :\n\n---\n${texte}\n---\n\n${prompt}`,
    }]
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content }],
    })

    const raw     = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const extracted = JSON.parse(cleaned)

    return NextResponse.json(extracted)
  } catch (err: any) {
    console.error('[ia/extract-soiree]', err)
    return NextResponse.json({ error: 'Impossible d\'analyser ce contenu.' }, { status: 500 })
  }
}
