'use client'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':   { title: 'Dashboard',            subtitle: 'Vue d\'ensemble des performances' },
  '/analyses':    { title: 'Analyses normalisées', subtitle: 'Classements à conditions équivalentes' },
  '/predicteur':  { title: 'Prédicteur',           subtitle: 'Estimation fréquentation & CA' },
  '/comparateur': { title: 'Comparateur',          subtitle: 'Comparer jusqu\'à 3 scénarios' },
  '/calendrier':  { title: 'Calendrier',           subtitle: 'Planning et performances passées' },
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
