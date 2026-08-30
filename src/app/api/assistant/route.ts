import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { TOOL_DEFINITIONS } from '@/lib/assistant/tool-definitions'
import { buildSystemPrompt } from '@/lib/assistant/system-prompt'
import {
  calculer_prevision,
  get_coefficients,
  get_hw_forecast,
  get_stats_agregees,
  planifier_soiree,
} from '@/lib/assistant/tools'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const anthropic = new Anthropic()

const bodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).min(1).max(50),
})

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }
    const { messages } = parsed.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!rateLimit(`assistant:${user.id}`, 15, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Trop de requêtes, réessaie dans quelques minutes.' }, { status: 429 })
    }

    const { data: club } = await supabase
      .from('clubs')
      .select('id, nom')
      .eq('owner_id', user.id)
      .single()

    if (!club) return NextResponse.json({ error: 'Club introuvable' }, { status: 404 })

    const clubId = club.id

    const systemPrompt = buildSystemPrompt(
      club?.nom ?? 'votre club',
      format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })
    )

    const toolsCalled: string[] = []
    let currentMessages: Anthropic.MessageParam[] = messages

    // Boucle agent — max 5 tours
    for (let tour = 0; tour < 5; tour++) {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 2048,
        system: systemPrompt,
        tools: TOOL_DEFINITIONS as any,
        messages: currentMessages,
      })

      // Réponse finale — plus d'outil à appeler
      if (response.stop_reason === 'end_turn') {
        const text = response.content
          .filter((b: any) => b.type === 'text')
          .map((b: any) => b.text)
          .join('\n')
        return NextResponse.json({ message: text, tools_called: toolsCalled })
      }

      // Réponse tronquée — pas la peine de retenter la même requête
      if (response.stop_reason === 'max_tokens') {
        const text = response.content
          .filter((b: any) => b.type === 'text')
          .map((b: any) => b.text)
          .join('\n')
        return NextResponse.json({
          message: text ? `${text}\n\n(réponse tronquée)` : 'Réponse trop longue, réessaie avec une question plus précise.',
          tools_called: toolsCalled,
        })
      }

      // Appels d'outils
      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter((b: any) => b.type === 'tool_use')

        const toolResults = await Promise.all(
          toolUseBlocks.map(async (block: any) => {
            toolsCalled.push(block.name)
            let result: any

            try {
              const input = { ...block.input }
              switch (block.name) {
                case 'calculer_prevision':
                  result = await calculer_prevision(clubId, input)
                  break
                case 'get_coefficients':
                  result = await get_coefficients(clubId, input)
                  break
                case 'get_hw_forecast':
                  result = await get_hw_forecast(clubId, input)
                  break
                case 'get_stats_agregees':
                  result = await get_stats_agregees(clubId, input)
                  break
                case 'planifier_soiree':
                  result = await planifier_soiree(clubId, input)
                  break
                default:
                  result = { error: 'Outil inconnu' }
              }
            } catch (err) {
              result = { error: err instanceof Error ? err.message : 'Erreur inconnue' }
            }

            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: JSON.stringify(result),
            }
          })
        )

        // Ajouter à l'historique
        currentMessages = [
          ...currentMessages,
          { role: 'assistant' as const, content: response.content },
          { role: 'user' as const, content: toolResults },
        ]
        continue
      }

      // stop_reason inattendu (refusal, pause_turn, stop_sequence...) — pas
      // la peine de renvoyer la même requête en boucle, on s'arrête ici.
      console.error('[assistant] stop_reason inattendu:', response.stop_reason)
      return NextResponse.json({
        message: 'Je n\'ai pas pu terminer ma réponse, réessaie ta question.',
        tools_called: toolsCalled,
      })
    }

    return NextResponse.json({ message: 'Réponse non obtenue après 5 tours.', tools_called: toolsCalled })

  } catch (err) {
    console.error('[assistant]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}