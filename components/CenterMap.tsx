'use client'

import { useEffect, useRef, useState } from 'react'
import type { MallProximity } from '@/types/entities'
import type { ShoppingCenter } from '@/types/pois'

interface Props {
  center: ShoppingCenter | null
  nearby: MallProximity[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  activeRadiusKm?: number
}

export default function CenterMap({ center, nearby, selectedId, onSelect, activeRadiusKm }: Props) {
  const containerRef    = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef          = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const centerMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nearbyLayerRef  = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radiusCircleRef = useRef<any>(null)
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
      const map = L.map(containerRef.current!, { center: [46.6, 2.3], zoom: 5, zoomControl: true })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map)
      mapRef.current = map
    })

    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [])

  // ── Selected center marker ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      const map = mapRef.current
      if (centerMarkerRef.current) { centerMarkerRef.current.remove(); centerMarkerRef.current = null }
      if (!center) return

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:34px;height:34px;background:#1d4ed8;border-radius:8px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);font-size:15px;">🛍️</div>`,
        iconSize: [34, 34], iconAnchor: [17, 17],
      })
      centerMarkerRef.current = L.marker([center.lat, center.lon], { icon })
        .addTo(map)
        .bindPopup(`<strong>${center.name}</strong>${center.city ? `<br>${center.city}` : ''}`)
      map.setView([center.lat, center.lon], 13)
      setTimeout(() => map.invalidateSize(), 50)
    })
  }, [center])

  // ── Radius circle ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      if (radiusCircleRef.current) { radiusCircleRef.current.remove(); radiusCircleRef.current = null }
      if (!center || !activeRadiusKm) return
      radiusCircleRef.current = L.circle([center.lat, center.lon], {
        radius: activeRadiusKm * 1000,
        color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.05,
        weight: 1.5, dashArray: '6 4',
      }).addTo(mapRef.current)
    })
  }, [center, activeRadiusKm])

  // ── Nearby center markers ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      if (nearbyLayerRef.current) nearbyLayerRef.current.remove()
      const group = L.layerGroup()

      for (const mall of nearby) {
        const sel  = mall.id === selectedId
        const size = sel ? 28 : 22
        const bg   = mall.detectedBrand
          ? (sel ? '#ea580c' : '#fb923c')   // orange = branded center
          : (sel ? '#6b7280' : '#d1d5db')   // gray   = unbranded
        const label = mall.detectedBrand ? mall.detectedBrand.slice(0, 2).toUpperCase() : '·'

        const icon = L.divIcon({
          className: '',
          html: `<div style="width:${size}px;height:${size}px;background:${bg};border-radius:5px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 5px rgba(0,0,0,.3);font-size:${sel ? 9 : 7}px;font-weight:700;color:white;letter-spacing:-0.5px">${label}</div>`,
          iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        })

        L.marker([mall.lat, mall.lon], { icon })
          .bindPopup(`<strong>${mall.name}</strong>${mall.detectedBrand ? `<br><em>${mall.detectedBrand}</em>` : ''}<br>${mall.city ?? ''}<br>${mall.distanceKm} km`)
          .on('click', () => onSelect(mall.id === selectedId ? null : mall.id))
          .addTo(group)
      }

      group.addTo(mapRef.current)
      nearbyLayerRef.current = group
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearby, selectedId])

  // ── Fullscreen invalidate ─────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current?.invalidateSize(), 120)
  }, [isFullscreen])

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50' : 'relative w-full h-full'}>
      <div ref={containerRef} className="w-full h-full" />

      <button
        onClick={() => setIsFullscreen(f => !f)}
        className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-2 py-1 shadow-sm hover:bg-white text-[11px] font-semibold text-gray-600 flex items-center gap-1 transition-colors"
        title={isFullscreen ? 'Réduire' : 'Agrandir la carte'}
      >
        {isFullscreen ? '✕ Réduire' : '⛶ Agrandir'}
      </button>

      {!center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 pointer-events-none gap-2">
          <span className="text-3xl opacity-40">🛍️</span>
          <p className="text-sm text-gray-400">Sélectionnez un centre commercial</p>
        </div>
      )}
    </div>
  )
}
