'use client'
import { useEffect, useRef } from 'react'

interface Props {
  shelterMarkers: any[]
  disasterZones: any[]
  evacuationRoutes: any[]
}

export default function DisasterMap({ shelterMarkers, disasterZones, evacuationRoutes }: Props) {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return
    
    // Dynamically import Leaflet
    import('leaflet').then(L => {
      // Fix default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })

      if (!mapContainerRef.current || mapRef.current) return

      const map = L.map(mapContainerRef.current, {
        center: [13.0827, 80.2707],
        zoom: 10,
        zoomControl: true,
      })
      mapRef.current = map

      // OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      // Color map for markers
      const colorMap: Record<string, string> = {
        green: '#10B981', yellow: '#F59E0B', orange: '#F97316', red: '#EF4444', gray: '#94A3B8'
      }

      // Add shelter markers
      shelterMarkers.forEach(m => {
        const color = colorMap[m.color] || '#3B82F6'
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:28px;height:28px;border-radius:50% 50% 50% 0;
            background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
            transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
          "><div style="transform:rotate(45deg);font-size:11px;color:white;font-weight:bold;">S</div></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -30],
        })
        const marker = L.marker([m.lat, m.lng], { icon }).addTo(map)
        const d = m.data
        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:220px;">
            <h3 style="font-size:13px;font-weight:700;margin:0 0 8px;color:#1e293b;">${d.name}</h3>
            <div style="font-size:11px;color:#64748b;line-height:1.6;">
              <div>🆔 <b>${d.shelter_id}</b></div>
              <div>📦 Capacity: <b>${d.occupancy}/${d.capacity}</b> (${d.available} free)</div>
              <div>🏥 Medical: <b>${d.has_medical ? '✅ Yes' : '❌ No'}</b></div>
              <div>⚠️ Risk: <b>${d.risk_score?.toFixed(2)}</b></div>
              <div>✅ Status: <b>${d.status?.toUpperCase()}</b></div>
              <div>📞 Contact: ${d.contact}</div>
            </div>
          </div>
        `)
      })

      // Add disaster zone circles
      disasterZones.forEach(z => {
        const color = colorMap[z.color] || '#EF4444'
        const circle = L.circle([z.lat, z.lng], {
          radius: (z.radius_km || 5) * 1000,
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '8, 4',
        }).addTo(map)
        const d = z.data
        circle.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:200px;">
            <h3 style="font-size:13px;font-weight:700;margin:0 0 8px;color:#1e293b;">⚠️ ${d.name}</h3>
            <div style="font-size:11px;color:#64748b;line-height:1.6;">
              <div>🌊 Type: <b>${d.disaster_type?.toUpperCase()}</b></div>
              <div>🔴 Risk: <b>${d.risk_level?.toUpperCase()}</b></div>
              <div>👥 Affected: <b>${d.affected_population?.toLocaleString()} people</b></div>
              <div>📝 ${d.description}</div>
            </div>
          </div>
        `)
        // Label
        L.marker([z.lat, z.lng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="font-size:10px;font-weight:600;color:${color};background:white;padding:2px 6px;border-radius:4px;border:1px solid ${color};white-space:nowrap;">${d.disaster_type?.toUpperCase()}</div>`,
            iconAnchor: [30, 10],
          })
        }).addTo(map)
      })

      // Add evacuation routes
      evacuationRoutes.forEach(r => {
        const points: [number, number][] = r.points.map((p: any) => [p.lat, p.lng])
        const poly = L.polyline(points, {
          color: r.color || '#3B82F6',
          weight: r.weight || 3,
          dashArray: '12, 6',
          opacity: 0.8,
        }).addTo(map)
        poly.bindPopup(`<b>${r.name}</b><br><small>Evacuation Route</small>`)
      })
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update markers when data changes
  useEffect(() => {
    if (!mapRef.current) return
    // Re-render markers on filter change would require more complex state management
    // For this implementation, the map re-mounts when filters change via key prop on parent
  }, [shelterMarkers, disasterZones, evacuationRoutes])

  return (
    <div ref={mapContainerRef} style={{ height: '100%', width: '100%', minHeight: 500 }} />
  )
}
