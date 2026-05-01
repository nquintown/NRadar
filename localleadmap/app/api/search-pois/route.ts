import { NextRequest, NextResponse } from 'next/server'
import { searchPOIs } from '@/lib/overpass'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { lat, lon, radius, categories } = body

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({ error: 'Coordonnées invalides' }, { status: 400 })
    }
    if (typeof radius !== 'number' || radius < 100 || radius > 15000) {
      return NextResponse.json({ error: 'Rayon invalide (100–15000 m)' }, { status: 400 })
    }
    if (!Array.isArray(categories) || !categories.length) {
      return NextResponse.json({ error: 'Sélectionnez au moins une catégorie' }, { status: 400 })
    }

    const pois = await searchPOIs(lat, lon, radius, categories)
    return NextResponse.json({ pois, count: pois.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
