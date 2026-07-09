import { Badge } from '@/components/ui/badge'

const TOP = [
  { date: '12 Jul', type: 'Étudiante', dj: 'DJ Martin', freq: 341, ca: 12400, taux: 97 },
  { date: '24 Aoû', type: 'Latino',    dj: 'DJ Clara',  freq: 329, ca: 11800, taux: 94 },
  { date: '08 Jun', type: 'Techno',    dj: 'DJ Sarah',  freq: 318, ca: 11200, taux: 91 },
  { date: '15 Nov', type: 'Halloween', dj: 'DJ Martin', freq: 350, ca: 14200, taux: 100 },
  { date: '31 Déc', type: 'Nouvel an', dj: 'DJ Emma',   freq: 350, ca: 18600, taux: 100 },
]

export default function TopSoirees() {
  return (
    <div className="space-y-2">
      {TOP.map((s, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
          <div className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{s.date} · {s.type}</div>
            <div className="text-xs text-muted-foreground">{s.dj}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-medium">{s.freq} pers.</div>
            <div className="text-xs text-muted-foreground">{(s.ca / 1000).toFixed(1)}k €</div>
          </div>
          <Badge variant={s.taux === 100 ? 'default' : 'secondary'} className="shrink-0 text-[10px]">
            {s.taux}%
          </Badge>
        </div>
      ))}
    </div>
  )
}
