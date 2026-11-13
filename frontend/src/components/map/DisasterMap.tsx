'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  shelterMarkers: any[]
  disasterZones: any[]
  evacuationRoutes: any[]
}

export default function DisasterMap({ shelterMarkers, disasterZones, evacuationRoutes }: Props) {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const [mapStyle, setMapStyle] = useState<'osm' | 'satellite' | 'topo'>('osm')

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined') return

    let isMounted = true
    let resizeObserver: ResizeObserver | null = null

    import('leaflet').then(L => {
      if (!isMounted || !mapContainerRef.current) return

      // Clean up previous instance if any
      if (mapRef.current) {
        try {
          mapRef.current.remove()
        } catch {
          // ignore
        }
        mapRef.current = null
      }

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })

      const map = L.map(mapContainerRef.current, {
        center: [13.0827, 80.2707],
        zoom: 10,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      mapRef.current = map

      // Tile layers
      const tileUrls = {
        osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      }

      const activeTile = L.tileLayer(tileUrls[mapStyle], {
        attribution: '© OpenStreetMap, Esri, USGS',
        maxZoom: 19,
      }).addTo(map)
      tileLayerRef.current = activeTile

      // LayerGroup for dynamic elements
      const layerGroup = L.layerGroup().addTo(map)
      layerGroupRef.current = layerGroup

      // Ensure proper sizing with multiple invalidations (prevents half-tile rendering)
      const triggerResize = () => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      }

      triggerResize()
      const t1 = setTimeout(triggerResize, 100)
      const t2 = setTimeout(triggerResize, 350)
      const t3 = setTimeout(triggerResize, 800)

      window.addEventListener('resize', triggerResize)

      if (mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          triggerResize()
        })
        resizeObserver.observe(mapContainerRef.current)
      }

      // Draw markers initially
      renderMarkers(L, layerGroup)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    })

    return () => {
      isMounted = false
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove()
        } catch {
          // ignore
        }
        mapRef.current = null
      }
    }
  }, [mapStyle])

  // Function to render markers into LayerGroup
  const renderMarkers = (L: any, layerGroup: any) => {
    if (!layerGroup || !L) return
    layerGroup.clearLayers()

    const colorMap: Record<string, string> = {
      green: '#10B981',
      yellow: '#F59E0B',
      orange: '#F97316',
      red: '#EF4444',
      gray: '#64748B',
    }

    const bounds: [number, number][] = []

    // 1. Shelter Markers
    shelterMarkers.forEach(m => {
      const color = colorMap[m.color] || '#3B82F6'
      bounds.push([m.lat, m.lng])

      const icon = L.divIcon({
        className: 'custom-shelter-pin',
        html: `<div style="
          width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
          background: ${color}; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: transform 0.2s ease;
        ">
          <div style="transform: rotate(45deg); font-size: 12px; color: white; font-weight: 800; font-family: Inter, sans-serif;">S</div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -34],
      })

      const marker = L.marker([m.lat, m.lng], { icon })
      const d = m.data || {}
      marker.bindPopup(`
        <div style="font-family:Inter,system-ui,sans-serif; min-width:240px; padding: 4px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 6px;">
            <span style="font-size:10px; font-weight:700; background:${color}22; color:${color}; padding:2px 8px; border-radius:12px; border:1px solid ${color}44;">
              ${d.shelter_id || 'SHELTER'}
            </span>
            <span style="font-size:11px; font-weight:700; color:${d.status === 'damaged' ? '#EF4444' : '#10B981'};">
              ${(d.status || 'OPERATIONAL').toUpperCase()}
            </span>
          </div>
          <h3 style="font-size:14px; font-weight:700; margin:0 0 6px; color:#0f172a;">${d.name || m.title}</h3>
          <div style="font-size:12px; color:#475569; line-height:1.6; border-top: 1px solid #f1f5f9; padding-top: 6px;">
            <div>📦 Available Capacity: <b>${d.available ?? (d.capacity - d.occupancy)} / ${d.capacity || 0}</b></div>
            <div>🏥 Medical Staff: <b>${d.has_medical ? '✅ Equipped' : '❌ None'}</b></div>
            <div>🛡️ Hazard Risk: <b>${d.risk_score ? (d.risk_score * 100).toFixed(0) + '%' : 'Low'}</b></div>
            <div>📞 Direct Contact: <span style="font-family:monospace; color:#1E56A0;">${d.contact || 'Control Room'}</span></div>
          </div>
        </div>
      `)
      layerGroup.addLayer(marker)
    })

    // 2. Disaster Zones (Pulsing Circles & Hazard Badges)
    disasterZones.forEach(z => {
      const color = colorMap[z.color] || '#EF4444'
      bounds.push([z.lat, z.lng])

      const circle = L.circle([z.lat, z.lng], {
        radius: (z.radius_km || 15) * 1000,
        color: color,
        fillColor: color,
        fillOpacity: 0.18,
        weight: 3,
        dashArray: '8, 6',
      })

      const d = z.data || {}
      circle.bindPopup(`
        <div style="font-family:Inter,system-ui,sans-serif; min-width:230px; padding: 4px;">
          <div style="font-size:11px; font-weight:800; color:#EF4444; text-transform:uppercase; margin-bottom:4px; display:flex; align-items:center; gap:4px;">
            🚨 ACTIVE DISASTER PERIMETER
          </div>
          <h3 style="font-size:14px; font-weight:700; margin:0 0 6px; color:#0f172a;">${d.name || z.title}</h3>
          <div style="font-size:12px; color:#475569; line-height:1.6;">
            <div>🌊 Type: <b>${(d.disaster_type || 'DISASTER').toUpperCase()}</b></div>
            <div>🔴 Severity: <b>${(d.risk_level || 'CRITICAL').toUpperCase()}</b></div>
            <div>👥 Population at Risk: <b>${d.affected_population?.toLocaleString() || 'Thousands'}</b></div>
            <div style="margin-top:6px; font-size:11px; background:#FEF2F2; color:#991B1B; padding:6px; border-radius:6px; border:1px solid #F87171;">
              ${d.description || 'Evacuate immediately towards inland shelters.'}
            </div>
          </div>
        </div>
      `)
      layerGroup.addLayer(circle)

      // Disaster Label Marker
      const labelIcon = L.divIcon({
        className: 'disaster-badge',
        html: `<div style="
          font-size: 11px; font-weight: 700; color: white; background: ${color};
          padding: 3px 8px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 1px solid white; white-space: nowrap; transform: translate(-50%, -50%);
          display: flex; align-items: center; gap: 4px;
        ">
          <span>⚠️</span><span>${(d.disaster_type || 'ZONE').toUpperCase()}</span>
        </div>`,
        iconAnchor: [0, 0],
      })
      layerGroup.addLayer(L.marker([z.lat, z.lng], { icon: labelIcon }))
    })

    // 3. Evacuation Routes
    evacuationRoutes.forEach(r => {
      const points: [number, number][] = r.points.map((p: any) => [p.lat, p.lng])
      const poly = L.polyline(points, {
        color: r.color || '#3B82F6',
        weight: 4,
        dashArray: '10, 8',
        opacity: 0.9,
      })
      poly.bindPopup(`
        <div style="font-family:Inter,sans-serif; font-size:12px;">
          <b>🛣️ ${r.name || 'Evacuation Corridor'}</b><br/>
          <span style="color:#1E56A0; font-weight:600;">Designated Emergency Transit Route</span>
        </div>
      `)
      layerGroup.addLayer(poly)
    })
  }

  // Update markers when props change
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return
    import('leaflet').then(L => {
      renderMarkers(L, layerGroupRef.current)
    })
  }, [shelterMarkers, disasterZones, evacuationRoutes])

  // Recenter helper
  const handleRecenter = () => {
    if (!mapRef.current) return
    mapRef.current.setView([13.0827, 80.2707], 10, { animate: true })
    mapRef.current.invalidateSize()
  }

  // Fit all markers
  const handleFitAll = () => {
    if (!mapRef.current) return
    const allPoints: [number, number][] = [
      ...shelterMarkers.map(s => [s.lat, s.lng] as [number, number]),
      ...disasterZones.map(z => [z.lat, z.lng] as [number, number]),
    ]
    if (allPoints.length > 0) {
      import('leaflet').then(L => {
        const bounds = L.latLngBounds(allPoints)
        mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true })
      })
    }
  }

  return (
    <div className="relative w-full h-full min-h-[620px] rounded-xl overflow-hidden shadow-inner">
      {/* Map Canvas Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '620px',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
      />

      {/* Floating Map HUD Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Style Selector */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-lg border border-slate-200 flex items-center text-xs">
          <button
            onClick={() => setMapStyle('osm')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              mapStyle === 'osm' ? 'bg-rescue-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Streets
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              mapStyle === 'satellite' ? 'bg-rescue-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle('topo')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              mapStyle === 'topo' ? 'bg-rescue-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Terrain
          </button>
        </div>

        {/* Quick Nav Tools */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-lg border border-slate-200 flex flex-col gap-1">
          <button
            onClick={handleFitAll}
            title="Fit all markers in view"
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition text-left flex items-center gap-1.5"
          >
            <span>🔍</span> Fit All Zones
          </button>
          <button
            onClick={handleRecenter}
            title="Recenter map to Chennai Central"
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition text-left flex items-center gap-1.5"
          >
            <span>🎯</span> Center Chennai
          </button>
        </div>
      </div>

      {/* Map Live Status Badge */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-md flex items-center gap-2 text-xs font-medium text-slate-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Geospatial Engine: Active | {shelterMarkers.length} Shelters | {disasterZones.length} Hazard Zones</span>
      </div>
    </div>
  )
}
