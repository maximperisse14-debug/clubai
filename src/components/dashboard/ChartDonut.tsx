'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const DATA = [
  { name: 'Vendredi', value: 38, color: '#a07cff' },
  { name: 'Samedi', value: 31, color: '#30c98e' },
  { name: 'Jeudi', value: 18, color: '#f5a623' },
  { name: 'Autres', value: 13, color: '#888780' },
]

export default function ChartDonut() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
          {DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
          formatter={(v) => [`${v}%`, '']}
        />
        <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
