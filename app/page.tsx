'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Entity, EntityType, EmployeeRangeId } from '@/types/entities'
import { ENTITY_TYPE_LABELS, EMPLOYEE_RANGES } from '@/types/entities'
import Select from '@/components/Select'

const LottiePlayer = dynamic(() => import('@/components/LottiePlayer'), { ssr: false })

// ── helpers ──────────────────────────────────────────────────────────────────

const TYPE_TABS: { id: EntityType | 'all'; label: string }[] = [
  { id: 'all',        label: 'Toutes' },
  { id: 'enterprise', label: 'Entreprises' },
  { id: 'school',     label: 'Écoles' },
  { id: 'university', label: 'Universités' },
  { id: 'government', label: 'Administrations' },
  { id: 'hospital',   label: 'Santé' },
  { id: 'military',   label: 'Militaires' },
]

const TYPE_ICONS: Partial<Record<EntityType | 'all', string>> = {
  all:        '🔍',
  enterprise: '🏢',
  school:     '🏫',
  university: '🎓',
  government: '🏛️',
  hospital:   '🏥',
  military:   '🎖️',
}

const DEPT_OPTIONS = [
  { value: '', label: 'Tous les départements' },
  ...Array.from({ length: 95 }, (_, i) => {
    const n = i + 1
    const v = n < 10 ? `0${n}` : String(n)
    return { value: v, label: v }
  }),
  { value: '2A', label: '2A – Corse-du-Sud' },
  { value: '2B', label: '2B – Haute-Corse' },
]

// ── EntityCard ────────────────────────────────────────────────────────────────

function EntityCard({ entity, onAnalyze }: { entity: Entity; onAnalyze: () => void }) {
  const typeIcon = TYPE_ICONS[entity.type] ?? '🏢'
  const hasCoords = entity.lat !== undefined && entity.lon !== undefined

  const fullAddress = [entity.address, entity.postcode, entity.city].filter(Boolean).join(', ')
  const pappersUrl = entity.siren ? `https://www.pappers.fr/entreprise/${entity.name.replace(/\s+/g, '-').toLowerCase()}-${entity.siren}` : null
  const linkedInUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(entity.name)}`

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:border-gray-300 hover:shadow-sm transition-all">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none flex-shrink-0">{typeIcon}</span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{entity.name}</p>
            {entity.siren && (
              <p className="font-mono text-[10px] text-gray-300 mt-0.5">{entity.siren}</p>
            )}
          </div>
        </div>
        {entity.employeeRangeLabel && (
          <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-full px-2 py-1 whitespace-nowrap flex-shrink-0">
            {entity.employeeRangeLabel} sal.
          </span>
        )}
      </div>

      {/* NAF */}
      {entity.nafLabel && (
        <p className="text-xs text-gray-500 leading-snug line-clamp-1">
          <span className="font-mono text-gray-400">{entity.nafCode}</span> · {entity.nafLabel}
        </p>
      )}

      {/* Contact info */}
      <div className="flex flex-col gap-1 text-xs text-gray-500">
        {fullAddress && (
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 flex-shrink-0">📍</span>
            <span className="line-clamp-2">{fullAddress}</span>
          </div>
        )}
        {entity.phone && (
          <a href={`tel:${entity.phone}`} className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
            <span>📞</span>
            <span>{entity.phone}</span>
          </a>
        )}
        {entity.email && (
          <a href={`mailto:${entity.email}`} className="flex items-center gap-1.5 hover:text-gray-700 transition-colors truncate">
            <span>✉️</span>
            <span className="truncate">{entity.email}</span>
          </a>
        )}
        {entity.website && (
          <a href={entity.website.startsWith('http') ? entity.website : `https://${entity.website}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-gray-700 transition-colors truncate">
            <span>🌐</span>
            <span className="truncate">{entity.website.replace(/^https?:\/\//, '')}</span>
          </a>
        )}

        {/* External links */}
        <div className="flex gap-2 mt-1">
          {pappersUrl && (
            <a href={pappersUrl} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 rounded px-2 py-0.5 transition-colors text-gray-500">
              Pappers
            </a>
          )}
          <a href={linkedInUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 rounded px-2 py-0.5 transition-colors text-blue-600">
            LinkedIn
          </a>
          {entity.siren && (
            <a href={`https://www.societe.com/cgi-bin/search?champs=${entity.siren}`}
              target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 rounded px-2 py-0.5 transition-colors text-gray-500">
              Societe.com
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <button
          onClick={onAnalyze}
          disabled={!hasCoords}
          className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-all ${
            hasCoords
              ? 'bg-gray-900 text-white hover:bg-gray-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title={!hasCoords ? 'Coordonnées indisponibles pour cet établissement' : undefined}
        >
          {hasCoords ? 'Analyser la proximité →' : 'Pas de coordonnées'}
        </button>
      </div>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 rounded-full" />
          <div>
            <div className="h-3.5 bg-gray-200 rounded w-40 mb-1" />
            <div className="h-2.5 bg-gray-100 rounded w-24" />
          </div>
        </div>
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="h-2.5 bg-gray-100 rounded w-52 mb-4" />
      <div className="h-8 bg-gray-100 rounded-xl" />
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()

  const [query, setQuery]       = useState('')
  const [type, setType]         = useState<EntityType | 'all'>('all')
  const [empRange, setEmpRange] = useState<EmployeeRangeId | 'all'>('all')
  const [department, setDept]   = useState('')
  const [page, setPage]         = useState(1)

  const [entities, setEntities] = useState<Entity[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const doSearch = useCallback(async (p = 1, qOverride?: string) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)
    setSearched(true)
    if (p === 1) setEntities([])

    const q = qOverride ?? query
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (type !== 'all') params.set('type', type)
    if (empRange !== 'all') params.set('employeeRange', empRange)
    if (department) params.set('department', department)
    params.set('page', String(p))

    try {
      const res = await fetch(`/api/entities?${params}`, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setEntities(data.entities ?? [])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [query, type, empRange, department])

  function handleAnalyze(entity: Entity) {
    const params = new URLSearchParams({
      name: entity.name,
      lat: String(entity.lat),
      lon: String(entity.lon),
      type: entity.type,
      city: entity.city ?? '',
      address: entity.address ?? '',
      postcode: entity.postcode ?? '',
      siren: entity.siren ?? '',
      nafCode: entity.nafCode ?? '',
      nafLabel: entity.nafLabel ?? '',
      empLabel: entity.employeeRangeLabel ?? '',
      empId: entity.employeeRangeId ?? '',
      phone: entity.phone ?? '',
      email: entity.email ?? '',
      website: entity.website ?? '',
    })
    router.push(`/entity?${params}`)
  }

  const PER_PAGE = 25
  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">NilsRadar</span>
          </div>
          <span className="text-xs text-gray-400">Analyse de proximité · Centres commerciaux</span>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-8">
          <div className="flex items-center gap-8 mb-6">
            <LottiePlayer
              src="/lottie-cubes.json"
              className="hidden sm:block flex-shrink-0 w-32 h-32"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Bassins d'activité · France</p>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
                Identifiez vos sources<br className="hidden sm:block" /> de flux
              </h1>
              <p className="text-gray-500 max-w-2xl">
                Recherchez des entreprises, écoles, administrations ou hôpitaux, et identifiez les centres commerciaux
                à proximité pour évaluer leur potentiel de trafic.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={e => { e.preventDefault(); doSearch(1) }} className="flex gap-2 max-w-2xl mb-5">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Nom d'entreprise, établissement…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Recherche…' : 'Rechercher'}
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Type tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {TYPE_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    type === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {TYPE_ICONS[tab.id]} {tab.label}
                </button>
              ))}
            </div>

            {/* Employee range */}
            <Select
              value={empRange}
              onChange={v => setEmpRange(v as EmployeeRangeId | 'all')}
              options={[
                { value: 'all', label: 'Tous les effectifs' },
                ...EMPLOYEE_RANGES.map(r => ({ value: r.id, label: r.label + ' sal.' })),
              ]}
              className="w-44"
            />

            {/* Department */}
            <Select
              value={department}
              onChange={setDept}
              options={DEPT_OPTIONS}
              className="w-56"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 sm:px-8 py-8">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <span className="text-red-500 text-sm font-black">!</span>
            <div>
              <p className="text-sm font-semibold text-red-700">Erreur de recherche</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        {searched && !loading && !error && (
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-900">{total.toLocaleString('fr')}</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                entité{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
              </span>
            </div>
            {totalPages > 1 && (
              <span className="text-xs text-gray-400">Page {page} / {totalPages}</span>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        )}

        {/* Grid */}
        {!loading && entities.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {entities.map(e => (
                <EntityCard key={e.id} entity={e} onAnalyze={() => handleAnalyze(e)} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => doSearch(page - 1)}
                  disabled={page === 1 || loading}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-gray-300 disabled:opacity-40 transition-all"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => doSearch(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-gray-300 disabled:opacity-40 transition-all"
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty state (after search) */}
        {!loading && searched && entities.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center py-20 gap-3 text-center">
            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">🔍</div>
            <p className="font-semibold text-gray-600 text-sm">Aucun résultat</p>
            <p className="text-xs text-gray-400">Essayez un autre nom ou modifiez les filtres</p>
          </div>
        )}

        {/* Initial state */}
        {!searched && !loading && (
          <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center py-20 gap-4 text-center">
            <div className="text-4xl">📡</div>
            <p className="font-semibold text-gray-700">Lancez votre première recherche</p>
            <p className="text-sm text-gray-400 max-w-md">
              Recherchez par nom, puis filtrez par type d'entité, effectif ou département.
              Chaque résultat vous indique les centres commerciaux dans un rayon de 1 à 20 km.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 text-sm">
              {['LVMH', 'Renault', 'Hôpital Cochin', 'Lycée Louis-le-Grand'].map(ex => (
                <button
                  key={ex}
                  onClick={() => { setQuery(ex); doSearch(1, ex) }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 text-xs font-medium transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-4 text-xs text-gray-400 flex justify-between">
          <span>NilsRadar · Sources : SIRENE (data.gouv.fr), OpenStreetMap</span>
        </div>
      </footer>
    </div>
  )
}
