import type { POI } from '@/types/pois'
import { CATEGORY_MAP, getCategoryLabel } from './osmCategories'
import { calculateDistance } from './calculateDistance'

const OVERPASS_ENDPOINTS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]
const TIMEOUT_S = 20

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function buildOverpassQuery(
  lat: number,
  lon: number,
  radius: number,
  categories: string[]
): string {
  const filters = categories.flatMap(key => {
    const cat = CATEGORY_MAP.get(key)
    return cat?.overpassFilters ?? []
  })
  if (!filters.length) throw new Error('Aucune catégorie sélectionnée')

  // Consolidate filters by OSM key into a single regex per key.
  // This reduces ~140 union members to ~14, avoiding Overpass rate limits.
  const byKey = new Map<string, Set<string>>()
  for (const f of new Set(filters)) {
    const kv = f.match(/\["([^"]+)"="([^"]+)"\]/)
    const kr = f.match(/\["([^"]+)"~"([^"]+)"\]/)
    const k  = f.match(/\["([^"]+)"\]$/)
    if (kv) {
      const s = byKey.get(kv[1]) ?? new Set(); s.add(kv[2]); byKey.set(kv[1], s)
    } else if (kr) {
      const s = byKey.get(kr[1]) ?? new Set(); s.add(kr[2]); byKey.set(kr[1], s)
    } else if (k) {
      const s = byKey.get(k[1])  ?? new Set(); s.add('.');    byKey.set(k[1],  s)
    }
  }

  const lines = Array.from(byKey.entries()).flatMap(([key, vals]) => {
    const regex = Array.from(vals).join('|')
    const f = `["${key}"~"${regex}"]`
    return [
      `  node${f}(around:${radius},${lat},${lon});`,
      `  way${f}(around:${radius},${lat},${lon});`,
    ]
  })

  return `[out:json][timeout:${TIMEOUT_S}];
(
${lines.join('\n')}
);
out center tags;`
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:postcode'],
    tags['addr:city'],
  ].filter(Boolean)
  return parts.length >= 2 ? parts.join(' ') : undefined
}

function detectCategory(tags: Record<string, string>, requestedCategories: string[]): string {
  for (const key of requestedCategories) {
    const cat = CATEGORY_MAP.get(key)
    if (!cat) continue
    for (const filter of cat.overpassFilters) {
      // Parse filter: ["k"="v"], ["k"~"regex"], or ["k"]
      const kvMatch = filter.match(/\["([^"]+)"="([^"]+)"\]/)
      const kRegexMatch = filter.match(/\["([^"]+)"~"([^"]+)"\]/)
      const kMatch = filter.match(/\["([^"]+)"\]$/)
      if (kvMatch) {
        const [, k, v] = kvMatch
        if (tags[k] === v) return key
      } else if (kRegexMatch) {
        const [, k] = kRegexMatch
        if (k in tags) return key
      } else if (kMatch) {
        const [, k] = kMatch
        if (k in tags) return key
      }
    }
  }
  return requestedCategories[0] ?? 'shop'
}

export async function searchPOIs(
  lat: number,
  lon: number,
  radius: number,
  categories: string[]
): Promise<POI[]> {
  const query = buildOverpassQuery(lat, lon, radius, categories)
  const encodedQuery = encodeURIComponent(query) // used in POST body

  const fetchOpts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'LocalLeadMap/1.0',
    },
    body: `data=${encodedQuery}`,
    signal: AbortSignal.timeout((TIMEOUT_S + 5) * 1000),
  }

  let res: Response | null = null
  let lastErr = ''
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        res = await fetch(endpoint, fetchOpts)
        if (res.ok) break
        const body = await res.text().catch(() => '')
        lastErr = `${res.status}: ${body.replace(/<[^>]+>/g, ' ').trim().slice(0, 100)}`
        if (res.status === 429 && attempt === 0) {
          await new Promise(r => setTimeout(r, 3000))
          continue
        }
        res = null
        break
      } catch {
        lastErr = `Connexion échouée vers ${endpoint}`
        break
      }
    }
    if (res?.ok) break
    res = null
  }

  if (!res) throw new Error(`Overpass inaccessible — ${lastErr}`)

  const json = await res.json()
  const elements: OverpassElement[] = json.elements ?? []

  const pois: POI[] = elements
    .filter(el => {
      const elLat = el.lat ?? el.center?.lat
      const elLon = el.lon ?? el.center?.lon
      return elLat !== undefined && elLon !== undefined
    })
    .map(el => {
      const tags = el.tags ?? {}
      const elLat = (el.lat ?? el.center!.lat)!
      const elLon = (el.lon ?? el.center!.lon)!
      const category = detectCategory(tags, categories)

      return {
        id: `${el.type}/${el.id}`,
        name: tags.name || tags['name:fr'] || tags.brand || 'Sans nom',
        category,
        categoryLabel: getCategoryLabel(category),
        lat: elLat,
        lon: elLon,
        distance: Math.round(calculateDistance(lat, lon, elLat, elLon)),
        address: buildAddress(tags),
        phone: tags.phone || tags['contact:phone'],
        website: tags.website || tags['contact:website'],
        openingHours: tags.opening_hours,
      }
    })
    .filter(poi => poi.name !== 'Sans nom' || poi.phone || poi.website)
    .sort((a, b) => a.distance - b.distance)

  // Deduplicate by proximity + name
  const seen = new Set<string>()
  return pois.filter(poi => {
    const key = `${poi.name.toLowerCase()}-${Math.round(poi.lat * 1000)}-${Math.round(poi.lon * 1000)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
