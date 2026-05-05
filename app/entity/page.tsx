'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import type { Entity, RadiusResult, MallProximity } from '@/types/entities'
import { ENTITY_TYPE_LABELS } from '@/types/entities'
import { exportToCsv, potentialScore as calcScore } from '@/lib/proximity'

const ProximityMap = dynamic(() => import('@/components/ProximityMap'), { ssr: false })

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-700 bg-green-50 border-green-200'
    : score >= 40 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-gray-600 bg-gray-50 border-gray-200'
  return (
    <span className={`text-xs font-bold border rounded-full px-3 py-1 ${color}`}>
      Score potentiel : {score}/100
    </span>
  )
}

// ── Radius row ────────────────────────────────────────────────────────────────

function RadiusRow({ r, active, onClick }: { r: RadiusResult; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
        active ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 hover:border-gray-300'
      }`}
    >
      <span className={`text-2xl font-black w-16 flex-shrink-0 tracking-tight ${active ? 'text-white' : 'text-gray-900'}`}>
        {r.radiusKm}<span className="text-2xl font-black">km</span>
      </span>
      <div className="flex-1">
        <div className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
          {r.count} centre{r.count !== 1 ? 's' : ''}
        </div>
        {r.malls.slice(0, 2).map(m => (
          <div key={m.id} className={`text-xs truncate ${active ? 'text-gray-300' : 'text-gray-400'}`}>
            {m.name} ({m.distanceKm} km)
          </div>
        ))}
        {r.malls.length > 2 && (
          <div className={`text-xs ${active ? 'text-gray-400' : 'text-gray-300'}`}>
            +{r.malls.length - 2} autres
          </div>
        )}
      </div>
      <span className={`text-xs ${active ? 'text-gray-300' : 'text-gray-400'}`}>
        {active ? '▼' : '▶'}
      </span>
    </button>
  )
}

// ── Mall table ────────────────────────────────────────────────────────────────

function MallTable({ malls }: { malls: MallProximity[] }) {
  if (!malls.length) return (
    <p className="text-sm text-gray-400 py-4 text-center">Aucun centre commercial dans ce rayon</p>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-2 pr-4">Nom</th>
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-2 pr-4">Ville</th>
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-2 pr-4">Enseigne</th>
            <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide py-2">Distance</th>
          </tr>
        </thead>
        <tbody>
          {malls.map(m => (
            <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-2.5 pr-4 font-medium text-gray-900">{m.name}</td>
              <td className="py-2.5 pr-4 text-gray-500">{m.city ?? '—'}</td>
              <td className="py-2.5 pr-4">
                {m.detectedBrand ? (
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{m.detectedBrand}</span>
                ) : <span className="text-gray-300">—</span>}
              </td>
              <td className="py-2.5 text-right font-semibold text-gray-900">{m.distanceKm} km</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Inner component (uses useSearchParams) ────────────────────────────────────

function EntityPageInner() {
  const router = useRouter()
  const sp = useSearchParams()

  const g = (k: string) => sp.get(k) || undefined
  const entity: Entity = {
    id: sp.get('siren') || 'unknown',
    type: (sp.get('type') as Entity['type']) || 'enterprise',
    name: sp.get('name') || 'Entité inconnue',
    city: g('city'),
    address: g('address'),
    postcode: g('postcode'),
    nafCode: g('nafCode'),
    nafLabel: g('nafLabel'),
    employeeRangeId: g('empId') as Entity['employeeRangeId'],
    employeeRangeLabel: g('empLabel'),
    siren: g('siren'),
    phone: g('phone'),
    email: g('email'),
    website: g('website'),
    lat: parseFloat(sp.get('lat') || ''),
    lon: parseFloat(sp.get('lon') || ''),
    source: 'sirene',
  }

  const [radii, setRadii]       = useState<RadiusResult[]>([])
  const [score, setScore]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [activeRadius, setActive] = useState(10)

  useEffect(() => {
    if (!entity.lat || !entity.lon || isNaN(entity.lat) || isNaN(entity.lon)) {
      setError('Coordonnées invalides')
      setLoading(false)
      return
    }
    fetch('/api/nearby-malls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: entity.lat, lon: entity.lon, entity }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setRadii(data.radii)
        setScore(data.potentialScore)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleExportCsv() {
    if (!radii.length) return
    const csv = exportToCsv([{ entity, radii, potentialScore: score }])
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entity.name.replace(/[^a-z0-9]/gi, '_')}_proximite.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportJson() {
    const data = { entity, radii, potentialScore: score, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entity.name.replace(/[^a-z0-9]/gi, '_')}_proximite.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeResult = radii.find(r => r.radiusKm === activeRadius)

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8 h-14 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-700 text-sm transition-colors"
          >
            ← Retour
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{entity.name}</p>
            <p className="text-xs text-gray-400">
              {ENTITY_TYPE_LABELS[entity.type]} · {entity.city ?? 'Localisation inconnue'}
            </p>
          </div>
          {!loading && !error && (
            <div className="flex items-center gap-2">
              <ScoreBadge score={score} />
              <button
                onClick={handleExportCsv}
                className="hidden sm:block text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ↓ CSV
              </button>
              <button
                onClick={handleExportJson}
                className="hidden sm:block text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ↓ JSON
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 sm:px-8 py-8">

        {/* Entity info card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Raison sociale</p>
            <p className="font-bold text-gray-900">{entity.name}</p>
          </div>
          {entity.nafLabel && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Activité (NAF)</p>
              <p className="text-sm text-gray-700">{entity.nafCode} · {entity.nafLabel}</p>
            </div>
          )}
          {entity.city && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Siège</p>
              <p className="text-sm text-gray-700">{entity.city}</p>
            </div>
          )}
          {entity.employeeRangeLabel && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Effectif</p>
              <p className="text-sm font-semibold text-gray-700">{entity.employeeRangeLabel} salariés</p>
            </div>
          )}
          {entity.siren && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">SIREN</p>
              <p className="font-mono text-sm text-gray-500">{entity.siren}</p>
            </div>
          )}
          {entity.phone && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Téléphone</p>
              <a href={`tel:${entity.phone}`} className="text-sm text-blue-600 hover:underline">{entity.phone}</a>
            </div>
          )}
          {entity.email && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <a href={`mailto:${entity.email}`} className="text-sm text-blue-600 hover:underline">{entity.email}</a>
            </div>
          )}
          {entity.website && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Site web</p>
              <a href={entity.website.startsWith('http') ? entity.website : `https://${entity.website}`}
                target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline block max-w-xs truncate">
                {entity.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {/* External enrichment links */}
          {entity.siren && (
            <div className="w-full border-t border-gray-100 pt-3 mt-1">
              <p className="text-xs text-gray-400 mb-2">Enrichissement</p>
              <div className="flex flex-wrap gap-2">
                <a href={`https://www.pappers.fr/entreprise/${entity.name.replace(/\s+/g, '-').toLowerCase()}-${entity.siren}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 text-gray-600 transition-colors">
                  📊 Pappers
                </a>
                <a href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(entity.name)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 text-blue-600 transition-colors">
                  💼 LinkedIn
                </a>
                <a href={`https://www.societe.com/cgi-bin/search?champs=${entity.siren}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 text-gray-600 transition-colors">
                  🔎 Societe.com
                </a>
                <a href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${entity.siren}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 text-gray-600 transition-colors">
                  🏛️ Annuaire public
                </a>
              </div>
            </div>
          )}
          <div className="sm:hidden flex gap-2 w-full">
            <button onClick={handleExportCsv} className="flex-1 text-xs font-semibold py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">↓ CSV</button>
            <button onClick={handleExportJson} className="flex-1 text-xs font-semibold py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">↓ JSON</button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-2xl flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Analyse des centres à proximité…</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-red-700 mb-1">Erreur d'analyse</p>
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && radii.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: radius selector */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                Centres par rayon
              </p>
              {radii.map(r => (
                <RadiusRow
                  key={r.radiusKm}
                  r={r}
                  active={r.radiusKm === activeRadius}
                  onClick={() => setActive(r.radiusKm)}
                />
              ))}
            </div>

            {/* Right: map + table */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* Map */}
              {entity.lat && entity.lon && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-80">
                  <ProximityMap
                    lat={entity.lat}
                    lon={entity.lon}
                    entityName={entity.name}
                    activeRadius={activeRadius}
                    malls={activeResult?.malls ?? []}
                  />
                </div>
              )}

              {/* Mall table */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  {activeResult?.count ?? 0} centres dans un rayon de {activeRadius} km
                </p>
                <MallTable malls={activeResult?.malls ?? []} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Page export (wrapped in Suspense for useSearchParams) ─────────────────────

export default function EntityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <EntityPageInner />
    </Suspense>
  )
}
