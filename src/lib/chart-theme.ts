export const CHART_COLORS = {
  c1:    '#4fa3e8',
  c2:    '#7b5ce5',
  c3:    '#d45fa8',
  c4:    '#f0954a',
  green: '#4fe882',
  red:   '#f09595',
}

export const CHART_DEFAULTS = {
  gridStyle: {
    stroke: 'rgba(255,255,255,0.04)',
    strokeDasharray: '3 3' as const,
  },
  axisStyle: {
    tick: { fill: 'rgba(240,240,248,0.35)', fontSize: 11 },
    axisLine: false as const,
    tickLine: false as const,
  },
  tooltipStyle: {
    contentStyle: {
      background: '#1a1a2e',
      border: '1px solid rgba(255,255,255,0.13)',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    labelStyle: { color: 'rgba(240,240,248,0.48)', fontSize: 11, marginBottom: 4 },
    itemStyle:  { color: '#f0f0f8', fontSize: 12, fontWeight: 600 },
    cursor:     { fill: 'rgba(255,255,255,0.04)' },
  },
}
