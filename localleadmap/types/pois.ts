export interface POI {
  id: string
  name: string
  category: string
  categoryLabel: string
  lat: number
  lon: number
  distance: number
  address?: string
  phone?: string
  website?: string
  openingHours?: string
}

export interface SearchCenter {
  lat: number
  lon: number
  displayName: string
}

export interface SearchPayload {
  lat: number
  lon: number
  radius: number
  categories: string[]
}

export interface GeocodeResult {
  lat: number
  lon: number
  displayName: string
}

export type SortField = keyof Pick<POI, 'name' | 'category' | 'distance' | 'phone' | 'website' | 'address'>
export type SortDirection = 'asc' | 'desc'

export interface ShoppingCenter {
  id: string
  name: string
  lat: number
  lon: number
  city?: string
  postcode?: string
  address?: string
  brand?: string
  operator?: string
  website?: string
  openingHours?: string
  region?: string
  detectedBrand?: string
}
