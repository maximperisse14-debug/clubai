import {
  COEFF_METEO_REGION,
  COEFF_METEO_TYPE_LIEU,
  COEFF_METEO_ACCESSIBILITE,
} from './coeffs-meteo'

export interface MeteoBrute {
  pluie: number  // 0-100 probabilité/intensité
  vent: number   // 0-100
  soleil: number // 0-100
}

export interface MeteoInput {
  region: string
  typeLieu: string
  accessibilite: string
}

const DEFAULT_METEO: MeteoBrute = { pluie: 20, vent: 20, soleil: 60 }

function toYMD(d: Date): string {
  return d.toISOString().split('T')[0]
}

interface OpenMeteoForecastResponse {
  daily: {
    time: string[]
    precipitation_probability_max: number[]
    windspeed_10m_max: number[]
    weathercode: number[]
  }
}

interface OpenMeteoArchiveResponse {
  daily: {
    time: string[]
    precipitation_sum: number[]
    windspeed_10m_max: number[]
    weathercode: number[]
  }
}

function weathercodeToSoleil(code: number): number {
  // WMO weather codes: 0=clear, 1-3=partly cloudy, 4-9=fog, 10-19=drizzle, 20-29=rain, etc.
  if (code === 0) return 100
  if (code <= 2)  return 80
  if (code <= 3)  return 60
  if (code <= 49) return 40  // fog/haze
  if (code <= 69) return 20  // rain/drizzle
  if (code <= 79) return 30  // snow
  if (code <= 84) return 15  // showers
  return 10                  // thunderstorm
}

async function fetchForecast(lat: number, lon: number, date: Date): Promise<MeteoBrute | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_probability_max,windspeed_10m_max,weathercode&timezone=Europe%2FParis`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data: OpenMeteoForecastResponse = await res.json()
    const targetYMD = toYMD(date)
    const idx = data.daily.time.indexOf(targetYMD)
    if (idx === -1) return null
    return {
      pluie:  data.daily.precipitation_probability_max[idx] ?? 20,
      vent:   Math.min(100, (data.daily.windspeed_10m_max[idx] ?? 15) * 1.2),
      soleil: weathercodeToSoleil(data.daily.weathercode[idx] ?? 0),
    }
  } catch {
    return null
  }
}

async function fetchHistoricalAverage(lat: number, lon: number, date: Date): Promise<MeteoBrute | null> {
  try {
    const moisJour = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    // Récupère les 20 dernières années du même jour calendaire
    const years = Array.from({ length: 20 }, (_, i) => date.getFullYear() - 1 - i)
    const requests = years.map(y => {
      const ymd = `${y}-${moisJour}`
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${ymd}&end_date=${ymd}&daily=precipitation_sum,windspeed_10m_max,weathercode&timezone=Europe%2FParis`
      return fetch(url, { next: { revalidate: 86400 } }).then(r => r.ok ? r.json() as Promise<OpenMeteoArchiveResponse> : null).catch(() => null)
    })
    const results = await Promise.all(requests)
    const valid = results.filter((r): r is OpenMeteoArchiveResponse => r !== null && r.daily?.weathercode?.[0] !== undefined)
    if (valid.length === 0) return null

    const avgPrecip = valid.reduce((s, r) => s + (r.daily.precipitation_sum[0] ?? 0), 0) / valid.length
    const avgWind   = valid.reduce((s, r) => s + (r.daily.windspeed_10m_max[0] ?? 15), 0) / valid.length
    const avgCode   = Math.round(valid.reduce((s, r) => s + (r.daily.weathercode[0] ?? 0), 0) / valid.length)

    return {
      pluie:  Math.min(100, avgPrecip * 5),
      vent:   Math.min(100, avgWind * 1.2),
      soleil: weathercodeToSoleil(avgCode),
    }
  } catch {
    return null
  }
}

export async function getMeteoPourDate(lat: number, lon: number, date: Date): Promise<MeteoBrute> {
  const horizonMax = new Date(Date.now() + 16 * 86400000)
  if (date <= horizonMax) {
    const forecast = await fetchForecast(lat, lon, date)
    if (forecast) return forecast
  } else {
    const historical = await fetchHistoricalAverage(lat, lon, date)
    if (historical) return historical
  }
  return DEFAULT_METEO
}

export function calculerScoreMeteo(input: MeteoInput, meteoBrute: MeteoBrute): number {
  const cr  = COEFF_METEO_REGION[input.region]           ?? { pluie: 1, vent: 1, soleil: 1 }
  const ct  = COEFF_METEO_TYPE_LIEU[input.typeLieu]      ?? { pluie: 1, vent: 1, soleil: 1 }
  const ca  = COEFF_METEO_ACCESSIBILITE[input.accessibilite] ?? { pluie: 1, vent: 1, soleil: 1 }

  const ssPluie  = 100 - (meteoBrute.pluie  * cr.pluie  * ct.pluie  * ca.pluie)
  const ssVent   = 100 - (meteoBrute.vent   * cr.vent   * ct.vent   * ca.vent)
  const ssSoleil = Math.min(100, meteoBrute.soleil * cr.soleil * ct.soleil * ca.soleil)

  const score = ssPluie * 0.35 + ssVent * 0.25 + ssSoleil * 0.40
  return Math.max(0, Math.min(100, score))
}
