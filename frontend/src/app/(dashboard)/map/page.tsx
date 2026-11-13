'use client'
import { useState, useEffect } from 'react'
import { Filter, Layers, AlertTriangle, Globe, MapPin, RefreshCw, ZoomIn } from 'lucide-react'
import { api } from '@/lib/api'
import dynamic from 'next/dynamic'

// Dynamically import maps to prevent SSR leaflet window issues
const DisasterMap = dynamic(() => import('@/components/map/DisasterMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[620px] flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-rescue-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600 font-medium text-sm">Initializing High-Resolution Geospatial Engine...</p>
      </div>
    </div>
  ),
})

const GoogleDisasterMap = dynamic(() => import('@/components/map/GoogleDisasterMap'), { ssr: false })

const DISASTER_TYPES = ['all', 'flood', 'earthquake', 'cyclone', 'wildfire', 'landslide']

export default function MapPage() {
  const [mapData, setMapData] = useState<any>(null)
  const [filter, setFilter] = useState('all')
  const [mapEngine, setMapEngine] = useState<'leaflet' | 'google'>('leaflet')
  const [showShelters, setShowShelters] = useState(true)
  const [showZones, setShowZones] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  const [loading, setLoading] = useState(true)

  const fetchMapData = () => {
    setLoading(true)
    api.get('/api/maps/markers')
      .then(r => setMapData(r.data))
      .catch(() => setMapData(DEMO_MAP_DATA))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchMapData()
  }, [])

  const filteredZones = (mapData?.disaster_zones || []).filter((z: any) =>
    filter === 'all' || z.data?.disaster_type === filter || z.type === filter
  )

  const activeShelters = showShelters ? (mapData?.shelter_markers || []) : []
  const activeZones = showZones ? filteredZones : []
  const activeRoutes = showRoutes ? (mapData?.evacuation_routes || []) : []

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rescue-blue" />
            Disaster Monitoring Command Map
          </h1>
          <p className="text-sm text-gray-500">Interactive live geospatial command view with real-time hazard perimeters, shelters, and evacuation routes</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Engine Selector */}
          <div className="bg-white border border-rescue-border rounded-xl p-1 flex items-center shadow-sm text-xs">
            <button
              onClick={() => setMapEngine('leaflet')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                mapEngine === 'leaflet'
                  ? 'bg-rescue-blue text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              OpenStreetMap (Full)
            </button>
            <button
              onClick={() => setMapEngine('google')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition ${
                mapEngine === 'google'
                  ? 'bg-rescue-blue text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Google Maps
            </button>
          </div>

          <button
            onClick={fetchMapData}
            title="Refresh map telemetry"
            className="p-2 bg-white border border-rescue-border rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Layer Controls */}
      <div className="bg-white rounded-xl p-4 shadow-card border border-rescue-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Hazard Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-700">Hazard Filter:</span>
            <div className="flex flex-wrap gap-1.5">
              {DISASTER_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition capitalize ${
                    filter === t
                      ? 'bg-rescue-blue text-white shadow-xs font-semibold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Layer toggles */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Layers className="w-3.5 h-3.5" /> Layers:
            </div>
            {[
              { label: `Shelters (${activeShelters.length})`, state: showShelters, fn: setShowShelters },
              { label: `Hazard Zones (${activeZones.length})`, state: showZones, fn: setShowZones },
              { label: `Evac Routes (${activeRoutes.length})`, state: showRoutes, fn: setShowRoutes },
            ].map(({ label, state, fn }) => (
              <label key={label} className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={state}
                  onChange={e => fn(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-rescue-blue"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Map Legend */}
      <div className="bg-white rounded-xl px-4 py-2.5 shadow-card border border-rescue-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-gray-700">Facility Status:</span>
          {[
            { color: 'bg-rescue-green', label: 'Operational (<50% full)' },
            { color: 'bg-amber-400', label: 'Busy (50-80% full)' },
            { color: 'bg-orange-500', label: 'Overcrowded (>80% full)' },
            { color: 'bg-gray-400', label: 'Closed / Damaged' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
          <span>Centroid: 13.0827° N, 80.2707° E</span>
        </div>
      </div>

      {/* Main Map Box (Expansive Full View) */}
      <div className="flex-1 min-h-[640px] w-full rounded-2xl overflow-hidden shadow-card border border-rescue-border relative bg-slate-100">
        {loading ? (
          <div className="w-full h-full min-h-[640px] flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-rescue-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Rendering Geospatial Coordinates...</p>
            </div>
          </div>
        ) : mapEngine === 'google' ? (
          <GoogleDisasterMap
            shelterMarkers={activeShelters}
            disasterZones={activeZones}
            evacuationRoutes={activeRoutes}
          />
        ) : (
          <DisasterMap
            key={`map-${filter}-${showShelters}-${showZones}-${showRoutes}`}
            shelterMarkers={activeShelters}
            disasterZones={activeZones}
            evacuationRoutes={activeRoutes}
          />
        )}
      </div>
    </div>
  )
}

const DEMO_MAP_DATA = {
  shelter_markers: [
    { id: 1, type: 'shelter', lat: 13.0850, lng: 80.2101, color: 'green', title: 'Gandhi Community Center',
      data: { shelter_id: 'S-01', name: 'Gandhi Community Center', capacity: 800, occupancy: 320, available: 480, has_medical: true, risk_score: 0.08, status: 'operational', contact: 'Ravi Kumar (+91-9876543210)' } },
    { id: 2, type: 'shelter', lat: 13.0339, lng: 80.2676, color: 'orange', title: 'St. Thomas School Shelter',
      data: { shelter_id: 'S-02', name: 'St. Thomas School Shelter', capacity: 500, occupancy: 480, available: 20, has_medical: true, risk_score: 0.22, status: 'operational', contact: 'Sr. Mary Joseph' } },
    { id: 3, type: 'shelter', lat: 12.9249, lng: 80.1000, color: 'green', title: 'Tambaram Sports Complex',
      data: { shelter_id: 'S-03', name: 'Tambaram Sports Complex', capacity: 1200, occupancy: 410, available: 790, has_medical: false, risk_score: 0.12, status: 'operational', contact: 'Suresh Babu' } },
    { id: 4, type: 'shelter', lat: 12.9686, lng: 80.1529, color: 'green', title: 'DRDA Relief Camp Alpha',
      data: { shelter_id: 'S-04', name: 'DRDA Relief Camp Alpha', capacity: 600, occupancy: 190, available: 410, has_medical: true, risk_score: 0.10, status: 'operational', contact: 'K. Rajan' } },
    { id: 5, type: 'shelter', lat: 13.2000, lng: 80.3000, color: 'green', title: 'Red Hills Shelter',
      data: { shelter_id: 'S-05', name: 'Red Hills Shelter', capacity: 400, occupancy: 390, available: 10, has_medical: true, risk_score: 0.06, status: 'operational', contact: 'M. Senthil' } },
    { id: 6, type: 'shelter', lat: 13.1143, lng: 80.0982, color: 'green', title: 'Army Relief Center Bravo',
      data: { shelter_id: 'S-06', name: 'Army Relief Center Bravo', capacity: 2000, occupancy: 650, available: 1350, has_medical: true, risk_score: 0.05, status: 'operational', contact: 'Major Krishnan (+91-9876543215)' } },
    { id: 7, type: 'shelter', lat: 13.0489, lng: 80.0825, color: 'yellow', title: 'Poonamallee Community Hall',
      data: { shelter_id: 'S-07', name: 'Poonamallee Community Hall', capacity: 350, occupancy: 210, available: 140, has_medical: false, risk_score: 0.30, status: 'operational', contact: 'T. Murugan' } },
    { id: 8, type: 'shelter', lat: 13.0592, lng: 80.2804, color: 'gray', title: 'Coastal Road Shelter (DAMAGED / CLOSED)',
      data: { shelter_id: 'S-08', name: 'Coastal Road Shelter', capacity: 300, occupancy: 0, available: 0, has_medical: false, risk_score: 0.95, status: 'damaged', contact: 'DO NOT USE - Damaged' } },
    { id: 9, type: 'shelter', lat: 12.9674, lng: 79.9479, color: 'green', title: 'Sriperumbudur Mega Camp',
      data: { shelter_id: 'S-09', name: 'Sriperumbudur Mega Camp', capacity: 3000, occupancy: 800, available: 2200, has_medical: true, risk_score: 0.07, status: 'operational', contact: 'District Collector (+91-9876543217)' } },
    { id: 10, type: 'shelter', lat: 13.0418, lng: 80.2338, color: 'yellow', title: 'Red Cross Emergency Hub',
      data: { shelter_id: 'S-10', name: 'Red Cross Emergency Hub', capacity: 250, occupancy: 180, available: 70, has_medical: true, risk_score: 0.15, status: 'operational', contact: 'Red Cross Chapter' } },
  ],
  disaster_zones: [
    { id: 1, type: 'flood', lat: 13.0827, lng: 80.2707, color: 'red', radius_km: 15, title: 'Chennai Coastal Flood Zone',
      data: { name: 'Chennai Coastal Flood Zone', disaster_type: 'flood', risk_level: 'critical', affected_population: 12500, description: 'Severe coastal flooding along Cooum & Adyar basins due to storm surge.' } },
    { id: 2, type: 'cyclone', lat: 12.9716, lng: 80.0000, color: 'red', radius_km: 45, title: 'Bay of Bengal Cyclone Storm Surge',
      data: { name: 'Bay of Bengal Cyclone Storm Surge', disaster_type: 'cyclone', risk_level: 'critical', affected_population: 25000, description: 'Category 4 cyclonic storm approaching coastal corridor with 140 km/h winds.' } },
    { id: 3, type: 'earthquake', lat: 11.0168, lng: 76.9558, color: 'orange', radius_km: 20, title: 'Coimbatore Seismic Earthquake Zone',
      data: { name: 'Coimbatore Earthquake Zone', disaster_type: 'earthquake', risk_level: 'high', affected_population: 8700, description: 'M5.8 earthquake zone with secondary aftershocks.' } },
    { id: 4, type: 'wildfire', lat: 11.4133, lng: 76.6950, color: 'orange', radius_km: 12, title: 'Nilgiris Forest Wildfire',
      data: { name: 'Nilgiris Forest Wildfire', disaster_type: 'wildfire', risk_level: 'moderate', affected_population: 1800, description: 'Rapidly spreading brush fire advancing toward residential peripheries.' } },
    { id: 5, type: 'landslide', lat: 10.3524, lng: 76.5222, color: 'orange', radius_km: 8, title: 'Western Ghats Landslide Zone',
      data: { name: 'Western Ghats Landslide Zone', disaster_type: 'landslide', risk_level: 'high', affected_population: 3200, description: 'Multiple slope collapses blocking 3 primary arterial evacuation roads.' } },
  ],
  evacuation_routes: [
    { id: 'route-1', name: 'Coastal Evacuation Route Alpha (Adyar → Army Center S-06)', color: '#3B82F6', weight: 4,
      points: [{ lat: 13.0827, lng: 80.2707 }, { lat: 13.0469, lng: 80.0974 }, { lat: 13.1143, lng: 80.0982 }] },
    { id: 'route-2', name: 'Inland Evacuation Corridor Bravo (Cooum → Sriperumbudur S-09)', color: '#10B981', weight: 4,
      points: [{ lat: 13.0850, lng: 80.2101 }, { lat: 13.0200, lng: 80.0800 }, { lat: 12.9674, lng: 79.9479 }] },
  ],
}
