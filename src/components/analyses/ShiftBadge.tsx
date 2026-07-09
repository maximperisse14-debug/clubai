export default function ShiftBadge({ shift }: { shift: number }) {
  if (Math.abs(shift) < 1) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">=</span>
    )
  }
  return shift > 0 ? (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold shrink-0 whitespace-nowrap">
      ↑{shift} vs brut
    </span>
  ) : (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold shrink-0 whitespace-nowrap">
      ↓{Math.abs(shift)} vs brut
    </span>
  )
}
