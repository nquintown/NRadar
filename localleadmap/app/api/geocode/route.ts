import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress } from '@/lib/geocodeAddress'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.trim()
  if (!address) {
    return NextResponse.json({ error: 'Paramètre address manquant' }, { status: 400 })
  }
  try {
    const result = await geocodeAddress(address)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur de géocodage'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
