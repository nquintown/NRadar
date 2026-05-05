import type { ShoppingCenter } from '@/types/pois'
import type { Entity, MallProximity, RadiusResult } from '@/types/entities'

export const RADII_KM = [1, 5, 10, 15, 20] as const

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function analyzeProximity(lat: number, lon: number, malls: ShoppingCenter[]): RadiusResult[] {
  const MAX_RADIUS = Math.max(...RADII_KM)

  const withDist: { mall: ShoppingCenter; d: number }[] = []
  for (const mall of malls) {
    const d = haversineKm(lat, lon, mall.lat, mall.lon)
    if (d <= MAX_RADIUS) withDist.push({ mall, d })
  }
  withDist.sort((a, b) => a.d - b.d)

  return RADII_KM.map(r => {
    const inRadius = withDist.filter(({ d }) => d <= r)
    return {
      radiusKm: r,
      count: inRadius.length,
      malls: inRadius.map(({ mall, d }) => ({
        id: mall.id,
        name: mall.name,
        city: mall.city,
        lat: mall.lat,
        lon: mall.lon,
        distanceKm: Math.round(d * 10) / 10,
        detectedBrand: mall.detectedBrand,
      })),
    }
  })
}

// Score 0-100: combines entity size + mall density
export function potentialScore(entity: Entity, radii: RadiusResult[]): number {
  const sizeWeights: Partial<Record<string, number>> = {
    '0-50': 1, '50-100': 2, '100-500': 3,
    '500-1000': 4, '1000-5000': 5, '5000-10000': 6, '10000+': 7,
  }
  const sizeWeight = sizeWeights[entity.employeeRangeId ?? '0-50'] ?? 1

  const at5  = radii.find(r => r.radiusKm === 5)?.count  ?? 0
  const at10 = radii.find(r => r.radiusKm === 10)?.count ?? 0
  const at20 = radii.find(r => r.radiusKm === 20)?.count ?? 0

  // Proximity score: closer = worth more
  const proximityScore = at5 * 3 + (at10 - at5) * 2 + (at20 - at10) * 1
  return Math.min(100, Math.round((proximityScore * sizeWeight) / 8))
}

export function exportToCsv(entities: Array<{ entity: Entity; radii: RadiusResult[]; potentialScore: number }>): string {
  const headers = [
    'Nom', 'Type', 'SIREN', 'Adresse', 'Ville', 'Département', 'CP',
    'Code NAF', 'Activité', 'Effectif', 'Lat', 'Lon',
    'Centres 1km', 'Centres 5km', 'Centres 10km', 'Centres 15km', 'Centres 20km',
    'Score potentiel',
  ]

  const rows = entities.map(({ entity: e, radii, potentialScore: score }) => {
    const count = (km: number) => radii.find(r => r.radiusKm === km)?.count ?? 0
    return [
      e.name, e.type, e.siren ?? '', e.address ?? '', e.city ?? '',
      e.department ?? '', e.postcode ?? '',
      e.nafCode ?? '', e.nafLabel ?? '', e.employeeRangeLabel ?? '',
      e.lat ?? '', e.lon ?? '',
      count(1), count(5), count(10), count(15), count(20),
      score,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`)
  })

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}
