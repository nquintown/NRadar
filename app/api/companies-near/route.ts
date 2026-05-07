import { NextRequest, NextResponse } from 'next/server'
import { searchSirene } from '@/lib/sirene'
import { calculateDistance } from '@/lib/calculateDistance'
import type { EntityType, EmployeeRangeId } from '@/types/entities'
import { EMPLOYEE_RANGES } from '@/types/entities'

export const dynamic = 'force-dynamic'

/** Derive a 2-char department code from lat/lon via French address reverse-geocoding */
async function deptFromLatLon(lat: number, lon: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}&limit=1`,
      { signal: AbortSignal.timeout(4_000) }
    )
    if (!res.ok) return undefined
    const data = await res.json()
    const postcode: string | undefined = data.features?.[0]?.properties?.postcode
    if (!postcode) return undefined
    const s = postcode.replace(/\s/g, '')
    if (/^2[AB]/i.test(s)) return s.slice(0, 2).toUpperCase()
    return s.slice(0, 2)
  } catch { return undefined }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const centerLat = parseFloat(sp.get('lat') ?? '')
  const centerLon = parseFloat(sp.get('lon') ?? '')
  let department = sp.get('department') ?? undefined
  const type       = (sp.get('type') ?? 'all') as EntityType | 'all'
  const empRangeId = (sp.get('employeeRange') ?? 'all') as EmployeeRangeId | 'all'
  const page       = parseInt(sp.get('page') ?? '1', 10)

  if (isNaN(centerLat) || isNaN(centerLon)) {
    return NextResponse.json({ error: 'Coordonnées invalides' }, { status: 400 })
  }

  // If no department supplied (center has no postcode), derive it from coordinates
  if (!department) {
    department = await deptFromLatLon(centerLat, centerLon)
  }

  let employeeRangeCodes: string[] | undefined
  if (empRangeId !== 'all') {
    const found = EMPLOYEE_RANGES.find(r => r.id === empRangeId)
    if (found) employeeRangeCodes = [...found.sireneCodes]
  }

  try {
    const result = await searchSirene({ type, employeeRangeCodes, department, page, perPage: 25 })

    // Add distance from center and sort closest first
    const withDistance = result.entities
      .filter(e => e.lat != null && e.lon != null)
      .map(e => ({
        ...e,
        distanceKm: Math.round(calculateDistance(centerLat, centerLon, e.lat!, e.lon!) / 100) / 10,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)

    return NextResponse.json({ entities: withDistance, total: result.total })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
