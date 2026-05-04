'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { ShoppingCenter } from '@/types/pois'
import { REGIONS_FR } from '@/lib/regions'
import { MALL_BRANDS } from '@/lib/mallBrands'
import Select from '@/components/Select'

const LottiePlayer = dynamic(() => import('@/components/LottiePlayer'), { ssr: false })

function CardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-9 w-9 rounded-xl bg-gray-100" />
        <div className="h-4 w-20 bg-gray-100 rounded-full" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-4/5 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  )
}

const BRAND_COLORS: Record<string, { bg: string; text: string }> = {
  'Westfield':          { bg: 'bg-blue-100',   text: 'text-blue-700' },
  'Klépierre':          { bg: 'bg-violet-100', text: 'text-violet-700' },
  'Carmila':            { bg: 'bg-red-100',    text: 'text-red-700' },
  'Aushopping':         { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Ceetrus / Nhood':    { bg: 'bg-emerald-100',text: 'text-emerald-700' },
  'Hammerson':          { bg: 'bg-teal-100',   text: 'text-teal-700' },
  'Mercialys':          { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'E.Leclerc':          { bg: 'bg-cyan-100',   text: 'text-cyan-700' },
  'Carrefour':          { bg: 'bg-sky-100',    text: 'text-sky-700' },
  'Auchan':             { bg: 'bg-rose-100',   text: 'text-rose-700' },
  'Intermarché':        { bg: 'bg-red-100',    text: 'text-red-800' },
  'Système U':          { bg: 'bg-lime-100',   text: 'text-lime-700' },
  'Galeries Lafayette': { bg: 'bg-amber-100',  text: 'text-amber-700' },
  'Printemps':          { bg: 'bg-pink-100',   text: 'text-pink-700' },
  'Altarea':            { bg: 'bg-indigo-100', text: 'text-indigo-700' },
}
const DEFAULT_COLOR = { bg: 'bg-gray-100', text: 'text-gray-500' }

function CenterCard({ center, onClick }: { center: ShoppingCenter; onClick: () => void }) {
  const initials = center.name
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || center.name.slice(0, 2).toUpperCase()

  const color = center.detectedBrand ? (BRAND_COLORS[center.detectedBrand] ?? DEFAULT_COLOR) : DEFAULT_COLOR

  return (
    <button
      onClick={onClick}
      className="group card p-5 text-left hover:shadow-md hover:border-gray-300 transition-all duration-150 flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${color.bg}`}>
          <span className={`text-xs font-bold ${color.text}`}>{initials}</span>
        </div>
        {center.region && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 rounded-full px-2.5 py-1 leading-none">
            {center.region.replace("Provence-Alpes-Côte d'Azur", 'PACA').replace('Auvergne-Rhône-Alpes', 'ARA').replace('Bourgogne-Franche-Comté', 'BFC')}
          </span>
        )}
      </div>
      <p className="font-semibold text-gray-900 leading-snug line-clamp-2 mb-1 group-hover:text-gray-700 transition-colors">
        {center.name}
      </p>
      <p className="text-sm text-gray-400">
        {[center.postcode, center.city].filter(Boolean).join(' ') || 'France'}
      </p>
      {center.detectedBrand && (
        <p className="text-xs text-gray-400 mt-1 truncate">{center.detectedBrand}</p>
      )}
      <div className="flex items-center gap-1 text-xs font-semibold text-gray-900 mt-auto pt-4 group-hover:gap-2 transition-all">
        Explorer les commerces
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [centers, setCenters] = useState<ShoppingCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchName, setSearchName] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterBrand, setFilterBrand] = useState('')

  useEffect(() => {
    fetch('/shopping-centers.json')
      .then(async res => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        return res.json()
      })
      .then(setCenters)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = searchName.toLowerCase().trim()
    return centers.filter(c => {
      const matchName =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.brand ?? '').toLowerCase().includes(q) ||
        (c.operator ?? '').toLowerCase().includes(q) ||
        (c.city ?? '').toLowerCase().includes(q)
      const matchRegion = !filterRegion || c.region === filterRegion
      const matchBrand = !filterBrand || c.detectedBrand === filterBrand
      return matchName && matchRegion && matchBrand
    })
  }, [centers, searchName, filterRegion, filterBrand])

  function handleSelect(center: ShoppingCenter) {
    const params = new URLSearchParams({
      lat: String(center.lat),
      lon: String(center.lon),
      name: center.name,
      ...(center.city ? { city: center.city } : {}),
      ...(center.postcode ? { postcode: center.postcode } : {}),
    })
    router.push(`/search?${params}`)
  }

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} points="3.27 6.96 12 12.01 20.73 6.96" />
                <line strokeLinecap="round" strokeWidth={2} x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">NilsRadar</span>
          </div>
          <a href="/search" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            Recherche par adresse →
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-10">
          <div className="flex items-center gap-10 mb-8">
            <LottiePlayer
              src="/lottie-cubes.json"
              className="hidden sm:block flex-shrink-0 w-44 h-44 overflow-hidden"
            />
            <div>
              <p className="label-xs mb-3">Centres commerciaux · France métropolitaine</p>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
                Explorez les commerces<br className="hidden sm:block" /> autour de vous
              </h1>
              <p className="text-gray-500 max-w-lg">
                Sélectionnez un centre commercial, choisissez un rayon et exportez la liste des commerçants à proximité.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-3xl">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                placeholder="Rechercher un centre…"
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              />
              {searchName && (
                <button onClick={() => setSearchName('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              )}
            </div>
            <Select
              value={filterBrand}
              onChange={setFilterBrand}
              options={[
                { value: '', label: 'Toutes les enseignes' },
                ...MALL_BRANDS.map(b => ({ value: b, label: b })),
              ]}
              className="sm:w-48"
            />
            <Select
              value={filterRegion}
              onChange={setFilterRegion}
              options={[
                { value: '', label: 'Toutes les régions' },
                ...REGIONS_FR.map(r => ({ value: r, label: r })),
              ]}
              className="sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 sm:px-8 py-8">
        {error && (
          <div className="card p-4 flex items-start gap-3 mb-6 border-red-100 bg-red-50">
            <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-600 text-xs font-black">!</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700">Impossible de charger les centres</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
              <button onClick={() => window.location.reload()}
                className="text-xs text-red-600 underline mt-1">Réessayer</button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-900">{filtered.length}</span>
              <span className="label-xs">centre{filtered.length > 1 ? 's' : ''}</span>
              {(searchName || filterRegion || filterBrand) && (
                <button onClick={() => { setSearchName(''); setFilterRegion(''); setFilterBrand('') }}
                  className="text-xs text-gray-400 hover:text-gray-700 ml-2 underline transition-colors">
                  Effacer les filtres
                </button>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 20 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(center => (
              <CenterCard key={center.id} center={center} onClick={() => handleSelect(center)} />
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="card flex flex-col items-center py-20 gap-3 text-center">
            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-600 text-sm">Aucun résultat</p>
            <p className="text-xs text-gray-400">Essayez un autre nom ou région</p>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between text-xs text-gray-400">
          <span>NilsRadar</span>
        </div>
      </footer>
    </div>
  )
}
