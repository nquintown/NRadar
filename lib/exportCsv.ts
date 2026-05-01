import type { POI } from '@/types/pois'
import { formatDistance } from './calculateDistance'

function escape(val: string | number | undefined): string {
  if (val === undefined || val === null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function poisToCsv(pois: POI[]): string {
  const headers = ['Nom', 'Catégorie', 'Distance', 'Adresse', 'Téléphone', 'Site web', 'Horaires', 'Latitude', 'Longitude']
  const rows = pois.map(poi => [
    escape(poi.name),
    escape(poi.categoryLabel),
    escape(formatDistance(poi.distance)),
    escape(poi.address),
    escape(poi.phone),
    escape(poi.website),
    escape(poi.openingHours),
    escape(poi.lat),
    escape(poi.lon),
  ])
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

export function downloadCsv(pois: POI[], filename = 'localleadmap-export.csv'): void {
  const csv = poisToCsv(pois)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
