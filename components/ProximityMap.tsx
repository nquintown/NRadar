'use client'

import { useEffect, useRef } from 'react'
import type { MallProximity } from '@/types/entities'

interface Props {
  lat: number
  lon: number
  entityName: string
  activeRadius: number
  malls: MallProximity[]
}

export default function ProximityMap({ lat, lon, entityName, activeRadius, malls }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const layerRef = useRef<unknown>(null)

  useEffect(() => {
    if (!divRef.current) return

    // Dynamic import of Leaflet to avoid SSR issues
    import('leaflet').then(L => {
      // Fix default icon issue with webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (L as any).map(divRef.current, {
          center: [lat, lon],
          zoom: 12,
          zoomControl: true,
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(L as any).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 18,
        }).addTo(map)
        mapRef.current = map
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = mapRef.current as any

      // Clear old layers
      if (layerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (layerRef.current as any).remove()
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const group = (L as any).layerGroup()

      // Radius circle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(L as any).circle([lat, lon], {
        radius: activeRadius * 1000,
        color: '#111827',
        fillColor: '#111827',
        fillOpacity: 0.04,
        weight: 1.5,
        dashArray: '6 4',
      }).addTo(group)

      // Entity marker (blue)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entityIcon = (L as any).divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;background:#111827;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px;">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(L as any).marker([lat, lon], { icon: entityIcon })
        .bindPopup(`<strong>${entityName}</strong>`)
        .addTo(group)

      // Mall markers (red)
      for (const mall of malls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mallIcon = (L as any).divIcon({
          className: '',
          html: `<div style="width:24px;height:24px;background:#dc2626;border-radius:4px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);font-size:10px;">🛍️</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(L as any).marker([mall.lat, mall.lon], { icon: mallIcon })
          .bindPopup(`<strong>${mall.name}</strong><br>${mall.city ?? ''}<br><em>${mall.distanceKm} km</em>`)
          .addTo(group)
      }

      group.addTo(map)
      layerRef.current = group

      // Fit bounds
      const bounds: [number, number][] = [[lat, lon], ...malls.map(m => [m.lat, m.lon] as [number, number])]
      if (bounds.length > 1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.fitBounds((L as any).latLngBounds(bounds), { padding: [30, 30], maxZoom: 14 })
      } else {
        map.setView([lat, lon], 13)
      }
    })
  }, [lat, lon, activeRadius, malls, entityName])

  return <div ref={divRef} style={{ width: '100%', height: '100%' }} />
}
