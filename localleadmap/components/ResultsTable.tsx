'use client'

import { useState, useMemo } from 'react'
import type { POI, SortField, SortDirection } from '@/types/pois'
import { formatDistance } from '@/lib/calculateDistance'
import { CATEGORIES } from '@/lib/osmCategories'
import Select from '@/components/Select'

interface Props {
  pois: POI[]
  selectedId: string | null
  onSelectPoi: (id: string) => void
}

interface Filters {
  category: string
  hasPhone: boolean
  hasWebsite: boolean
  maxDistance: number
}

const MAX_DIST_OPTIONS = [
  { label: 'Toutes distances', value: 99999 },
  { label: '≤ 500 m', value: 500 },
  { label: '≤ 1 km', value: 1000 },
  { label: '≤ 2 km', value: 2000 },
  { label: '≤ 5 km', value: 5000 },
]

const COLUMNS: { field: SortField; label: string }[] = [
  { field: 'name', label: 'Nom' },
  { field: 'category', label: 'Catégorie' },
  { field: 'distance', label: 'Distance' },
  { field: 'address', label: 'Adresse' },
  { field: 'phone', label: 'Téléphone' },
  { field: 'website', label: 'Site web' },
]

export default function ResultsTable({ pois, selectedId, onSelectPoi }: Props) {
  const [sortField, setSortField] = useState<SortField>('distance')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [filters, setFilters] = useState<Filters>({
    category: '', hasPhone: false, hasWebsite: false, maxDistance: 99999,
  })

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const filtered = useMemo(() => pois.filter(p => {
    if (filters.category && p.category !== filters.category) return false
    if (filters.hasPhone && !p.phone) return false
    if (filters.hasWebsite && !p.website) return false
    if (p.distance > filters.maxDistance) return false
    return true
  }), [pois, filters])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const va = a[sortField] ?? ''
    const vb = b[sortField] ?? ''
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? va - vb : String(va).localeCompare(String(vb), 'fr')
    return sortDir === 'asc' ? cmp : -cmp
  }), [filtered, sortField, sortDir])

  const categoriesInResults = useMemo(() => {
    const keys = Array.from(new Set(pois.map(p => p.category)))
    return CATEGORIES.filter(c => keys.includes(c.key))
  }, [pois])

  return (
    <div className="flex flex-col gap-3">
      {/* Filter bar */}
      <div className="card p-3 flex flex-wrap items-center gap-2">
        <p className="label-xs mr-1">Filtres</p>

        <Select
          value={filters.category}
          onChange={v => setFilters(f => ({ ...f, category: v }))}
          options={[
            { value: '', label: 'Toutes catégories' },
            ...categoriesInResults.map(c => ({ value: c.key, label: `${c.emoji} ${c.label}` })),
          ]}
        />

        <Select
          value={filters.maxDistance}
          onChange={v => setFilters(f => ({ ...f, maxDistance: Number(v) }))}
          options={MAX_DIST_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
        />

        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={filters.hasPhone}
            onChange={e => setFilters(f => ({ ...f, hasPhone: e.target.checked }))}
            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
          Avec téléphone
        </label>

        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={filters.hasWebsite}
            onChange={e => setFilters(f => ({ ...f, hasWebsite: e.target.checked }))}
            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
          Avec site web
        </label>

        <span className="ml-auto text-xs text-gray-400 tabular-nums">
          {sorted.length}/{pois.length}
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {COLUMNS.map(col => (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    className="px-4 py-3 text-left cursor-pointer select-none whitespace-nowrap group"
                  >
                    <span className="label-xs group-hover:text-gray-600 transition-colors">
                      {col.label}
                      {sortField === col.field && (
                        <span className="ml-1 text-gray-900">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(poi => {
                const isSelected = poi.id === selectedId
                const cat = CATEGORIES.find(c => c.key === poi.category)
                return (
                  <tr
                    key={poi.id}
                    onClick={() => onSelectPoi(poi.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/60'
                    }`}
                  >
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="font-medium text-gray-900 line-clamp-1">{poi.name}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <span>{cat?.emoji}</span>
                        <span>{poi.categoryLabel}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs tabular-nums text-gray-600">
                      {formatDistance(poi.distance)}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="text-xs text-gray-500 line-clamp-1">{poi.address ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {poi.phone ? (
                        <a href={`tel:${poi.phone}`} onClick={e => e.stopPropagation()}
                          className="text-xs text-gray-900 font-medium hover:underline">{poi.phone}</a>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      {poi.website ? (
                        <a href={poi.website} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-xs text-gray-500 hover:text-gray-900 truncate block hover:underline transition-colors">
                          {poi.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                        </a>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">Aucun résultat pour ces filtres</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
