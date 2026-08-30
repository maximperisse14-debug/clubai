'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[error boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-bold text-foreground">Une erreur est survenue</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Quelque chose s&apos;est mal passé. Tu peux réessayer, ou recharger la page si le problème persiste.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <Button variant="outline" onClick={() => window.location.assign('/planning')}>
          Retour à l&apos;accueil
        </Button>
      </div>
    </div>
  )
}
