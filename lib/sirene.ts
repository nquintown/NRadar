import type { Entity, EntityType, EmployeeRangeId, EMPLOYEE_RANGES } from '@/types/entities'
import { SECTION_TYPE_MAP } from '@/types/entities'

const BASE = 'https://recherche-entreprises.api.gouv.fr'

// Map SIRENE tranche codes → our employee range IDs
const TRANCHE_MAP: Record<string, EmployeeRangeId> = {
  '00': '0-50', '01': '0-50', '02': '0-50', '03': '0-50', '11': '0-50', '12': '0-50',
  '21': '50-100',
  '22': '100-500', '31': '100-500', '32': '100-500',
  '41': '500-1000',
  '42': '1000-5000', '51': '1000-5000',
  '52': '5000-10000',
  '53': '10000+',
}

const TRANCHE_LABELS: Record<string, string> = {
  '00': '0 salarié', '01': '1–2', '02': '3–5', '03': '6–9',
  '11': '10–19', '12': '20–49', '21': '50–99',
  '22': '100–199', '31': '200–249', '32': '250–499',
  '41': '500–999', '42': '1 000–1 999', '51': '2 000–4 999',
  '52': '5 000–9 999', '53': '10 000+',
}

// NAF section → entity type
const NAF_SECTION_TYPE: Record<string, EntityType> = {
  P: 'school', O: 'government', Q: 'hospital',
}

// Build section_activite_principale param by entity type
export function sectionsForType(type: EntityType | 'all'): string | undefined {
  if (type === 'all') return undefined
  const reverse: Record<EntityType, string | undefined> = {
    enterprise: undefined, // handled by exclusion
    school: 'P',
    university: 'P',
    government: 'O',
    military: 'O',
    hospital: 'Q',
    other: undefined,
  }
  return reverse[type]
}

function detectType(sectionCode: string | null, nafCode: string | null): EntityType {
  if (!sectionCode) return 'enterprise'
  const mapped = NAF_SECTION_TYPE[sectionCode]
  if (mapped) {
    // Distinguish school vs university by NAF sub-code
    if (sectionCode === 'P' && nafCode?.startsWith('85.4')) return 'university'
    return mapped
  }
  return 'enterprise'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapResult(r: any): Entity {
  const siege = r.siege ?? {}
  const tranche = r.tranche_effectif_salarie ?? siege.tranche_effectif_salarie ?? null
  const section = r.section_activite_principale ?? null
  const naf = r.activite_principale ?? null

  const street = [siege.numero_voie, siege.type_voie, siege.libelle_voie]
    .filter(Boolean).join(' ') || undefined

  return {
    id: r.siren,
    type: detectType(section, naf),
    name: r.nom_complet || r.nom_raison_sociale || 'Inconnu',
    address: street,
    city: siege.libelle_commune,
    postcode: siege.code_postal,
    department: siege.departement,
    lat: siege.latitude ? parseFloat(siege.latitude) : undefined,
    lon: siege.longitude ? parseFloat(siege.longitude) : undefined,
    nafCode: naf ?? undefined,
    nafLabel: r.libelle_activite_principale ?? undefined,
    employeeRangeId: tranche ? TRANCHE_MAP[tranche] : undefined,
    employeeRangeLabel: tranche ? TRANCHE_LABELS[tranche] : undefined,
    siren: r.siren,
    source: 'sirene',
  }
}

export interface SireneSearchResult {
  entities: Entity[]
  total: number
}

export async function searchSirene(params: {
  q?: string
  type?: EntityType | 'all'
  employeeRangeCodes?: string[]
  department?: string
  page?: number
  perPage?: number
}): Promise<SireneSearchResult> {
  const url = new URL(`${BASE}/search`)

  if (params.q?.trim()) url.searchParams.set('q', params.q.trim())
  if (params.department) url.searchParams.set('departement', params.department)

  const section = params.type ? sectionsForType(params.type) : undefined
  if (section) url.searchParams.set('section_activite_principale', section)

  // For 'enterprise' type: exclude public/education/health sectors
  if (params.type === 'enterprise') {
    url.searchParams.set('section_activite_principale', 'A,B,C,D,E,F,G,H,I,J,K,L,M,N')
  }

  if (params.employeeRangeCodes?.length) {
    url.searchParams.set('tranche_effectif_salarie', params.employeeRangeCodes.join(','))
  }

  url.searchParams.set('per_page', String(params.perPage ?? 25))
  url.searchParams.set('page', String(params.page ?? 1))

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'NilsRadar/1.0' },
    signal: AbortSignal.timeout(10_000),
    next: { revalidate: 300 }, // cache 5 min in Next.js
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`SIRENE ${res.status}: ${body.slice(0, 100)}`)
  }

  const json = await res.json()
  return {
    entities: (json.results ?? []).map(mapResult),
    total: json.total_results ?? 0,
  }
}
