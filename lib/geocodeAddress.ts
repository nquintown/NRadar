import type { GeocodeResult } from '@/types/pois'

// French government address API — faster for French addresses
async function geocodeFrench(address: string): Promise<GeocodeResult | null> {
  try {
    const params = new URLSearchParams({ q: address, limit: '1' })
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?${params}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const feature = data?.features?.[0]
    if (!feature) return null
    const [lon, lat] = feature.geometry.coordinates as [number, number]
    return { lat, lon, displayName: feature.properties.label }
  } catch {
    return null
  }
}

async function geocodeNominatim(address: string): Promise<GeocodeResult | null> {
  try {
    const params = new URLSearchParams({ q: address, format: 'json', limit: '1' })
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: { 'User-Agent': 'LocalLeadMap/1.0 (contact@localleadmap.fr)' },
        signal: AbortSignal.timeout(10000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.length) return null
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    }
  } catch {
    return null
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const french = await geocodeFrench(address)
  if (french) return french

  const nominatim = await geocodeNominatim(address)
  if (nominatim) return nominatim

  throw new Error(`Adresse introuvable : « ${address} »`)
}
