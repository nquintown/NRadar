import { NextResponse } from 'next/server'
import { fetchShoppingCenters } from '@/lib/overpassMalls'
import type { ShoppingCenter } from '@/types/pois'

// In-memory cache — survives hot reloads in dev, resets on process restart
let cache: { data: ShoppingCenter[]; timestamp: number } | null = null
const CACHE_TTL = 3_600_000 // 1 hour

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { 'X-Cache': 'HIT', 'X-Count': String(cache.data.length) },
    })
  }

  try {
    const data = await fetchShoppingCenters()
    cache = { data, timestamp: Date.now() }
    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS', 'X-Count': String(data.length) },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
