import {
  Music2, Zap, GraduationCap, Disc, Headphones, Martini,
  Trophy, Music, HelpCircle, Guitar, PartyPopper, Mic2, Sparkles,
  type LucideIcon,
} from 'lucide-react'

export const TYPE_ACCENT: Record<string, { color: string; glow: string; icon: LucideIcon }> = {
  'Latino':         { color: '#f472b6', glow: 'rgba(244,114,182,0.25)', icon: Music2 },
  'Techno':         { color: '#818cf8', glow: 'rgba(129,140,248,0.25)', icon: Zap },
  'Étudiante':      { color: '#38bdf8', glow: 'rgba(56,189,248,0.25)',  icon: GraduationCap },
  'Années 80/90':   { color: '#fb923c', glow: 'rgba(251,146,60,0.25)',  icon: Disc },
  'House':          { color: '#a78bfa', glow: 'rgba(167,139,250,0.25)', icon: Headphones },
  'Afterwork':      { color: '#34d399', glow: 'rgba(52,211,153,0.25)',  icon: Martini },
  'Match & DJ set': { color: '#fbbf24', glow: 'rgba(251,191,36,0.25)',  icon: Trophy },
  'Open format':    { color: '#4fa3e8', glow: 'rgba(79,163,232,0.25)',  icon: Music },
  'Blind test':     { color: '#f87171', glow: 'rgba(248,113,113,0.25)', icon: HelpCircle },
  'Live acoustique':{ color: '#86efac', glow: 'rgba(134,239,172,0.25)', icon: Guitar },
  'Généraliste':    { color: '#94a3b8', glow: 'rgba(148,163,184,0.25)', icon: PartyPopper },
  'Karaoké':        { color: '#e879f9', glow: 'rgba(232,121,249,0.25)', icon: Mic2 },
}

export function getTypeAccent(type: string) {
  return TYPE_ACCENT[type] ?? { color: '#7b5ce5', glow: 'rgba(123,92,229,0.25)', icon: Sparkles }
}
