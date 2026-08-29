// Rate-limiter en mémoire, par process. Suffisant pour un déploiement
// mono-instance ; sur du serverless multi-instance (Vercel), chaque instance
// a son propre compteur — pour une limite garantie à l'échelle, remplacer par
// un backend partagé (ex: Upstash Redis).
const hits = new Map<string, number[]>()

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = (hits.get(key) ?? []).filter(t => now - t < windowMs)

  if (timestamps.length >= max) {
    hits.set(key, timestamps)
    return false
  }

  timestamps.push(now)
  hits.set(key, timestamps)
  return true
}
