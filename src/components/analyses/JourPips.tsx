const JOURS = ['L', 'Ma', 'Me', 'J', 'V', 'S']
const JOURS_COLORS: Record<string, string> = {
  L: '#E24B4A', Ma: '#D85A30', Me: '#f5a623', J: '#30c98e', V: '#534AB7', S: '#a07cff',
}
const JOURS_FULL: Record<string, string> = {
  L: 'Lundi', Ma: 'Mardi', Me: 'Mercredi', J: 'Jeudi', V: 'Vendredi', S: 'Samedi',
}

export default function JourPips({ jours }: { jours: Record<string, number> }) {
  const total = Object.values(jours).reduce((a, b) => a + b, 0) || 1
  return (
    <div className="flex gap-0.5 mt-1">
      {JOURS.map(j => {
        const n = jours[j] ?? 0
        const opacity = n === 0 ? 0.08 : 0.15 + (n / total) * 0.85
        return (
          <div
            key={j}
            title={`${JOURS_FULL[j]}: ${n}`}
            className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold text-white"
            style={{ background: JOURS_COLORS[j], opacity }}
          >
            {j[0]}
          </div>
        )
      })}
    </div>
  )
}
