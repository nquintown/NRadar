import type { ShoppingCenter } from '@/types/pois'
import { resolveRegion } from './regions'
import { detectMallBrand } from './mallBrands'

const ENDPOINTS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

// Use France administrative area filter — much more accurate than bbox
const QUERY = `[out:json][timeout:60];
area["ISO3166-1"="FR"]["admin_level"="2"]->.fr;
(
  way["shop"="mall"](area.fr);
  way["building"="mall"](area.fr);
  way["shop"="department_store"]["name"~".",i](area.fr);
  node["shop"="mall"](area.fr);
  node["building"="mall"](area.fr);
);
out center tags;`

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// Metropolitan France lat/lon bounds — filters out DOM-TOM
const META_FR = {
  latMin: 41.3, latMax: 51.2,
  lonMin: -5.2, lonMax: 9.7,
}

function inMetropolitanFrance(lat: number, lon: number): boolean {
  return (
    lat >= META_FR.latMin && lat <= META_FR.latMax &&
    lon >= META_FR.lonMin && lon <= META_FR.lonMax
  )
}

async function tryFetch(endpoint: string): Promise<OverpassElement[]> {
  const url = `${endpoint}?data=${encodeURIComponent(QUERY)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LocalLeadMap/1.0' },
    signal: AbortSignal.timeout(65_000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status} — ${body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150)}`)
  }
  const json = await res.json()
  if (!Array.isArray(json.elements)) throw new Error('Réponse Overpass invalide')
  return json.elements
}

export async function fetchShoppingCenters(): Promise<ShoppingCenter[]> {
  let lastError = 'Aucun serveur contacté'

  for (const endpoint of ENDPOINTS) {
    try {
      const elements = await tryFetch(endpoint)

      const centers: ShoppingCenter[] = []
      const seen = new Set<string>()

      for (const el of elements) {
        const lat = el.lat ?? el.center?.lat
        const lon = el.lon ?? el.center?.lon
        const name = el.tags?.name

        if (lat === undefined || lon === undefined || !name) continue
        if (!inMetropolitanFrance(lat, lon)) continue

        const dedupeKey = `${name.toLowerCase().replace(/\s+/g, '')}-${Math.round(lat * 100)}-${Math.round(lon * 100)}`
        if (seen.has(dedupeKey)) continue
        seen.add(dedupeKey)

        const tags = el.tags!
        const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ')

        centers.push({
          id: `${el.type}/${el.id}`,
          name,
          lat,
          lon,
          city: tags['addr:city'],
          postcode: tags['addr:postcode'],
          address: street || undefined,
          brand: tags.brand,
          operator: tags.operator,
          website: tags.website || tags['contact:website'],
          openingHours: tags.opening_hours,
          region: resolveRegion(tags['addr:postcode'], lat, lon),
          detectedBrand: detectMallBrand(name, tags.brand, tags.operator),
        })
      }

      return centers.sort((a, b) => (a.city ?? '').localeCompare(b.city ?? '', 'fr'))
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
  }

  throw new Error(`Serveurs Overpass inaccessibles — ${lastError}`)
}
