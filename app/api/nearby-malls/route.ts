import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { analyzeProximity, potentialScore } from '@/lib/proximity'
import type { ShoppingCenter } from '@/types/pois'
import type { Entity } from '@/types/entities'

export const dynamic = 'force-dynamic'

// Load malls once per cold start
let _malls: ShoppingCenter[] | null = null
function getMalls(): ShoppingCenter[] {
  if (!_malls) {
    const p = join(process.cwd(), 'public', 'shopping-centers.json')
    _malls = JSON.parse(readFileSync(p, 'utf8'))
  }
  return _malls!
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { lat, lon, entity }: { lat: number; lon: number; entity: Entity } = body

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({ error: 'lat/lon requis' }, { status: 400 })
    }

    const malls = getMalls()
    const radii = analyzeProximity(lat, lon, malls)
    const score = potentialScore(entity, radii)

    return NextResponse.json({ radii, potentialScore: score })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
