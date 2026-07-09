interface Props {
  label: string
  value: string
  subtext: string
  trend?: number | null
  highlight?: boolean
  moisPrecedent?: string
  accent?: string
  icon?: string
}

export default function MetricCard({
  label, value, subtext, trend, highlight, moisPrecedent = 'mois préc.', accent, icon,
}: Props) {
  const valueColor = highlight
    ? undefined   // gradient via class
    : accent ?? 'var(--t1)'

  return (
    <div
      className="rounded-2xl p-5 transition-colors relative overflow-hidden"
      style={{ background: 'var(--s2)', border: '1px solid var(--b1)', boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}
    >
      {/* Barre gradient signature */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'var(--grad)' }} />

      <div className="flex items-start justify-between mb-3">
        <div
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--t3)' }}
        >
          {label}
        </div>
        {icon && <span className="text-base">{icon}</span>}
      </div>

      {highlight ? (
        <div className="text-2xl font-extrabold mb-1 tabular-nums text-grad">{value}</div>
      ) : (
        <div className="text-2xl font-extrabold mb-1 tabular-nums" style={{ color: valueColor }}>
          {value}
        </div>
      )}

      <div className="text-[11px]" style={{ color: 'var(--t3)' }}>{subtext}</div>

      {trend != null && (
        <div
          className="mt-2.5 text-[11px] font-bold inline-flex items-center gap-1 px-2 py-1 rounded-full"
          style={{
            color:      trend >= 0 ? '#4fe882' : '#f09595',
            background: trend >= 0 ? 'rgba(79,232,130,0.1)' : 'rgba(240,149,74,0.1)',
          }}
        >
          {trend >= 0 ? '▲' : '▼'} {trend >= 0 ? '+' : ''}{trend.toFixed(1).replace('.', ',')}% vs {moisPrecedent}
        </div>
      )}
    </div>
  )
}
