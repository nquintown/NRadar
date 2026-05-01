'use client'

import { useState, useMemo, useCallback } from 'react'
import type { ShoppingCenter, SearchCenter } from '@/types/pois'

interface Props {
  onSelect: (center: SearchCenter) => void
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error'

export default function ShoppingCenterBrowser({ onSelect }: Props) {
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [centers, setCenters] = useState<ShoppingCenter[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchName, setSearchName] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadState('loading')
    setError(null)
    try {
      const res = await fetch('/api/shopping-centers')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCenters(data)
      setLoadState('loaded')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
      setLoadState('error')
    }
  }, [])

  const cities = useMemo(() => {
    const set = new Set(centers.map(c => c.city).filter(Boolean) as string[])
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [centers])

  const filtered = useMemo(() => {
    const q = searchName.toLowerCase().trim()
    return centers.filter(c => {
      const matchName = !q ||
        c.name.toLowerCase().includes(q) ||
        (c.brand ?? '').toLowerCase().includes(q) ||
        (c.operator ?? '').toLowerCase().includes(q)
      const matchCity = !filterCity || c.city === filterCity
      return matchName && matchCity
    })
  }, [centers, searchName, filterCity])

  function handleSelect(center: ShoppingCenter) {
    setSelectedId(center.id)
    onSelect({
      lat: center.lat,
      lon: center.lon,
      displayName: [center.name, center.city, center.postcode].filter(Boolean).join(', '),
    })
  }

  // ── Idle state ──────────────────────────────────────────────────────────────
  if (loadState === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center">
          <span className="text-3xl">🏬</span>
        </div>
        <div>
          <p className="font-semibold text-gray-700 text-sm">Centres commerciaux de France</p>
          <p className="text-xs text-gray-400 mt-1">
            Charge la base complète depuis OpenStreetMap (~300–600 centres)
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Charger les centres
        </button>
      </div>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loadState === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Chargement depuis OpenStreetMap…</p>
        <p className="text-xs text-gray-400">Peut prendre 15–30 secondes</p>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (loadState === 'error') {
    return (
      <div className="flex flex-col gap-3 py-4">
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
        <button onClick={load} className="text-sm text-brand-600 hover:underline self-start">
          Réessayer
        </button>
      </div>
    )
  }

  // ── Loaded ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {/* Search + city filter */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            placeholder="Nom ou enseigne (Carrefour, Auchan…)"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {searchName && (
            <button
              onClick={() => setSearchName('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>

        <select
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">Toutes les villes ({centers.length})</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400">
        {filtered.length} centre{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
        {(searchName || filterCity) && (
          <button
            onClick={() => { setSearchName(''); setFilterCity('') }}
            className="ml-2 text-brand-600 hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </p>

      {/* List */}
      <div className="overflow-y-auto max-h-[340px] rounded-xl border border-gray-200 divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">Aucun résultat</div>
        ) : (
          filtered.map(center => {
            const isSelected = center.id === selectedId
            return (
              <button
                key={center.id}
                onClick={() => handleSelect(center)}
                className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-brand-50 hover:bg-brand-50' : ''
                }`}
              >
                <span className="mt-0.5 text-base flex-shrink-0">🏬</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium leading-snug truncate ${isSelected ? 'text-brand-700' : 'text-gray-900'}`}>
                    {center.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {[center.postcode, center.city].filter(Boolean).join(' ')}
                    {center.address ? ` · ${center.address}` : ''}
                  </p>
                  {(center.brand || center.operator) && (
                    <span className="inline-block text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 mt-0.5">
                      {center.brand ?? center.operator}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <svg className="h-4 w-4 text-brand-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-[10px] text-gray-300 text-center">
          Cliquez sur un centre pour le centrer sur la carte
        </p>
      )}
    </div>
  )
}
