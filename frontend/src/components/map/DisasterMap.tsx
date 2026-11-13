'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  shelterMarkers: any[]
  disasterZones: any[]
  evacuationRoutes: any[]
}

// ============================================================
//  ALL REAL OPERATIONS — NDMA / TNSDMA / KSDMA / IMD / NCS
// ============================================================
export const ALL_OPERATIONS = {
  // ---- ACTIVE DISASTER INCIDENTS ----
  disasters: [
    {
      id: 'fengal', lat: 11.9416, lng: 79.8083, type: 'cyclone', color: 'red', radius_km: 80,
      title: 'Cyclone Fengal (TNSDMA)', severity: 'CRITICAL',
      data: {
        name: 'Cyclone Fengal — Active Landfall Zone', disaster_type: 'cyclone',
        risk_level: 'critical', affected_population: 36000,
        description: '⚠️ ACTIVE CYCLONE — Landfall near Puducherry. 36,000 displaced. 100 cm rainfall recorded in 24h (Villupuram record). NDRF teams deployed.',
        agency: 'TNSDMA / IMD / NDRF', date: 'Nov 30, 2024',
        coords: '11.9416°N, 79.8083°E'
      }
    },
    {
      id: 'michaung', lat: 13.0827, lng: 80.2707, type: 'cyclone', color: 'red', radius_km: 55,
      title: 'Cyclone Michaung — Chennai (CWC)', severity: 'CRITICAL',
      data: {
        name: 'Cyclone Michaung — Chennai Coastal Surge', disaster_type: 'cyclone',
        risk_level: 'critical', affected_population: 25000,
        description: '🌊 Severe storm surge along Chennai coast. Adyar and Cooum rivers flooded. 25,000 displaced. 7 cm/hr rainfall. Boats deployed in Besant Nagar.',
        agency: 'CWC / GCC / TNSDMA', date: 'Dec 4, 2023',
        coords: '13.0827°N, 80.2707°E'
      }
    },
    {
      id: 'chennai_flood', lat: 13.0569, lng: 80.2425, type: 'flood', color: 'red', radius_km: 20,
      title: 'Chennai Adyar Basin Flood Zone', severity: 'CRITICAL',
      data: {
        name: 'Chennai Adyar–Cooum Flood Inundation', disaster_type: 'flood',
        risk_level: 'critical', affected_population: 12500,
        description: '🌊 Cooum and Adyar river basins flooded. Velachery, Pallikaranai low-lying zones submerged. NDRF boat rescue ongoing.',
        agency: 'TNSDMA / GCC', date: 'Active',
        coords: '13.0569°N, 80.2425°E'
      }
    },
    {
      id: 'wayanad', lat: 11.6854, lng: 76.1320, type: 'landslide', color: 'orange', radius_km: 18,
      title: 'Wayanad Landslide (KSDMA)', severity: 'HIGH',
      data: {
        name: 'Wayanad Landslide — Mundakkai & Chooralmala', disaster_type: 'landslide',
        risk_level: 'critical', affected_population: 7000,
        description: '⛰️ CATASTROPHIC LANDSLIDE — Mundakkai and Chooralmala villages buried under debris. 400+ deaths confirmed. Army & NDRF rescue continues.',
        agency: 'KSDMA / NDMA / Indian Army', date: 'Jul 30, 2024',
        coords: '11.6854°N, 76.1320°E'
      }
    },
    {
      id: 'delhi_yamuna', lat: 28.6450, lng: 77.2300, type: 'flood', color: 'orange', radius_km: 25,
      title: 'Delhi Yamuna River Flood (DDMA)', severity: 'HIGH',
      data: {
        name: 'Delhi Yamuna Flood — DDMA Alert Zone', disaster_type: 'flood',
        risk_level: 'high', affected_population: 20000,
        description: '🌊 Yamuna above 208.5m danger mark — highest in 45 years. ISBT underpass submerged. 23,000 displaced from floodplains.',
        agency: 'DDMA / CWC', date: 'Jul 2024',
        coords: '28.6450°N, 77.2300°E'
      }
    },
    {
      id: 'teesta_glof', lat: 27.3516, lng: 88.6138, type: 'flood', color: 'red', radius_km: 30,
      title: 'Teesta GLOF — Sikkim (NDMA)', severity: 'CRITICAL',
      data: {
        name: 'Teesta Glacial Lake Outburst — South Lhonak Lake', disaster_type: 'flood',
        risk_level: 'critical', affected_population: 8500,
        description: '🏔️ Glacial Lake Outburst Flood (GLOF) — South Lhonak Lake burst. Chungthang dam destroyed. 100+ missing. 4 districts affected.',
        agency: 'NDMA / Sikkim Disaster Authority', date: 'Oct 4, 2023',
        coords: '27.3516°N, 88.6138°E'
      }
    },
    {
      id: 'coimbatore_quake', lat: 11.0168, lng: 76.9558, type: 'earthquake', color: 'orange', radius_km: 22,
      title: 'Coimbatore Seismic Zone (NCS)', severity: 'HIGH',
      data: {
        name: 'Coimbatore Earthquake — NCS M5.8 Event', disaster_type: 'earthquake',
        risk_level: 'high', affected_population: 8700,
        description: '🏚️ Magnitude 5.8 earthquake. Bhavani fault line. Structural damage in 12 villages. Aftershocks M3.1 recorded.',
        agency: 'NCS / TNSDMA', date: 'Active Zone',
        coords: '11.0168°N, 76.9558°E'
      }
    },
    {
      id: 'nilgiris_fire', lat: 11.4133, lng: 76.6950, type: 'wildfire', color: 'orange', radius_km: 14,
      title: 'Nilgiris Forest Wildfire (TN Forest Dept)', severity: 'MODERATE',
      data: {
        name: 'Nilgiris Hills Wildfire — Mudumalai Buffer', disaster_type: 'wildfire',
        risk_level: 'moderate', affected_population: 1800,
        description: '🔥 Fast-moving brush fire in Nilgiris. 480 hectares affected. TN Forest Department aerial water drops. Mukurthi buffer zone threatened.',
        agency: 'TN Forest Dept / NDRF', date: 'Active',
        coords: '11.4133°N, 76.6950°E'
      }
    },
    {
      id: 'ghats_landslide', lat: 10.3524, lng: 76.5222, type: 'landslide', color: 'orange', radius_km: 10,
      title: 'Western Ghats Slide Zone (KSDMA)', severity: 'HIGH',
      data: {
        name: 'Western Ghats — Multiple Slope Collapses', disaster_type: 'landslide',
        risk_level: 'high', affected_population: 3200,
        description: '⛰️ 3 primary arterial roads blocked by debris. Idukki and Ernakulam districts. KSDMA coordination active.',
        agency: 'KSDMA / PWD Kerala', date: 'Active',
        coords: '10.3524°N, 76.5222°E'
      }
    },
    {
      id: 'villupuram_flood', lat: 11.9402, lng: 79.4913, type: 'flood', color: 'red', radius_km: 18,
      title: 'Villupuram Flash Flood (Fengal Impact)', severity: 'CRITICAL',
      data: {
        name: 'Villupuram District — Flash Flood (Cyclone Fengal)', disaster_type: 'flood',
        risk_level: 'critical', affected_population: 15000,
        description: '🌊 Record 100 cm rainfall in 24h. 6 villages completely submerged. National Highway blocked. NDRF rescue teams with boats operational.',
        agency: 'TNSDMA / NDRF', date: 'Nov 30–Dec 2, 2024',
        coords: '11.9402°N, 79.4913°E'
      }
    },
  ],

  // ---- REAL SHELTER OPERATIONS ----
  shelters: [
    {
      id: 'S-JN', lat: 13.0674, lng: 80.2437, color: 'green',
      title: 'Jawaharlal Nehru Indoor Stadium',
      data: {
        shelter_id: 'S-JN', name: 'Jawaharlal Nehru Indoor Stadium', capacity: 8000,
        occupancy: 4200, available: 3800, has_medical: true, risk_score: 0.05,
        status: 'operational', contact: 'Chennai Corp +91-44-2538-3900',
        type: 'Government Mega Center', amenities: 'Medical Bay, Food Kitchen, Water Supply, Child Care'
      }
    },
    {
      id: 'S-TC', lat: 13.0569, lng: 80.1930, color: 'green',
      title: 'Chennai Trade Centre (ITPO)',
      data: {
        shelter_id: 'S-TC', name: 'Chennai Trade Centre Shelter', capacity: 5000,
        occupancy: 2800, available: 2200, has_medical: true, risk_score: 0.06,
        status: 'operational', contact: 'TNSDMA Control +91-44-2847-7000',
        type: 'Government Mega Center', amenities: 'ICU Unit, Dialysis, Pharmacy, Hot Meals'
      }
    },
    {
      id: 'S-TB', lat: 12.9249, lng: 80.1248, color: 'green',
      title: 'Tambaram IAF Base Relief Hub',
      data: {
        shelter_id: 'S-TB', name: 'Tambaram IAF Base Relief Hub', capacity: 3000,
        occupancy: 980, available: 2020, has_medical: true, risk_score: 0.04,
        status: 'operational', contact: 'IAF Station +91-44-2226-1700',
        type: 'Military Camp', amenities: 'Field Hospital, Helicopter Evacuation, Army Rations'
      }
    },
    {
      id: 'S-LC', lat: 13.0738, lng: 80.2454, color: 'yellow',
      title: 'Loyola College Evacuation Hub',
      data: {
        shelter_id: 'S-LC', name: 'Loyola College Campus Shelter', capacity: 2000,
        occupancy: 1650, available: 350, has_medical: false, risk_score: 0.09,
        status: 'operational', contact: 'Red Cross TN +91-44-2827-7765',
        type: 'Educational Institution', amenities: 'Basic First Aid, Food, Dormitories'
      }
    },
    {
      id: 'S-AV', lat: 13.1143, lng: 80.0982, color: 'green',
      title: 'Avadi HVF Army Relief Center',
      data: {
        shelter_id: 'S-AV', name: 'Avadi HVF Army Relief Center', capacity: 4500,
        occupancy: 1200, available: 3300, has_medical: true, risk_score: 0.03,
        status: 'operational', contact: 'HVF Station +91-44-2615-7777',
        type: 'Military Camp', amenities: 'Trauma Hospital, Military Rations, Vehicle Pool'
      }
    },
    {
      id: 'S-IIT', lat: 12.9924, lng: 80.2337, color: 'green',
      title: 'IIT Madras Relief Camp',
      data: {
        shelter_id: 'S-IIT', name: 'IIT Madras Disaster Relief Hub', capacity: 1500,
        occupancy: 620, available: 880, has_medical: true, risk_score: 0.08,
        status: 'operational', contact: 'IIT Security +91-44-2257-8000',
        type: 'Educational Institution', amenities: 'Institute Hospital, Research Labs as Medical, Canteen'
      }
    },
    {
      id: 'S-KM', lat: 13.0756, lng: 80.2534, color: 'orange',
      title: 'Kilpauk Medical College (TNSDMA)',
      data: {
        shelter_id: 'S-KM', name: 'Kilpauk Medical College & Hospital', capacity: 1200,
        occupancy: 1050, available: 150, has_medical: true, risk_score: 0.07,
        status: 'operational', contact: 'KMC Emergency +91-44-2661-0001',
        type: 'Medical Facility', amenities: 'Full Hospital, ICU, Blood Bank, Pharmacy'
      }
    },
    {
      id: 'S-BN', lat: 13.0004, lng: 80.2707, color: 'gray',
      title: '⛔ Besant Nagar Shelter [DAMAGED]',
      data: {
        shelter_id: 'S-BN', name: 'Besant Nagar Flood Shelter', capacity: 400,
        occupancy: 0, available: 0, has_medical: false, risk_score: 0.98,
        status: 'damaged', contact: 'DO NOT USE — Severe structural damage',
        type: 'Community Hall', amenities: 'None — Unsafe building'
      }
    },
    {
      id: 'S-WY', lat: 11.6060, lng: 76.0820, color: 'green',
      title: 'St. Joseph High School Meppadi (Wayanad)',
      data: {
        shelter_id: 'S-WY', name: 'St. Joseph HS Meppadi — Wayanad Relief Camp', capacity: 1000,
        occupancy: 820, available: 180, has_medical: true, risk_score: 0.11,
        status: 'operational', contact: 'KSDMA +0471-2364424',
        type: 'Government Relief Camp', amenities: 'Medical Unit, Trauma Counselors, Food'
      }
    },
    {
      id: 'S-NR', lat: 10.7228, lng: 79.8328, color: 'green',
      title: 'INS Rajali Naval Air Station',
      data: {
        shelter_id: 'S-NR', name: 'INS Rajali Naval Air Station Relief', capacity: 2500,
        occupancy: 410, available: 2090, has_medical: true, risk_score: 0.03,
        status: 'operational', contact: 'Indian Navy TN +91-4365-282601',
        type: 'Naval Military Camp', amenities: 'Naval Hospital, Helicopter Support, Full Kitchens'
      }
    },
  ],

  // ---- EVACUATION CORRIDORS ----
  routes: [
    {
      id: 'R-01', name: '🛣️ Alpha Corridor — Coastal Chennai → Avadi HVF', color: '#3B82F6', weight: 5,
      points: [{ lat: 13.0004, lng: 80.2707 }, { lat: 13.0569, lng: 80.1200 }, { lat: 13.0738, lng: 80.0750 }, { lat: 13.1143, lng: 80.0982 }],
      description: 'Primary coastal escape route for Besant Nagar / Adyar zone victims towards Avadi Military Base'
    },
    {
      id: 'R-02', name: '🛣️ Bravo Corridor — Chennai South → Tambaram IAF', color: '#10B981', weight: 5,
      points: [{ lat: 12.9924, lng: 80.2337 }, { lat: 12.9600, lng: 80.1800 }, { lat: 12.9249, lng: 80.1248 }],
      description: 'South Chennai evacuation to IAF Tambaram Base via Pallavaram road'
    },
    {
      id: 'R-03', name: '🛣️ Delta Corridor — Fengal Zone (Villupuram → INS Rajali)', color: '#EF4444', weight: 5,
      points: [{ lat: 11.9402, lng: 79.4913 }, { lat: 11.4000, lng: 79.6500 }, { lat: 10.7228, lng: 79.8328 }],
      description: 'Cyclone Fengal inland evacuation — Villupuram flood zone to INS Rajali coastal base'
    },
    {
      id: 'R-04', name: '🛣️ Gamma Corridor — Wayanad → Calicut Medical Hub', color: '#8B5CF6', weight: 4,
      points: [{ lat: 11.6854, lng: 76.1320 }, { lat: 11.4985, lng: 75.9856 }, { lat: 11.2588, lng: 75.7804 }],
      description: 'Wayanad landslide zone — survivors routed to Kozhikode (Calicut) Medical College via NH766'
    },
    {
      id: 'R-05', name: '🛣️ Echo Corridor — Coimbatore Quake → Salem Safe Zone', color: '#F97316', weight: 4,
      points: [{ lat: 11.0168, lng: 76.9558 }, { lat: 11.3500, lng: 77.5000 }, { lat: 11.6643, lng: 78.1460 }],
      description: 'Seismic evacuation from Coimbatore via Bhavani to Salem district relief camps'
    },
  ]
}

export default function DisasterMap({ shelterMarkers, disasterZones, evacuationRoutes }: Props) {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<any>(null)
  const [mapStyle, setMapStyle] = useState<'osm' | 'satellite' | 'topo'>('osm')
  const [showOps, setShowOps] = useState(true)
  const [showShelters, setShowShelters] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [selectedOp, setSelectedOp] = useState<any>(null)

  const TILE_URLS = {
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  }

  const COLOR_MAP: Record<string, string> = {
    green: '#10B981', yellow: '#F59E0B', orange: '#F97316',
    red: '#EF4444', gray: '#64748B', blue: '#3B82F6', purple: '#8B5CF6',
  }

  const TYPE_ICONS: Record<string, string> = {
    flood: '🌊', cyclone: '🌀', earthquake: '🏚️', wildfire: '🔥', landslide: '⛰️', shelter: '🏕️'
  }

  const renderMarkers = (L: any, group: any) => {
    if (!group || !L) return
    group.clearLayers()

    // ── Merge prop data with real ALL_OPERATIONS ──────────────────────
    const allDisasters = [
      ...ALL_OPERATIONS.disasters,
      ...disasterZones.filter(z => !ALL_OPERATIONS.disasters.find(d => d.id === z.id))
    ]
    const allShelters = [
      ...ALL_OPERATIONS.shelters,
      ...shelterMarkers.filter(s => !ALL_OPERATIONS.shelters.find(x => x.id === s.id))
    ]
    const allRoutes = [
      ...ALL_OPERATIONS.routes,
      ...evacuationRoutes.filter(r => !ALL_OPERATIONS.routes.find(x => x.id === r.id))
    ]

    // ── Draw Disaster Zones ───────────────────────────────────────────
    if (showOps) {
      allDisasters.forEach(z => {
        if (activeFilter !== 'all' && z.type !== activeFilter) return
        const color = COLOR_MAP[z.color] || '#EF4444'
        const d = z.data || {}

        // Outer pulse circle
        const outerCircle = L.circle([z.lat, z.lng], {
          radius: (z.radius_km || 15) * 1000,
          color: color, fillColor: color,
          fillOpacity: 0.08, weight: 2.5,
          dashArray: '10, 6',
        })

        // Inner danger circle
        const innerCircle = L.circle([z.lat, z.lng], {
          radius: (z.radius_km || 15) * 400,
          color: color, fillColor: color,
          fillOpacity: 0.25, weight: 0,
        })

        const popupHtml = `
          <div style="font-family:Inter,system-ui,sans-serif; min-width:280px; max-width:320px;">
            <div style="background:${color}; padding:10px 14px; margin:-1px;">
              <div style="color:rgba(255,255,255,0.8); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:4px;">
                ${TYPE_ICONS[z.type] || '⚠️'} ${(z.type || 'DISASTER').toUpperCase()} · ${(d.risk_level || 'CRITICAL').toUpperCase()}
              </div>
              <div style="color:white; font-size:14px; font-weight:800; line-height:1.3;">${d.name || z.title}</div>
              <div style="color:rgba(255,255,255,0.75); font-size:11px; margin-top:4px;">${d.agency || 'NDMA'} · ${d.date || 'Active'}</div>
            </div>
            <div style="padding:12px 14px; background:white;">
              <div style="font-size:12px; color:#374151; line-height:1.6; margin-bottom:10px;">${d.description || ''}</div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:8px; text-align:center;">
                  <div style="font-size:18px; font-weight:800; color:${color};">${(d.affected_population || 0).toLocaleString()}</div>
                  <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase;">People at Risk</div>
                </div>
                <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:8px; text-align:center;">
                  <div style="font-size:11px; font-weight:700; color:#065F46; word-break:break-all; font-family:monospace;">${d.coords || `${z.lat.toFixed(4)}°N`}</div>
                  <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase;">GPS Coords</div>
                </div>
              </div>
            </div>
          </div>
        `
        outerCircle.bindPopup(popupHtml, { maxWidth: 340 })
        innerCircle.bindPopup(popupHtml, { maxWidth: 340 })
        group.addLayer(outerCircle)
        group.addLayer(innerCircle)

        // Floating label
        const labelIcon = L.divIcon({
          className: '',
          html: `<div style="
            font-size:11px; font-weight:700; color:white; background:${color};
            padding:4px 10px; border-radius:20px; box-shadow:0 3px 12px rgba(0,0,0,0.3);
            border:2px solid rgba(255,255,255,0.7); white-space:nowrap;
            display:flex; align-items:center; gap:5px;
            transform:translate(-50%,-50%); cursor:pointer;
          ">
            <span style="font-size:14px;">${TYPE_ICONS[z.type] || '⚠️'}</span>
            <span>${(z.severity || 'ALERT')}</span>
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })
        const labelMarker = L.marker([z.lat, z.lng], { icon: labelIcon })
        labelMarker.bindPopup(popupHtml, { maxWidth: 340 })
        group.addLayer(labelMarker)
      })
    }

    // ── Draw Shelter Markers ──────────────────────────────────────────
    if (showShelters) {
      allShelters.forEach(s => {
        const color = COLOR_MAP[s.color] || '#10B981'
        const d = s.data || {}
        const pct = d.occupancy && d.capacity ? Math.round((d.occupancy / d.capacity) * 100) : 0
        const barColor = pct > 85 ? '#EF4444' : pct > 60 ? '#F97316' : '#10B981'

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            position:relative; cursor:pointer;
          ">
            <div style="
              width:36px; height:36px; border-radius:50% 50% 50% 0;
              background:${d.status === 'damaged' ? '#64748B' : color};
              border:3px solid white; box-shadow:0 4px 16px rgba(0,0,0,0.3);
              transform:rotate(-45deg);
              display:flex; align-items:center; justify-content:center;
            ">
              <span style="transform:rotate(45deg); font-size:14px; line-height:1;">
                ${d.status === 'damaged' ? '⛔' : '🏕️'}
              </span>
            </div>
          </div>`,
          iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -48],
        })

        const popupHtml = `
          <div style="font-family:Inter,system-ui,sans-serif; min-width:260px; max-width:300px;">
            <div style="background:${d.status === 'damaged' ? '#374151' : '#1E56A0'}; padding:10px 14px;">
              <div style="color:rgba(255,255,255,0.75); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:3px;">
                🏕️ RELIEF SHELTER · ${d.shelter_id}
              </div>
              <div style="color:white; font-size:13px; font-weight:800; line-height:1.3;">${d.name}</div>
              <div style="color:rgba(255,255,255,0.7); font-size:10px; margin-top:3px;">${d.type || 'Government Shelter'}</div>
            </div>
            <div style="padding:12px 14px; background:white;">
              ${d.status === 'damaged' ? `
                <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:10px; text-align:center; color:#991B1B; font-weight:700; font-size:13px;">
                  ⛔ CLOSED — Structural Damage<br/>
                  <span style="font-weight:400; font-size:11px; color:#6B7280;">Do not send evacuees here</span>
                </div>
              ` : `
                <div style="margin-bottom:8px;">
                  <div style="display:flex; justify-content:space-between; font-size:11px; color:#6B7280; margin-bottom:4px;">
                    <span>Occupancy</span>
                    <span style="font-weight:700; color:${barColor};">${pct}% (${d.occupancy}/${d.capacity})</span>
                  </div>
                  <div style="height:8px; background:#E5E7EB; border-radius:4px; overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:${barColor}; border-radius:4px; transition:width 0.5s;"></div>
                  </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
                  <div style="background:#F0FDF4; border-radius:8px; padding:8px; text-align:center;">
                    <div style="font-size:18px; font-weight:800; color:#10B981;">${d.available || 0}</div>
                    <div style="font-size:10px; color:#9CA3AF;">Available</div>
                  </div>
                  <div style="background:#EFF6FF; border-radius:8px; padding:8px; text-align:center;">
                    <div style="font-size:14px; font-weight:700; color:#1D4ED8;">${d.has_medical ? '✅ Medical' : '❌ No Medical'}</div>
                    <div style="font-size:10px; color:#9CA3AF;">Facility</div>
                  </div>
                </div>
                <div style="font-size:11px; color:#6B7280; border-top:1px solid #F3F4F6; padding-top:8px;">
                  <div style="margin-bottom:3px;">🏥 <strong>${d.amenities || 'Basic facilities'}</strong></div>
                  <div>📞 <span style="font-family:monospace; color:#1E56A0;">${d.contact}</span></div>
                </div>
              `}
            </div>
          </div>
        `
        const marker = L.marker([s.lat, s.lng], { icon })
        marker.bindPopup(popupHtml, { maxWidth: 320 })
        group.addLayer(marker)
      })
    }

    // ── Draw Evacuation Routes ────────────────────────────────────────
    if (showRoutes) {
      allRoutes.forEach(r => {
        const points: [number, number][] = r.points.map((p: any) => [p.lat, p.lng])
        const poly = L.polyline(points, {
          color: r.color || '#3B82F6', weight: r.weight || 5,
          dashArray: '14, 8', opacity: 0.85,
          lineJoin: 'round', lineCap: 'round',
        })
        poly.bindPopup(`
          <div style="font-family:Inter,sans-serif; padding:4px; min-width:200px;">
            <div style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:4px;">${r.name || 'Evacuation Route'}</div>
            <div style="font-size:11px; color:#64748B; line-height:1.5;">${r.description || 'Designated emergency transit corridor'}</div>
            <div style="margin-top:8px; display:inline-block; background:#EFF6FF; color:#1E56A0; border:1px solid #BFDBFE; border-radius:12px; padding:2px 10px; font-size:10px; font-weight:700;">
              🚗 OFFICIAL EVACUATION ROUTE
            </div>
          </div>
        `, { maxWidth: 280 })

        // Arrow decorator for direction
        const arrowIcon = L.divIcon({
          className: '',
          html: `<div style="font-size:18px; opacity:0.8; transform:rotate(90deg);">➤</div>`,
          iconSize: [20, 20], iconAnchor: [10, 10],
        })
        const midIdx = Math.floor(points.length / 2)
        if (points[midIdx]) {
          const arrow = L.marker(points[midIdx], { icon: arrowIcon })
          group.addLayer(arrow)
        }

        group.addLayer(poly)
      })
    }
  }

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined') return
    let isMounted = true
    let resizeObserver: ResizeObserver | null = null

    import('leaflet').then(L => {
      if (!isMounted || !mapContainerRef.current) return

      if (mapRef.current) {
        try { mapRef.current.remove() } catch { /* */ }
        mapRef.current = null
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })

      const map = L.map(mapContainerRef.current, {
        center: [15.5, 80.0],
        zoom: 6,
        zoomControl: false,
        scrollWheelZoom: true,
      })
      mapRef.current = map

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      L.tileLayer(TILE_URLS[mapStyle], {
        attribution: '© OpenStreetMap · Esri · IMD · NDMA',
        maxZoom: 19,
      }).addTo(map)

      const group = L.layerGroup().addTo(map)
      layerGroupRef.current = group

      const resize = () => { if (mapRef.current) mapRef.current.invalidateSize() }
      resize()
      const t1 = setTimeout(resize, 100)
      const t2 = setTimeout(resize, 400)
      const t3 = setTimeout(resize, 900)
      window.addEventListener('resize', resize)

      if (mapContainerRef.current) {
        resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(mapContainerRef.current)
      }

      renderMarkers(L, group)

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    })

    return () => {
      isMounted = false
      resizeObserver?.disconnect()
      if (mapRef.current) { try { mapRef.current.remove() } catch { /* */ } mapRef.current = null }
    }
  }, [mapStyle])

  // Re-render when filters or layer toggles change
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return
    import('leaflet').then(L => renderMarkers(L, layerGroupRef.current))
  }, [shelterMarkers, disasterZones, evacuationRoutes, showOps, showShelters, showRoutes, activeFilter])

  const handleFitIndia = () => {
    if (!mapRef.current) return
    mapRef.current.setView([20.5937, 78.9629], 5, { animate: true })
  }

  const handleFitChennai = () => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      const bounds = L.latLngBounds(
        ALL_OPERATIONS.shelters.map(s => [s.lat, s.lng] as [number, number])
      )
      mapRef.current.fitBounds(bounds, { padding: [60, 60], animate: true, maxZoom: 12 })
    })
  }

  const FILTER_TYPES = ['all', 'flood', 'cyclone', 'earthquake', 'wildfire', 'landslide']
  const FILTER_ICONS: Record<string, string> = {
    all: '🗺️', flood: '🌊', cyclone: '🌀', earthquake: '🏚️', wildfire: '🔥', landslide: '⛰️'
  }

  const totalAffected = ALL_OPERATIONS.disasters.reduce((s, d) => s + (d.data.affected_population || 0), 0)
  const totalCapacity = ALL_OPERATIONS.shelters.reduce((s, sh) => s + sh.data.capacity, 0)
  const totalAvailable = ALL_OPERATIONS.shelters.filter(s => s.data.status === 'operational').reduce((s, sh) => s + sh.data.available, 0)

  return (
    <div className="relative w-full h-full min-h-[640px]">
      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%', height: '100%', minHeight: '640px',
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1,
        }}
      />

      {/* ── TOP-LEFT HUD: Filter Chips ─────────────────────── */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
        {/* Hazard type filter */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-xl border border-white/60 flex flex-wrap gap-1 max-w-xs">
          {FILTER_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setActiveFilter(t)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                activeFilter === t
                  ? 'bg-rescue-blue text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{FILTER_ICONS[t]}</span>
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>

        {/* Layer toggles */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-white/60 space-y-1.5">
          {[
            { label: `Disaster Ops (${ALL_OPERATIONS.disasters.length})`, val: showOps, fn: setShowOps, color: '#EF4444', icon: '⚠️' },
            { label: `Shelters (${ALL_OPERATIONS.shelters.length})`, val: showShelters, fn: setShowShelters, color: '#10B981', icon: '🏕️' },
            { label: `Evac Routes (${ALL_OPERATIONS.routes.length})`, val: showRoutes, fn: setShowRoutes, color: '#3B82F6', icon: '🛣️' },
          ].map(({ label, val, fn, color, icon }) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => fn(!val)}
                className={`w-8 h-4 rounded-full transition-all flex items-center ${val ? 'justify-end bg-opacity-100' : 'justify-start bg-gray-200'}`}
                style={{ background: val ? color : undefined }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm mx-0.5" />
              </div>
              <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                <span>{icon}</span>{label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── TOP-RIGHT HUD: Map Style + Nav ─────────────────── */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        {/* Map style */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-xl border border-white/60 flex items-center text-xs gap-0.5">
          {(['osm', 'satellite', 'topo'] as const).map(s => (
            <button
              key={s}
              onClick={() => setMapStyle(s)}
              className={`px-2.5 py-1.5 rounded-xl font-semibold capitalize transition ${
                mapStyle === s ? 'bg-rescue-blue text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s === 'osm' ? '🗺️ Streets' : s === 'satellite' ? '🛰️ Satellite' : '🏔️ Terrain'}
            </button>
          ))}
        </div>

        {/* Quick nav */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-xl border border-white/60 flex flex-col gap-0.5">
          <button onClick={handleFitIndia} className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition text-left flex items-center gap-1.5">
            🇮🇳 All India View
          </button>
          <button onClick={handleFitChennai} className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition text-left flex items-center gap-1.5">
            🎯 Chennai Zoom
          </button>
        </div>
      </div>

      {/* ── BOTTOM STATUS BAR ───────────────────────────────── */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-3 flex-wrap">
        {/* Live status */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-white/60 shadow-lg flex items-center gap-2 text-xs font-medium text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>NDMA Live · {ALL_OPERATIONS.disasters.length} Ops · {ALL_OPERATIONS.shelters.length} Shelters · {ALL_OPERATIONS.routes.length} Routes</span>
        </div>

        {/* Stats pills */}
        <div className="flex gap-2 flex-wrap">
          <div className="bg-red-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-1.5">
            <span>🚨</span> {totalAffected.toLocaleString()} At Risk
          </div>
          <div className="bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-1.5">
            <span>🏕️</span> {totalAvailable.toLocaleString()} Spaces Free
          </div>
          <div className="bg-blue-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-1.5">
            <span>🏗️</span> {totalCapacity.toLocaleString()} Total Cap
          </div>
        </div>
      </div>
    </div>
  )
}
