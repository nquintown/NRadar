import { NextRequest, NextResponse } from 'next/server'
import { searchSirene } from '@/lib/sirene'
import { EMPLOYEE_RANGES } from '@/types/entities'
import type { EntityType, EmployeeRangeId } from '@/types/entities'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q           = sp.get('q') ?? undefined
  const type        = (sp.get('type') ?? 'all') as EntityType | 'all'
  const empRangeId  = (sp.get('employeeRange') ?? 'all') as EmployeeRangeId | 'all'
  const department  = sp.get('department') ?? undefined
  const page        = parseInt(sp.get('page') ?? '1', 10)

  // Resolve employee range → SIRENE tranche codes
  let employeeRangeCodes: string[] | undefined
  if (empRangeId !== 'all') {
    const found = EMPLOYEE_RANGES.find(r => r.id === empRangeId)
    if (found) employeeRangeCodes = [...found.sireneCodes]
  }

  try {
    const result = await searchSirene({ q, type, employeeRangeCodes, department, page })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
