'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { CalendarDays, PlusCircle, Bot, Trophy, Database, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/planning',     label: 'Planning',     icon: CalendarDays },
  { href: '/planifier',    label: 'Planifier',    icon: PlusCircle },
  { href: '/assistant',    label: 'Assistant IA', icon: Bot },
  { href: '/classements',  label: 'Classements',  icon: Trophy },
  { href: '/donnees',      label: 'Données',      icon: Database },
  { href: '/reglages',     label: 'Réglages',     icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 flex flex-col border-r" style={{
      background: 'var(--s1)',
      borderColor: 'var(--b1)',
    }}>
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--b1)' }}>
        <Image
          src="/clubai-lockup-blanc.png"
          alt="ClubAI"
          width={140}
          height={40}
          style={{ objectFit: 'contain', objectPosition: 'left' }}
          priority
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active ? 'text-white' : 'hover:text-white'
              )}
              style={active ? {
                background: 'rgba(123,92,229,0.15)',
                border: '1px solid rgba(123,92,229,0.25)',
                color: 'var(--t1)',
              } : {
                color: 'var(--t2)',
              }}
            >
              <Icon size={15} style={active ? { color: 'var(--c2)' } : {}} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Badge version */}
      <div className="p-4">
        <div
          className="text-[10px] text-center py-1.5 px-3 rounded-full"
          style={{ background: 'var(--s3)', color: 'var(--t3)' }}
        >
          v1.0 — Club Pilote
        </div>
      </div>
    </aside>
  )
}
