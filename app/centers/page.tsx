'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import AppHeader from '@/components/AppHeader'
import Select from '@/components/Select'
import type { EntityWithDistance, EntityType, EmployeeRangeId } from '@/types/entities'
import { EMPLOYEE_RANGES } from '@/types/entities'
import type { ShoppingCenter } from '@/types/pois'
import { resolveRegion, REGIONS_FR } from '@/lib/regions'

const CenterMap = dynamic(() => import('@/components/CenterMap'), { ssr: false })

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_TABS: { id: EntityType | 'all'; label: string }[] = [
  { id: 'all',        label: 'Toutes' },
  { id: 'enterprise', label: 'Entreprises' },
  { id: 'university', label: 'Universités' },
  { id: 'government', label: 'Adm. / Militaire' },
  { id: 'hospital',   label: 'Santé' },
]

const RADIUS_OPTIONS = [
  { value: 'all', label: 'Tous (triés par distance)' },
  { value: '5',   label: '< 5 km' },
  { value: '10',  label: '< 10 km' },
  { value: '20',  label: '< 20 km' },
  { value: '50',  label: '< 50 km' },
]

const PER_PAGE = 10

// ── Helpers ───────────────────────────────────────────────────────────────────

function deptFromPostcode(pc?: string): string {
  if (!pc) return ''
  const s = pc.replace(/\s/g, '')
  if (/^2[AB]/i.test(s)) return s.slice(0, 2).toUpperCase()
  if (s.length >= 2) return s.slice(0, 2)
  return ''
}

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
        selected ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
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
  const [centers,       setCenters]       = useState<EnrichedCenter[]>([])
  const [filterText,    setFilterText]    = useState('')
  const [filterRegion,  setFilterRegion]  = useState('')
  const [selectedCenter, setSelectedCenter] = useState<ShoppingCenter | null>(null)

  // ── Company search ──────────────────────────────────────────────────────────
  const [entityType,   setEntityType]   = useState<EntityType | 'all'>('all')
  const [empRange,     setEmpRange]     = useState<EmployeeRangeId | 'all'>('all')
  const [maxRadius,    setMaxRadius]    = useState('all')
  const [allCompanies, setAllCompanies] = useState<EntityWithDistance[]>([])
  const [apiTotal,     setApiTotal]     = useState(0)
  const [apiPage,      setApiPage]      = useState(1)
  const [uiPage,       setUiPage]       = useState(1)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)

  // ── Load centers from static JSON ───────────────────────────────────────────
  useEffect(() => {
    fetch('/shopping-centers.json')
      .then(r => r.json())
      .then((data: ShoppingCenter[]) => {
        const enriched = data.map(c => ({
          ...c,
          _region: resolveRegion(c.postcode, c.lat, c.lon) as string,
        }))
        setCenters(enriched)
      })
      .catch(console.error)
  }, [])

  // ── Filtered center list ────────────────────────────────────────────────────
  const filteredCenters = useMemo(() => {
    return centers.filter(c => {
      if (filterRegion && c._region !== filterRegion) return false
      if (filterText) {
        const q = filterText.toLowerCase()
        const match =
          c.name.toLowerCase().includes(q) ||
          (c.city ?? '').toLowerCase().includes(q) ||
          (c.detectedBrand ?? '').toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [centers, filterRegion, filterText])

  // ── Fetch companies near a center (explicit params to avoid stale closures) ─
  async function fetchFor(
    center: ShoppingCenter,
    page: number,
    reset: boolean,
    type: EntityType | 'all',
    emp: EmployeeRangeId | 'all',
  ) {
    const dept = deptFromPostcode(center.postcode)
    const params = new URLSearchParams({
      lat:  String(center.lat),
      lon:  String(center.lon),
      page: String(page),
    })
    if (dept)       params.set('department',    dept)
    if (type !== 'all') params.set('type',      type)
    if (emp  !== 'all') params.set('employeeRange', emp)

    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/companies-near?${params}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const entities: EntityWithDistance[] = data.entities ?? []
      if (reset) { setAllCompanies(entities); setUiPage(1) }
      else        setAllCompanies(prev => [...prev, ...entities])
      setApiTotal(data.total ?? 0)
      setApiPage(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // ── Select a center ─────────────────────────────────────────────────────────
  function handleSelectCenter(center: ShoppingCenter) {
    setSelectedCenter(center)
    setSelectedCompanyId(null)
    fetchFor(center, 1, true, entityType, empRange)
  }

  // ── Type / empRange change → refetch ────────────────────────────────────────
  function handleTypeChange(t: EntityType | 'all') {
    setEntityType(t)
    if (selectedCenter) fetchFor(selectedCenter, 1, true, t, empRange)
  }
  function handleEmpChange(r: EmployeeRangeId | 'all') {
    setEmpRange(r)
    if (selectedCenter) fetchFor(selectedCenter, 1, true, entityType, r)
  }

  // ── UI pagination (fetches next API page when needed) ───────────────────────
  async function goToPage(p: number) {
    const needed = p * PER_PAGE
    if (needed > allCompanies.length && allCompanies.length < apiTotal && selectedCenter) {
      await fetchFor(selectedCenter, apiPage + 1, false, entityType, empRange)
    }
    setUiPage(p)
  }

  // ── Derived display data ────────────────────────────────────────────────────
  const radiusFiltered = useMemo(() => {
    if (maxRadius === 'all') return allCompanies
    const r = parseFloat(maxRadius)
    return allCompanies.filter(c => c.distanceKm <= r)
  }, [allCompanies, maxRadius])

  const totalUiPages       = Math.ceil(radiusFiltered.length / PER_PAGE)
  const displayedCompanies = radiusFiltered.slice((uiPage - 1) * PER_PAGE, uiPage * PER_PAGE)
  const hasMoreApi         = allCompanies.length < apiTotal

  const regionOptions = [
    { value: '', label: 'Toutes les régions' },
    ...REGIONS_FR.map(r => ({ value: r, label: r })),
  ]

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          {/* Filters */}
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

          {/* Center list */}
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
              companies={allCompanies}
              selectedCompanyId={selectedCompanyId}
              onSelectCompany={id => setSelectedCompanyId(id === selectedCompanyId ? null : id)}
              activeRadiusKm={maxRadius !== 'all' ? parseFloat(maxRadius) : undefined}
            />
          </div>

          {/* Filter bar */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-5 py-2 flex flex-wrap gap-2 items-center">
            <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-xl">
              {TYPE_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTypeChange(tab.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${
                    entityType === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Select
              value={empRange}
              onChange={v => handleEmpChange(v as EmployeeRangeId | 'all')}
              options={[
                { value: 'all', label: 'Tous les effectifs' },
                ...EMPLOYEE_RANGES.map(r => ({ value: r.id, label: r.label + ' sal.' })),
              ]}
              className="w-40"
            />

            <Select
              value={maxRadius}
              onChange={setMaxRadius}
              options={RADIUS_OPTIONS}
              className="w-44"
            />

            {selectedCenter && (
              <span className="text-xs text-gray-400 ml-auto">
                {loading
                  ? 'Chargement…'
                  : `${radiusFiltered.length} résultat${radiusFiltered.length !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>

          {/* Table area — scrollable, map stays fixed */}
          <div className="flex-1 overflow-y-auto">

            {!selectedCenter ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-8">
                <div className="text-4xl">🛍️</div>
                <p className="font-semibold text-gray-600 text-sm">Sélectionnez un centre commercial</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  Cliquez sur un centre dans la liste pour afficher les entreprises à proximité sur la carte et dans le tableau.
                </p>
              </div>

            ) : error ? (
              <div className="p-5">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-700">Erreur de recherche</p>
                  <p className="text-xs text-red-500 mt-1">{error}</p>
                </div>
              </div>

            ) : (
              <div className="p-5 space-y-4">

                {/* Loading skeletons */}
                {loading && allCompanies.length === 0 && (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-12 bg-white rounded-xl border border-gray-100 animate-pulse" />
                    ))}
                  </div>
                )}

                {/* Company table */}
                {displayedCompanies.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                            Nom
                          </th>
                          <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 hidden sm:table-cell">
                            Adresse
                          </th>
                          <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 hidden md:table-cell">
                            Effectif
                          </th>
                          <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                            Distance
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedCompanies.map(co => (
                          <tr
                            key={co.id}
                            onClick={() => setSelectedCompanyId(co.id === selectedCompanyId ? null : co.id)}
                            className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${
                              co.id === selectedCompanyId
                                ? 'bg-green-50'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-gray-900 text-xs leading-snug">{co.name}</p>
                              {co.nafLabel && (
                                <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{co.nafLabel}</p>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-500 hidden sm:table-cell">
                              {[co.address, co.city].filter(Boolean).join(', ') || '—'}
                            </td>
                            <td className="px-4 py-2.5 hidden md:table-cell">
                              {co.employeeRangeLabel ? (
                                <span className="text-[10px] bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-semibold whitespace-nowrap">
                                  {co.employeeRangeLabel}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
                                {co.distanceKm} km
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Empty */}
                {!loading && displayedCompanies.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-sm text-gray-400">Aucune entreprise trouvée dans ce rayon</p>
                    <p className="text-xs text-gray-300 mt-1">Essayez d'agrandir le rayon ou de changer le type</p>
                  </div>
                )}

                {/* Pagination */}
                {(totalUiPages > 1 || hasMoreApi) && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => goToPage(uiPage - 1)}
                      disabled={uiPage === 1}
                      className="px-3 py-1.5 text-xs font-semibold border border-gray-200 bg-white rounded-lg hover:border-gray-300 disabled:opacity-40 transition-all"
                    >
                      ← Précédent
                    </button>
                    <span className="text-xs text-gray-400">
                      Page {uiPage}
                      {totalUiPages > 0 ? ` / ${totalUiPages}` : ''}
                      {hasMoreApi && ' (suite disponible)'}
                    </span>
                    <button
                      onClick={() => goToPage(uiPage + 1)}
                      disabled={loading || (uiPage >= totalUiPages && !hasMoreApi)}
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
