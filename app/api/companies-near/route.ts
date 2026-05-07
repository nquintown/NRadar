import { NextRequest, NextResponse } from 'next/server'
import { searchSirene } from '@/lib/sirene'
import { calculateDistance } from '@/lib/calculateDistance'
import type { EntityType, EmployeeRangeId } from '@/types/entities'
import { EMPLOYEE_RANGES } from '@/types/entities'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const centerLat = parseFloat(sp.get('lat') ?? '')
  const centerLon = parseFloat(sp.get('lon') ?? '')
  const department = sp.get('department') ?? undefined
  const type       = (sp.get('type') ?? 'all') as EntityType | 'all'
  const empRangeId = (sp.get('employeeRange') ?? 'all') as EmployeeRangeId | 'all'
  const page       = parseInt(sp.get('page') ?? '1', 10)

  if (isNaN(centerLat) || isNaN(centerLon)) {
    return NextResponse.json({ error: 'Coordonnées invalides' }, { status: 400 })
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
