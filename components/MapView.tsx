'use client'

import { useEffect, useRef } from 'react'
import type { POI, SearchCenter } from '@/types/pois'
import { formatDistance } from '@/lib/calculateDistance'

interface Props {
  center: SearchCenter | null
  radius: number
  pois: POI[]
  selectedId: string | null
  onSelectPoi: (id: string) => void
}

// Loaded lazily to avoid SSR issues with window
export default function MapView({ center, radius, pois, selectedId, onSelectPoi }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circleRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const centerMarkerRef = useRef<any>(null)
  const centerRef = useRef(center)
  const radiusRef = useRef(radius)
  centerRef.current = center
  radiusRef.current = radius

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return
    // Guard against StrictMode double-mount: Leaflet sets _leaflet_id on the container
    if ((containerRef.current as any)._leaflet_id) return

    import('leaflet').then(L => {
      if (!containerRef.current || (containerRef.current as any)._leaflet_id) return
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const c = centerRef.current
      const map = L.map(containerRef.current!, {
        center: c ? [c.lat, c.lon] : [46.6, 2.3],
        zoom: c ? radiusToZoom(radiusRef.current) : 5,
        zoomControl: true,
      })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map)
      mapRef.current = map

      // If center is already known on mount, draw the marker + circle immediately
      if (c) {
        const centerIcon = L.divIcon({
          className: '',
          html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })
        centerMarkerRef.current = L.marker([c.lat, c.lon], { icon: centerIcon })
          .addTo(map)
          .bindPopup(`<strong>Centre</strong><br/>${c.displayName}`)
        circleRef.current = L.circle([c.lat, c.lon], {
          radius: radiusRef.current,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '6 4',
        }).addTo(map)
      }
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update map when center changes
  useEffect(() => {
    if (!mapRef.current || !center) return
    import('leaflet').then(L => {
      const map = mapRef.current

      if (centerMarkerRef.current) centerMarkerRef.current.remove()
      if (circleRef.current) circleRef.current.remove()

      const centerIcon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      centerMarkerRef.current = L.marker([center.lat, center.lon], { icon: centerIcon })
        .addTo(map)
        .bindPopup(`<strong>Centre</strong><br/>${center.displayName}`)

      circleRef.current = L.circle([center.lat, center.lon], {
        radius,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6 4',
      }).addTo(map)

      map.setView([center.lat, center.lon], radiusToZoom(radius))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, radius])

  // Update markers when pois change
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      pois.forEach(poi => {
        const isSelected = poi.id === selectedId
        const markerHtml = `<div style="
          width:${isSelected ? 14 : 10}px;
          height:${isSelected ? 14 : 10}px;
          background:${isSelected ? '#dc2626' : '#16a34a'};
          border:2px solid white;
          border-radius:50%;
          box-shadow:0 1px 4px rgba(0,0,0,.4);
          transition: all .15s;
        "></div>`

        const icon = L.divIcon({
          className: '',
          html: markerHtml,
          iconSize: [isSelected ? 14 : 10, isSelected ? 14 : 10],
          iconAnchor: [isSelected ? 7 : 5, isSelected ? 7 : 5],
        })
        const marker = L.marker([poi.lat, poi.lon], { icon })
          .addTo(mapRef.current)
          .bindPopup(buildPopup(poi))
          .on('click', () => onSelectPoi(poi.id))

        markersRef.current.push(marker)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pois, selectedId])

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div ref={containerRef} className="w-full h-full" />
      {!center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-3 pointer-events-none">
          <svg className="h-12 w-12 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">Recherchez une adresse pour afficher la carte</p>
        </div>
      )}
    </div>
  )
}

function buildPopup(poi: POI): string {
  const lines = [
    `<strong class="text-sm">${poi.name}</strong>`,
    `<span class="text-xs text-gray-500">${poi.categoryLabel} · ${formatDistance(poi.distance)}</span>`,
    poi.address ? `<span class="text-xs">${poi.address}</span>` : '',
    poi.phone ? `<a href="tel:${poi.phone}" class="text-xs text-blue-600">${poi.phone}</a>` : '',
    poi.website
      ? `<a href="${poi.website}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 truncate block max-w-[180px]">Site web</a>`
      : '',
  ].filter(Boolean)
  return `<div style="display:flex;flex-direction:column;gap:2px;min-width:140px">${lines.join('')}</div>`
}

function radiusToZoom(radius: number): number {
  if (radius <= 500) return 15
  if (radius <= 1000) return 14
  if (radius <= 2000) return 13
  if (radius <= 5000) return 12
  return 11
}
