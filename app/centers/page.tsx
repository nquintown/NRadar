'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import AppHeader from '@/components/AppHeader'
import type { MallProximity } from '@/types/entities'
import type { ShoppingCenter } from '@/types/pois'
import { resolveRegion, REGIONS_FR } from '@/lib/regions'
import { calculateDistance } from '@/lib/calculateDistance'

const CenterMap = dynamic(() => import('@/components/CenterMap'), { ssr: false })

// ── Constants ─────────────────────────────────────────────────────────────────

const RADIUS_OPTIONS = [2, 5, 10, 20, 50]
const DEFAULT_RADIUS = 10
const PER_PAGE = 10

// ── Types ─────────────────────────────────────────────────────────────────────

type EnrichedCenter = ShoppingCenter & { _region: string }

// ── CenterCard ────────────────────────────────────────────────────────────────

function CenterCard({ center, selected, onClick }: {
  center: EnrichedCenter
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
        selected ? 'bg-gray-900' : 'hover:bg-gray-100'
      }`}
    >
      <p className={`text-[12px] font-semibold leading-snug line-clamp-2 ${selected ? 'text-white' : 'text-gray-800'}`}>
        {center.name}
      </p>
      {(center.city || center.detectedBrand) && (
        <p className={`text-[11px] mt-0.5 ${selected ? 'text-gray-300' : 'text-gray-400'}`}>
          {[center.city, center.detectedBrand].filter(Boolean).join(' · ')}
        </p>
      )}
    </button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CentersPage() {

  // ── Centers list ────────────────────────────────────────────────────────────
  const [centers,        setCenters]        = useState<EnrichedCenter[]>([])
  const [filterText,     setFilterText]     = useState('')
  const [filterRegion,   setFilterRegion]   = useState('')
  const [selectedCenter, setSelectedCenter] = useState<ShoppingCenter | null>(null)

  // ── Nearby enseignes ─────────────────────────────────────────────────────────
  const [radiusKm,     setRadiusKm]     = useState(DEFAULT_RADIUS)
  const [filterBrand,  setFilterBrand]  = useState('all')
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [uiPage,       setUiPage]       = useState(1)

  // ── Load shopping centers from static JSON ───────────────────────────────────
  useEffect(() => {
    fetch('/shopping-centers.json')
      .then(r => r.json())
      .then((data: ShoppingCenter[]) =>
        setCenters(data.map(c => ({ ...c, _region: resolveRegion(c.postcode, c.lat, c.lon) as string })))
      )
      .catch(console.error)
  }, [])

  // ── Sidebar filter ───────────────────────────────────────────────────────────
  const filteredCenters = useMemo(() => centers.filter(c => {
    if (filterRegion && c._region !== filterRegion) return false
    if (filterText) {
      const q = filterText.toLowerCase()
      return c.name.toLowerCase().includes(q)
          || (c.city ?? '').toLowerCase().includes(q)
          || (c.detectedBrand ?? '').toLowerCase().includes(q)
    }
    return true
  }), [centers, filterRegion, filterText])

  // ── Compute nearby centers (client-side haversine, no API) ───────────────────
  const nearbyCenters = useMemo((): MallProximity[] => {
    if (!selectedCenter) return []
    return centers
      .filter(c => c.id !== selectedCenter.id)
      .map(c => ({
        id:            c.id,
        name:          c.name,
        city:          c.city,
        lat:           c.lat,
        lon:           c.lon,
        distanceKm:    Math.round(calculateDistance(selectedCenter.lat, selectedCenter.lon, c.lat, c.lon) / 100) / 10,
        detectedBrand: c.detectedBrand,
      }))
      .filter(c => c.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }, [centers, selectedCenter, radiusKm])

  // ── Available brands in radius ───────────────────────────────────────────────
  const availableBrands = useMemo(() => {
    const set = new Set(nearbyCenters.filter(c => c.detectedBrand).map(c => c.detectedBrand!))
    return ['all', ...Array.from(set).sort()]
  }, [nearbyCenters])

  // Reset brand filter when it disappears from available brands
  useEffect(() => {
    if (filterBrand !== 'all' && !availableBrands.includes(filterBrand)) {
      setFilterBrand('all')
    }
  }, [availableBrands, filterBrand])

  // ── Apply brand filter + UI pagination ──────────────────────────────────────
  const brandFiltered = useMemo(() =>
    filterBrand === 'all' ? nearbyCenters : nearbyCenters.filter(c => c.detectedBrand === filterBrand)
  , [nearbyCenters, filterBrand])

  const totalPages        = Math.ceil(brandFiltered.length / PER_PAGE)
  const displayedCenters  = brandFiltered.slice((uiPage - 1) * PER_PAGE, uiPage * PER_PAGE)

  // Reset page when filter changes
  useEffect(() => setUiPage(1), [filterBrand, radiusKm, selectedCenter])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleSelectCenter(center: ShoppingCenter) {
    setSelectedCenter(center)
    setSelectedId(null)
    setFilterBrand('all')
    setUiPage(1)
  }

  // ── Summary stats ─────────────────────────────────────────────────────────────
  const brandCount     = availableBrands.length - 1 // minus 'all'
  const withBrandCount = nearbyCenters.filter(c => c.detectedBrand).length

  const regionOptions = [
    { value: '', label: 'Toutes les régions' },
    ...REGIONS_FR.map(r => ({ value: r, label: r })),
  ]

  const brandOptions = [
    { value: 'all', label: 'Toutes les enseignes' },
    ...availableBrands.filter(b => b !== 'all').map(b => ({ value: b, label: b })),
  ]

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Centres ({filteredCenters.length})
            </p>
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Rechercher un centre…"
              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
            />
            <select
              value={filterRegion}
              onChange={e => setFilterRegion(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              {regionOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {centers.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              </div>
            ) : filteredCenters.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Aucun centre trouvé</p>
            ) : (
              filteredCenters.map(c => (
                <CenterCard
                  key={c.id}
                  center={c}
                  selected={selectedCenter?.id === c.id}
                  onClick={() => handleSelectCenter(c)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Main panel ───────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#f5f6f7]">

          {/* Map — fixed height, never scrolls */}
          <div className="flex-shrink-0 h-[50vh] relative">
            <CenterMap
              center={selectedCenter}
              nearby={nearbyCenters}
              selectedId={selectedId}
              onSelect={id => setSelectedId(id === selectedId ? null : id)}
              activeRadiusKm={radiusKm}
            />
          </div>

          {/* Filter bar */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-5 py-2 flex flex-wrap gap-3 items-center">

            {/* Radius buttons */}
            <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-xl">
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${
                    radiusKm === r
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>

            {/* Brand filter */}
            <select
              value={filterBrand}
              onChange={e => setFilterBrand(e.target.value)}
              disabled={brandOptions.length <= 1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
            >
              {brandOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Stats */}
            {selectedCenter && (
              <span className="text-xs text-gray-400 ml-auto">
                {nearbyCenters.length} centre{nearbyCenters.length !== 1 ? 's' : ''} · {withBrandCount} avec enseigne · {brandCount} enseigne{brandCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Table — scrollable, map stays fixed */}
          <div className="flex-1 overflow-y-auto">

            {!selectedCenter ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-8">
                <div className="text-4xl">🗺️</div>
                <p className="font-semibold text-gray-600 text-sm">Sélectionnez un centre commercial</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  Les enseignes et centres présents dans le rayon choisi apparaîtront ici et sur la carte.
                </p>
              </div>

            ) : nearbyCenters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 p-8">
                <p className="text-sm text-gray-500">Aucun centre dans un rayon de {radiusKm} km</p>
                <p className="text-xs text-gray-400">Essayez d'agrandir le rayon</p>
              </div>

            ) : (
              <div className="p-5 space-y-4">

                {/* Enseigne summary pills */}
                {brandCount > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {availableBrands.filter(b => b !== 'all').map(brand => {
                      const count = nearbyCenters.filter(c => c.detectedBrand === brand).length
                      return (
                        <button
                          key={brand}
                          onClick={() => setFilterBrand(filterBrand === brand ? 'all' : brand)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                            filterBrand === brand
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                          }`}
                        >
                          {brand} · {count}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Table */}
                {displayedCenters.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Nom</th>
                          <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Enseigne</th>
                          <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 hidden sm:table-cell">Ville</th>
                          <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Distance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedCenters.map(mall => (
                          <tr
                            key={mall.id}
                            onClick={() => setSelectedId(mall.id === selectedId ? null : mall.id)}
                            className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${
                              mall.id === selectedId ? 'bg-orange-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-gray-900 text-xs leading-snug">{mall.name}</p>
                            </td>
                            <td className="px-4 py-2.5">
                              {mall.detectedBrand ? (
                                <span className="text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                                  {mall.detectedBrand}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-500 hidden sm:table-cell">
                              {mall.city ?? '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
                                {mall.distanceKm} km
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setUiPage(p => Math.max(1, p - 1))}
                      disabled={uiPage === 1}
                      className="px-3 py-1.5 text-xs font-semibold border border-gray-200 bg-white rounded-lg hover:border-gray-300 disabled:opacity-40 transition-all"
                    >
                      ← Précédent
                    </button>
                    <span className="text-xs text-gray-400">Page {uiPage} / {totalPages}</span>
                    <button
                      onClick={() => setUiPage(p => Math.min(totalPages, p + 1))}
                      disabled={uiPage >= totalPages}
                      className="px-3 py-1.5 text-xs font-semibold border border-gray-200 bg-white rounded-lg hover:border-gray-300 disabled:opacity-40 transition-all"
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
