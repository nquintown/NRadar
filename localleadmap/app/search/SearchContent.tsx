'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { POI, SearchCenter } from '@/types/pois'
import { CATEGORIES } from '@/lib/osmCategories'
import RadiusSelector from '@/components/RadiusSelector'
import CategorySelector from '@/components/CategorySelector'
import ResultsTable from '@/components/ResultsTable'
import SearchForm from '@/components/SearchForm'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-2xl">
      <div className="h-7 w-7 border-[3px] border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

export default function SearchContent() {
  const params = useSearchParams()
  const initialLat = parseFloat(params.get('lat') ?? '0')
  const initialLon = parseFloat(params.get('lon') ?? '0')
  const initialName = params.get('name') ?? ''
  const initialCity = params.get('city') ?? ''
  const initialPostcode = params.get('postcode') ?? ''
  const hasInitialCenter = initialLat !== 0 && initialLon !== 0

  const displayName = [initialName, initialPostcode, initialCity].filter(Boolean).join(', ')

  const [center, setCenter] = useState<SearchCenter | null>(
    hasInitialCenter ? { lat: initialLat, lon: initialLon, displayName } : null
  )
  const [radius, setRadius] = useState(500)
  const [categories, setCategories] = useState<string[]>(CATEGORIES.map(c => c.key))
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddressSearch, setShowAddressSearch] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const stats = useMemo(() => ({
    total: pois.length,
    withPhone: pois.filter(p => p.phone).length,
    withWebsite: pois.filter(p => p.website).length,
  }), [pois])

  const searchPois = useCallback(async (c: SearchCenter, r: number, cats: string[]) => {
    if (!cats.length) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError(null)
    setPois([])
    setSelectedId(null)
    try {
      const res = await fetch('/api/search-pois', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: c.lat, lon: c.lon, radius: r, categories: cats }),
        signal: abortRef.current.signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPois(data.pois)
      if (!data.pois.length) {
        setError("Aucun commerce trouvé. Essayez d'augmenter le rayon ou de changer de catégories.")
      } else {
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Erreur de recherche')
    } finally {
      setLoading(false)
    }
  }, [])

  function handleRadiusChange(r: number) {
    setRadius(r)
    if (center) searchPois(center, r, categories)
  }

  function handleAddressResult(newCenter: SearchCenter) {
    setCenter(newCenter)
    setShowAddressSearch(false)
    setPois([])
    setError(null)
  }

  function handleSelectPoi(id: string) {
    setSelectedId(prev => (prev === id ? null : id))
  }

  const radiusLabel = radius >= 1000 ? `${radius / 1000} km` : `${radius} m`

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Centres
          </Link>
          <span className="text-gray-200 select-none">·</span>
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-5 rounded bg-gray-900 flex items-center justify-center flex-shrink-0">
              <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} points="3.27 6.96 12 12.01 20.73 6.96" />
                <line strokeLinecap="round" strokeWidth={2} x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900 truncate">
              {center?.displayName ?? 'Recherche de commerces'}
            </span>
          </div>

          {pois.length > 0 && (
            <button
              onClick={() => {
                import('@/lib/exportCsv').then(m => m.downloadCsv(pois))
              }}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exporter CSV
            </button>
          )}
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto w-full px-5 sm:px-8 py-6 flex flex-col gap-5 flex-1">
        {/* Map + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          {/* Sidebar */}
          <div className="card p-5 flex flex-col gap-5 self-start">

            {/* Point de départ */}
            <div>
              <p className="label-xs mb-3">Point de départ</p>
              {center && !showAddressSearch ? (
                <div className="flex items-start justify-between gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
                  <div className="flex items-start gap-2 min-w-0">
                    <svg className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 leading-snug">{center.displayName}</span>
                  </div>
                  <button onClick={() => setShowAddressSearch(true)}
                    className="text-xs text-gray-400 hover:text-gray-700 flex-shrink-0 transition-colors">Changer</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <SearchForm onResult={handleAddressResult} loading={loading} />
                  {center && (
                    <button onClick={() => setShowAddressSearch(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 self-start">Annuler</button>
                  )}
                </div>
              )}
            </div>

            {/* Rayon */}
            <div>
              <p className="label-xs mb-3">Rayon de recherche</p>
              <RadiusSelector value={radius} onChange={handleRadiusChange} />
            </div>

            {/* Catégories */}
            <div>
              <p className="label-xs mb-3">Catégories</p>
              <CategorySelector selected={categories} onChange={setCategories} />
            </div>

            {/* CTA */}
            <button
              onClick={() => center && searchPois(center, radius, categories)}
              disabled={!center || !categories.length || loading}
              className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recherche en cours…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Rechercher les commerces
                </>
              )}
            </button>
          </div>

          {/* Map */}
          <div className="h-[420px] lg:h-auto lg:min-h-[500px]">
            <MapView
              center={center}
              radius={radius}
              pois={pois}
              selectedId={selectedId}
              onSelectPoi={handleSelectPoi}
            />
          </div>
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="card p-4 flex items-start gap-3 border-red-100 bg-red-50">
            <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-600 text-xs font-black">!</span>
            </div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats + Results */}
        {pois.length > 0 && (
          <div ref={resultsRef} className="flex flex-col gap-5">
            {/* Stats bar */}
            <div className="card p-5 grid grid-cols-3 divide-x divide-gray-100">
              {[
                { value: stats.total, label: 'Commerces trouvés' },
                { value: stats.withPhone, label: 'Avec téléphone' },
                { value: stats.withWebsite, label: 'Avec site web' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center py-1 gap-1 px-4 first:pl-0 last:pr-0">
                  <span className="text-3xl font-black text-gray-900 tabular-nums">{stat.value}</span>
                  <span className="label-xs text-center">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Context */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Rayon <span className="font-semibold text-gray-900">{radiusLabel}</span> autour de{' '}
                <span className="font-semibold text-gray-900">{center?.displayName?.split(',')[0]}</span>
              </p>
              <button
                onClick={() => import('@/lib/exportCsv').then(m => m.downloadCsv(pois))}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 bg-white transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exporter CSV ({pois.length})
              </button>
            </div>

            <ResultsTable pois={pois} selectedId={selectedId} onSelectPoi={handleSelectPoi} />
          </div>
        )}

        {/* Empty state (no center) */}
        {!center && !loading && (
          <div className="card flex flex-col items-center py-16 gap-3 text-center">
            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600">Aucun point de départ</p>
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-700 underline transition-colors">
              ← Choisir un centre commercial
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
