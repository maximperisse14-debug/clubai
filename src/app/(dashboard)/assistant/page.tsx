'use client'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, Sparkles, BarChart3, TrendingUp, FolderOpen, CalendarDays, type LucideIcon } from 'lucide-react'
import { useClub } from '@/hooks/useClub'

interface Message {
  role: 'user' | 'assistant'
  content: string
  tools_called?: string[]
  loading?: boolean
}

const SUGGESTIONS = [
  "Quelle est la meilleure soirée à planifier samedi prochain ?",
  "Compare Latino vs Techno vendredi 5 septembre",
  "Quel est le gain moyen de DJ Martin ?",
  "Quel type d'événement performe le mieux ?",
  "Prévisions pour la semaine du 1er août",
]

const TOOL_LABELS: Record<string, { icon: LucideIcon; label: string }> = {
  calculer_prevision: { icon: Sparkles, label: 'Calcul prévision' },
  get_coefficients: { icon: BarChart3, label: 'Analyse coefficients' },
  get_hw_forecast: { icon: TrendingUp, label: 'Prévisions HW' },
  get_stats_agregees: { icon: FolderOpen, label: 'Stats agrégées' },
}

export default function AssistantPage() {
  const { data: club } = useClub()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const messageText = text ?? input.trim()
    if (!messageText || loading || !club?.id) return

    setInput('')
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: messageText },
      { role: 'assistant', content: '', loading: true },
    ]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages
            .filter(m => !m.loading)
            .map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()

      setMessages(prev => [
        ...prev.slice(0, -1), // enlever le message loading
        { role: 'assistant', content: data.message ?? data.error ?? 'Erreur inconnue', tools_called: data.tools_called },
      ])
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Une erreur s\'est produite. Réessaie.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--dark)',
    }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px' }}>

        {/* État vide */}
        {messages.length === 0 && (
          <div style={{ maxWidth: 640, margin: '60px auto 0', textAlign: 'center' }}>
            <Bot size={32} style={{ margin: '0 auto 16px', color: 'var(--c2)' }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
              Assistant ClubAI
            </div>
            <div style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 36, lineHeight: 1.6 }}>
              Pose-moi une question sur la programmation de ton club.<br />
              J&apos;utilise le moteur prédictif pour t&apos;aider à prendre les meilleures décisions.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: 'rgba(240,240,248,0.6)',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(123,92,229,0.1)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,92,229,0.3)'
                    ;(e.currentTarget as HTMLElement).style.color = '#f0f0f8'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
                    ;(e.currentTarget as HTMLElement).style.color = 'rgba(240,240,248,0.6)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Liste messages */}
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: 12,
              alignItems: 'flex-start',
            }}>
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #4fa3e8, #7b5ce5)'
                  : 'linear-gradient(135deg, #7b5ce5, #d45fa8)',
                color: '#fff',
              }}>
                {msg.role === 'user' ? (club?.nom?.[0]?.toUpperCase() ?? 'M') : <Bot size={17} />}
              </div>

              {/* Bulle */}
              <div style={{
                maxWidth: '80%',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                background: msg.role === 'user'
                  ? 'rgba(123,92,229,0.15)'
                  : 'var(--s1)',
                border: msg.role === 'user'
                  ? '1px solid rgba(123,92,229,0.25)'
                  : '1px solid rgba(255,255,255,0.07)',
              }}>
                {/* Outils appelés */}
                {msg.tools_called && msg.tools_called.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {msg.tools_called.map((t, idx) => {
                      const toolInfo = TOOL_LABELS[t]
                      return (
                        <span key={`${t}-${idx}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 10, padding: '2px 8px', borderRadius: 4,
                          background: 'rgba(79,163,232,0.12)',
                          border: '1px solid rgba(79,163,232,0.2)',
                          color: '#4fa3e8', fontWeight: 600,
                        }}>
                          {toolInfo && <toolInfo.icon size={11} />} {toolInfo?.label ?? t}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Contenu */}
                {msg.loading ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#7b5ce5',
                        animation: `assistantBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                ) : (
                  <div style={{
                    fontSize: 14,
                    color: msg.role === 'user' ? 'rgba(240,240,248,0.9)' : 'rgba(240,240,248,0.85)',
                    lineHeight: 1.65,
                  }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ children }) => (
                          <div style={{ overflowX: 'auto', margin: '14px 0' }}>
                            <table style={{
                              borderCollapse: 'collapse',
                              width: '100%',
                              fontSize: 13,
                              borderRadius: 10,
                              overflow: 'hidden',
                            }}>
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead style={{ background: 'rgba(123,92,229,0.15)' }}>
                            {children}
                          </thead>
                        ),
                        th: ({ children }) => (
                          <th style={{
                            padding: '10px 14px',
                            textAlign: 'left',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            color: '#a07cff',
                            borderBottom: '1px solid rgba(123,92,229,0.2)',
                            whiteSpace: 'nowrap',
                          }}>
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            color: 'rgba(240,240,248,0.85)',
                            verticalAlign: 'top',
                          }}>
                            {children}
                          </td>
                        ),
                        tr: ({ children }) => (
                          <tr style={{ transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            {children}
                          </tr>
                        ),
                        strong: ({ children }) => (
                          <strong style={{ color: '#c4a8ff', fontWeight: 700 }}>
                            {children}
                          </strong>
                        ),
                        p: ({ children }) => (
                          <p style={{
                            margin: '0 0 10px 0',
                            lineHeight: 1.7,
                            color: 'rgba(240,240,248,0.85)',
                          }}>
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul style={{ margin: '8px 0', paddingLeft: 20, color: 'rgba(240,240,248,0.75)' }}>
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li style={{ margin: '4px 0', lineHeight: 1.6 }}>
                            {children}
                          </li>
                        ),
                        h3: ({ children }) => (
                          <h3 style={{
                            fontSize: 14, fontWeight: 700,
                            color: '#f0f0f8', margin: '14px 0 8px',
                          }}>
                            {children}
                          </h3>
                        ),
                        code: ({ children }) => (
                          <code style={{
                            background: 'rgba(255,255,255,0.08)',
                            padding: '2px 7px',
                            borderRadius: 5,
                            fontSize: 12,
                            fontFamily: 'monospace',
                            color: '#4fa3e8',
                          }}>
                            {children}
                          </code>
                        ),
                        hr: () => (
                          <hr style={{
                            border: 'none',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            margin: '14px 0',
                          }} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {msg.content.includes('Soirée planifiée') && (
                      <a
                        href="/planning"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          marginTop: 12,
                          padding: '10px 18px',
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #4fa3e8, #7b5ce5)',
                          color: '#fff',
                          textDecoration: 'none',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        <CalendarDays size={14} /> Voir dans le planning →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 40px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'var(--dark)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ex: Quelle est la meilleure soirée à planifier samedi prochain ?"
            disabled={loading}
            style={{
              flex: 1,
              padding: '14px 18px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'var(--s1)',
              color: '#f0f0f8',
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(123,92,229,0.4)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              padding: '14px 22px',
              borderRadius: 14,
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              background: input.trim() && !loading ? 'var(--grad)' : 'rgba(255,255,255,0.07)',
              transition: 'all 0.15s',
            }}
          >
            →
          </button>
        </div>
        <div style={{ maxWidth: 760, margin: '8px auto 0', fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
          L&apos;assistant n&apos;a pas accès aux résultats réels — toutes les prévisions passent par le moteur ClubAI
        </div>
      </div>

      <style>{`
        @keyframes assistantBounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
