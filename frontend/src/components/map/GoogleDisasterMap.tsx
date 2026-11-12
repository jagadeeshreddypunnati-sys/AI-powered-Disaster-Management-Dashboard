'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  shelterMarkers: any[]
  disasterZones: any[]
  evacuationRoutes: any[]
  apiKey?: string
}

declare global {
  interface Window {
    google?: any
    initRescueAiGoogleMap?: () => void
  }
}

export default function GoogleDisasterMap({ shelterMarkers, disasterZones, evacuationRoutes, apiKey }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const effectiveKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if script already on page
    if (window.google?.maps) {
      setScriptLoaded(true)
      return
    }

    if (!effectiveKey) {
      setLoadError('Google Maps API Key not detected in environment. Using demo view with OpenStreetMap fallback or enter key in settings.')
      return
    }

    const scriptId = 'google-maps-script-rescue-ai'
    if (document.getElementById(scriptId)) {
      setScriptLoaded(true)
      return
    }

    window.initRescueAiGoogleMap = () => {
      setScriptLoaded(true)
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${effectiveKey}&callback=initRescueAiGoogleMap&libraries=places,geometry`
    script.async = true
    script.defer = true
    script.onerror = () => {
      setLoadError('Failed to load Google Maps script. Check network or API key authorization.')
    }
    document.head.appendChild(script)

    return () => {
      // Keep script cached
    }
  }, [effectiveKey])

  useEffect(() => {
    if (!scriptLoaded || !mapContainerRef.current || !window.google?.maps) return

    const google = window.google
    const center = { lat: 13.0827, lng: 80.2707 } // Chennai emergency epicenter

    const map = new google.maps.Map(mapContainerRef.current, {
      center,
      zoom: 11,
      mapTypeId: 'terrain',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'simplified' }] }
      ]
    })
    mapInstanceRef.current = map

    const infoWindow = new google.maps.InfoWindow()

    // 1. Draw Disaster Zones (Circles)
    disasterZones.forEach(z => {
      const color = z.color === 'red' ? '#EF4444' : z.color === 'orange' ? '#F97316' : '#F59E0B'
      const circle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.22,
        map,
        center: { lat: z.lat, lng: z.lng },
        radius: (z.radius_km || 5) * 1000
      })

      circle.addListener('click', (ev: any) => {
        const d = z.data
        infoWindow.setContent(`
          <div style="font-family:Inter,sans-serif;padding:8px;max-width:260px;">
            <div style="color:#dc2626;font-weight:bold;font-size:13px;margin-bottom:4px;">⚠️ ${d.name}</div>
            <div style="font-size:11px;color:#334155;line-height:1.5;">
              <div>Hazard: <b>${d.disaster_type?.toUpperCase()}</b></div>
              <div>Severity: <b style="color:${color}">${d.risk_level?.toUpperCase()}</b></div>
              <div>Affected: <b>${d.affected_population?.toLocaleString()} people</b></div>
              <p style="margin-top:6px;color:#64748b;font-size:10px;">${d.description}</p>
            </div>
          </div>
        `)
        infoWindow.setPosition(ev.latLng)
        infoWindow.open(map)
      })
    })

    // 2. Draw Shelters (Markers)
    shelterMarkers.forEach(s => {
      const isDamaged = s.data.status === 'damaged' || s.data.status === 'closed'
      const markerColor = isDamaged ? '#94A3B8' : s.color === 'green' ? '#10B981' : s.color === 'orange' ? '#F97316' : '#EF4444'

      const marker = new google.maps.Marker({
        position: { lat: s.lat, lng: s.lng },
        map,
        title: s.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        }
      })

      marker.addListener('click', () => {
        const d = s.data
        infoWindow.setContent(`
          <div style="font-family:Inter,sans-serif;padding:8px;max-width:250px;">
            <div style="font-weight:bold;font-size:13px;color:#0f172a;margin-bottom:4px;">🏠 ${d.name}</div>
            <div style="font-size:11px;color:#475569;line-height:1.5;">
              <div>ID: <b>${d.shelter_id}</b></div>
              <div>Capacity: <b>${d.occupancy} / ${d.capacity}</b> (${d.available} available)</div>
              <div>Medical Facility: <b>${d.has_medical ? '✅ Yes' : '❌ No'}</b></div>
              <div>Risk Score: <b>${d.risk_score}</b></div>
              <div>Status: <span style="font-weight:bold;color:${markerColor}">${d.status?.toUpperCase()}</span></div>
            </div>
          </div>
        `)
        infoWindow.open(map, marker)
      })
    })

    // 3. Draw Evacuation Routes (Polylines)
    evacuationRoutes.forEach(r => {
      const poly = new google.maps.Polyline({
        path: r.points.map((p: any) => ({ lat: p.lat, lng: p.lng })),
        geodesic: true,
        strokeColor: r.color || '#3B82F6',
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map
      })

      poly.addListener('click', (ev: any) => {
        infoWindow.setContent(`
          <div style="font-family:Inter,sans-serif;font-size:12px;padding:4px;">
            <b>Evacuation Corridor:</b> ${r.name}
          </div>
        `)
        infoWindow.setPosition(ev.latLng)
        infoWindow.open(map)
      })
    })

  }, [scriptLoaded, shelterMarkers, disasterZones, evacuationRoutes])

  if (loadError) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
          🗺️
        </div>
        <h4 className="text-sm font-bold text-slate-800">Google Maps API Ready</h4>
        <p className="text-xs text-slate-500 max-w-md mt-1">{loadError}</p>
        <p className="text-[11px] text-slate-400 mt-2">
          Switch to OpenStreetMap view above to continue interactive exploration without credentials.
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainerRef} className="w-full h-full" />
      {!scriptLoaded && (
        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-rescue-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading Google Maps satellite &amp; disaster layers...</p>
          </div>
        </div>
      )}
    </div>
  )
}
