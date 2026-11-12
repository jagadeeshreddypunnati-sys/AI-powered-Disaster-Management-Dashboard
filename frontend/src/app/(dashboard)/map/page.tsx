'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Filter, Layers, Info, AlertTriangle, MapPin, Globe } from 'lucide-react'
import { api } from '@/lib/api'
import dynamic from 'next/dynamic'

// Dynamically import maps to avoid SSR issues
const DisasterMap = dynamic(() => import('@/components/map/DisasterMap'), { ssr: false })
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

  useEffect(() => {
    api.get('/api/maps/markers')
      .then(r => setMapData(r.data))
      .catch(() => setMapData(DEMO_MAP_DATA))
      .finally(() => setLoading(false))
  }, [])

  const filteredZones = mapData?.disaster_zones?.filter((z: any) =>
    filter === 'all' || z.data?.disaster_type === filter
  ) || []

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Disaster Monitoring Map</h1>
          <p className="text-sm text-gray-500">Interactive geospatial command view with real-time disaster zones and shelter locations</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Map Engine Toggle */}
          <div className="bg-white border border-rescue-border rounded-xl p-1 flex items-center shadow-sm text-xs">
            <button
              onClick={() => setMapEngine('leaflet')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                mapEngine === 'leaflet'
                  ? 'bg-rescue-blue text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              OpenStreetMap
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

          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5" />
            Simulated locations
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-4 shadow-card border border-rescue-border">
        <div className="flex flex-wrap items-center gap-4">
          {/* Disaster type filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex gap-1.5">
              {DISASTER_TYPES.map(t => (
                <button key={t} onClick={() => setFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition capitalize
                    ${filter === t ? 'bg-rescue-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          {/* Layer toggles */}
          <div className="flex items-center gap-3 ml-auto">
            <Layers className="w-4 h-4 text-gray-500" />
            {[
              { label: 'Shelters', state: showShelters, fn: setShowShelters },
              { label: 'Disaster Zones', state: showZones, fn: setShowZones },
              { label: 'Routes', state: showRoutes, fn: setShowRoutes },
            ].map(({ label, state, fn }) => (
              <label key={label} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                <input type="checkbox" checked={state} onChange={e => fn(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-rescue-blue" />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Map Legend */}
      <div className="bg-white rounded-xl p-3 shadow-card border border-rescue-border">
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="font-medium text-gray-700">Legend:</span>
          {[
            { color: 'bg-rescue-green', label: 'Safe Shelter' },
            { color: 'bg-yellow-400', label: 'Moderate Risk' },
            { color: 'bg-orange-500', label: 'High Risk' },
            { color: 'bg-rescue-red', label: 'Critical Danger' },
            { color: 'bg-gray-400', label: 'Closed/Damaged' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 min-h-[500px] rounded-xl overflow-hidden shadow-card border border-rescue-border relative">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-rescue-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Loading map...</p>
            </div>
          </div>
        ) : mapEngine === 'google' ? (
          <GoogleDisasterMap
            shelterMarkers={showShelters ? (mapData?.shelter_markers || []) : []}
            disasterZones={showZones ? filteredZones : []}
            evacuationRoutes={showRoutes ? (mapData?.evacuation_routes || []) : []}
          />
        ) : (
          <DisasterMap
            shelterMarkers={showShelters ? (mapData?.shelter_markers || []) : []}
            disasterZones={showZones ? filteredZones : []}
            evacuationRoutes={showRoutes ? (mapData?.evacuation_routes || []) : []}
          />
        )}
      </div>
    </div>
  )
}

const DEMO_MAP_DATA = {
  shelter_markers: [
    { id: 1, type: 'shelter', lat: 13.0850, lng: 80.2101, color: 'green', title: 'Gandhi Community Center',
      data: { shelter_id: 'S-01', name: 'Gandhi Community Center', capacity: 800, occupancy: 320, available: 480, has_medical: true, risk_score: 0.08, status: 'operational', contact: 'Ravi Kumar' } },
    { id: 2, type: 'shelter', lat: 13.0339, lng: 80.2676, color: 'orange', title: 'St. Thomas School Shelter',
      data: { shelter_id: 'S-02', name: 'St. Thomas School Shelter', capacity: 500, occupancy: 480, available: 20, has_medical: true, risk_score: 0.22, status: 'operational', contact: 'Sr. Mary' } },
    { id: 3, type: 'shelter', lat: 12.9249, lng: 80.1000, color: 'green', title: 'Tambaram Sports Complex',
      data: { shelter_id: 'S-03', name: 'Tambaram Sports Complex', capacity: 1200, occupancy: 410, available: 790, has_medical: false, risk_score: 0.12, status: 'operational', contact: 'Suresh Babu' } },
    { id: 6, type: 'shelter', lat: 13.1143, lng: 80.0982, color: 'green', title: 'Army Relief Center',
      data: { shelter_id: 'S-06', name: 'Army Relief Center Bravo', capacity: 2000, occupancy: 650, available: 1350, has_medical: true, risk_score: 0.05, status: 'operational', contact: 'Major Krishnan' } },
    { id: 8, type: 'shelter', lat: 13.0592, lng: 80.2804, color: 'gray', title: 'Coastal Road Damaged (CLOSED)',
      data: { shelter_id: 'S-08', name: 'Coastal Road Damaged Shelter', capacity: 300, occupancy: 0, available: 0, has_medical: false, risk_score: 0.95, status: 'damaged', contact: 'N/A' } },
  ],
  disaster_zones: [
    { id: 1, type: 'disaster_zone', lat: 13.0827, lng: 80.2707, color: 'red', radius_km: 15, title: 'Chennai Coastal Flood Zone',
      data: { name: 'Chennai Coastal Flood Zone', disaster_type: 'flood', risk_level: 'critical', affected_population: 12500, description: 'Severe flooding in coastal areas' } },
    { id: 3, type: 'disaster_zone', lat: 11.0168, lng: 76.9558, color: 'orange', radius_km: 20, title: 'Coimbatore Earthquake Zone',
      data: { name: 'Coimbatore Earthquake Zone', disaster_type: 'earthquake', risk_level: 'high', affected_population: 8700, description: 'M5.8 earthquake zone' } },
    { id: 5, type: 'disaster_zone', lat: 12.9716, lng: 80.0000, color: 'red', radius_km: 50, title: 'Bay of Bengal Cyclone',
      data: { name: 'Bay of Bengal Cyclone Zone', disaster_type: 'cyclone', risk_level: 'critical', affected_population: 25000, description: 'Category 4 cyclone expected' } },
  ],
  evacuation_routes: [
    { id: 'route-1', name: 'Coastal Evacuation Route Alpha', color: '#3B82F6', weight: 3,
      points: [{ lat: 13.0827, lng: 80.2707 }, { lat: 13.0469, lng: 80.0974 }, { lat: 13.1143, lng: 80.0982 }] },
  ],
}
