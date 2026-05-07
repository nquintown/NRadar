export type EntityType = 'enterprise' | 'school' | 'university' | 'government' | 'military' | 'hospital' | 'other'

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  enterprise: 'Entreprise',
  school: 'École / Collège / Lycée',
  university: 'Université / Enseignement sup.',
  government: 'Administration publique',
  military: 'Base militaire',
  hospital: 'Hôpital / Santé',
  other: 'Autre',
}

// Mapping SIRENE section codes → entity type
export const SECTION_TYPE_MAP: Record<string, EntityType> = {
  P: 'school',   // Enseignement
  O: 'government', // Administration publique, défense
  Q: 'hospital',  // Santé humaine et action sociale
}

export const EMPLOYEE_RANGES = [
  { id: '0-50',       label: '0 – 50',          min: 0,    max: 49,   sireneCodes: ['00','01','02','03','11','12'] },
  { id: '50-100',     label: '50 – 100',         min: 50,   max: 99,   sireneCodes: ['21'] },
  { id: '100-500',    label: '100 – 500',        min: 100,  max: 499,  sireneCodes: ['22','31','32'] },
  { id: '500-1000',   label: '500 – 1 000',      min: 500,  max: 999,  sireneCodes: ['41'] },
  { id: '1000-5000',  label: '1 000 – 5 000',    min: 1000, max: 4999, sireneCodes: ['42','51'] },
  { id: '5000-10000', label: '5 000 – 10 000',   min: 5000, max: 9999, sireneCodes: ['52'] },
  { id: '10000+',     label: '10 000+',           min: 10000,max: Infinity, sireneCodes: ['53'] },
] as const

export type EmployeeRangeId = typeof EMPLOYEE_RANGES[number]['id']

export interface Entity {
  id: string
  type: EntityType
  name: string
  address?: string
  city?: string
  postcode?: string
  department?: string
  lat?: number
  lon?: number
  nafCode?: string
  nafLabel?: string
  employeeRangeId?: EmployeeRangeId
  employeeRangeLabel?: string
  phone?: string
  email?: string
  website?: string
  siren?: string
  source: 'sirene' | 'overpass'
}

export interface MallProximity {
  id: string
  name: string
  city?: string
  lat: number
  lon: number
  distanceKm: number
  detectedBrand?: string
}

export interface RadiusResult {
  radiusKm: number
  count: number
  malls: MallProximity[]
}

export interface EntityAnalysis {
  entity: Entity
  radii: RadiusResult[]
  potentialScore: number // 0-100
}

export interface SearchParams {
  q?: string
  type?: EntityType | 'all'
  employeeRange?: EmployeeRangeId | 'all'
  department?: string
  page?: number
}

export interface EntityWithDistance extends Entity {
  distanceKm: number
}
