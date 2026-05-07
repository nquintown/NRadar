'use client'

import { useEffect, useRef, useState } from 'react'
import type { EntityWithDistance } from '@/types/entities'
import type { ShoppingCenter } from '@/types/pois'

interface Props {
  center: ShoppingCenter | null
  companies: EntityWithDistance[]
  selectedCompanyId: string | null
  onSelectCompany: (id: string | null) => void
}

export default function CenterMap({ center, companies, selectedCompanyId, onSelectCompany }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef        = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const centerMarkerRef   = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyLayerRef   = useRef<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // ── Init map once ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((containerRef.current as any)._leaflet_id) return

    import('leaflet').then(L => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!containerRef.current || (containerRef.current as any)._leaflet_id) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!, {
        center: [46.6, 2.3],
        zoom: 5,
        zoomControl: true,
      })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map)
      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // ── Update center marker ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      const map = mapRef.current
      if (centerMarkerRef.current) { centerMarkerRef.current.remove(); centerMarkerRef.current = null }
      if (!center) return

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:34px;height:34px;background:#1d4ed8;border-radius:8px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);font-size:15px;">🛍️</div>`,
        iconSize:   [34, 34],
        iconAnchor: [17, 17],
      })

      centerMarkerRef.current = L.marker([center.lat, center.lon], { icon })
        .addTo(map)
        .bindPopup(`<strong>${center.name}</strong>${center.city ? `<br>${center.city}` : ''}`)

      map.setView([center.lat, center.lon], 13)
      setTimeout(() => map.invalidateSize(), 50)
    })
  }, [center])

  // ── Update company markers ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      if (companyLayerRef.current) { companyLayerRef.current.remove() }
      const group = L.layerGroup()

      for (const co of companies) {
        if (co.lat == null || co.lon == null) continue
        const sel = co.id === selectedCompanyId
        const size = sel ? 14 : 10
        const color = sel ? '#16a34a' : '#4ade80'

        const icon = L.divIcon({
          className: '',
          html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
          iconSize:   [size, size],
          iconAnchor: [size / 2, size / 2],
        })

        L.marker([co.lat, co.lon], { icon })
          .bindPopup(`<strong>${co.name}</strong><br>${co.city ?? ''}<br>${co.distanceKm} km`)
          .on('click', () => onSelectCompany(co.id === selectedCompanyId ? null : co.id))
          .addTo(group)
      }

      group.addTo(mapRef.current)
      companyLayerRef.current = group
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, selectedCompanyId])

  // ── Invalidate size on fullscreen toggle ─────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current?.invalidateSize(), 120)
  }, [isFullscreen])

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50' : 'relative w-full h-full'}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Fullscreen toggle */}
      <button
        onClick={() => setIsFullscreen(f => !f)}
        className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-2 py-1 shadow-sm hover:bg-white text-[11px] font-semibold text-gray-600 flex items-center gap-1 transition-colors"
        title={isFullscreen ? 'Réduire' : 'Agrandir la carte'}
      >
        {isFullscreen ? '✕ Réduire' : '⛶ Agrandir'}
      </button>

      {/* Placeholder when no center selected */}
      {!center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 pointer-events-none gap-2">
          <span className="text-3xl opacity-40">🛍️</span>
          <p className="text-sm text-gray-400">Sélectionnez un centre commercial</p>
        </div>
      )}
    </div>
  )
}
