'use client'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/planning':    { title: 'Planning',             subtitle: 'Soirées planifiées & prévisions' },
  '/planifier':   { title: 'Planifier',            subtitle: 'Créer une soirée ou comparer 3 scénarios' },
  '/assistant':   { title: 'Assistant IA',         subtitle: 'Copilote de programmation' },
  '/dashboard':   { title: 'Dashboard',            subtitle: 'Vue d\'ensemble des performances' },
  '/donnees':     { title: 'Données',              subtitle: 'Historique des soirées' },
  '/reglages':    { title: 'Réglages',             subtitle: 'Configuration du club' },
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const page = PAGE_META[pathname] ?? { title: 'ClubAI', subtitle: '' }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0 border-b"
      style={{ background: 'var(--s1)', borderColor: 'var(--b1)' }}
    >
      <div>
        <div className="font-semibold text-sm" style={{ color: 'var(--t1)' }}>{page.title}</div>
        {page.subtitle && (
          <div className="text-[11px]" style={{ color: 'var(--t3)' }}>{page.subtitle}</div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs" style={{ color: 'var(--t3)' }}>Connecté</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
          style={{ color: 'var(--t3)' }}
        >
          <LogOut size={13} />
          Déconnexion
        </button>
      </div>
    </header>
  )
}
