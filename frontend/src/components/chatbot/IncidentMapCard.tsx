'use client'
import { MapPin, Navigation, ExternalLink, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { IncidentLocation } from '@/lib/rescueBotEngine'

interface Props {
  incident: IncidentLocation
}

export default function IncidentMapCard({ incident }: Props) {
  const isShelter = incident.type === 'shelter'
  const badgeColor =
    incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-200' :
    incident.severity === 'HIGH' ? 'bg-orange-100 text-orange-700 border-orange-200' :
    incident.severity === 'MODERATE' ? 'bg-amber-100 text-amber-700 border-amber-200' :
    'bg-emerald-100 text-emerald-700 border-emerald-200'

  // OpenStreetMap embed coordinates
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${incident.lng - 0.08}%2C${incident.lat - 0.05}%2C${incident.lng + 0.08}%2C${incident.lat + 0.05}&layer=mapnik&marker=${incident.lat}%2C${incident.lng}`

  return (
    <div className="mt-3 bg-white border border-rescue-border rounded-xl shadow-sm overflow-hidden text-slate-800">
      {/* Mini Interactive Map View */}
      <div className="relative w-full h-36 bg-slate-100 border-b border-rescue-border">
        <iframe
          title={incident.name}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={osmUrl}
          className="opacity-95 hover:opacity-100 transition"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-600 shadow-xs border border-slate-200">
          📍 {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
        </div>
      </div>

      {/* Incident / Facility Details */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
            {isShelter ? '🏠' : '⚠️'} {incident.name}
          </h4>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${badgeColor}`}>
            {incident.severity}
          </span>
        </div>

        <div className="mt-1.5 text-[11px] text-slate-600 space-y-0.5">
          {incident.radiusKm && (
            <p>• Danger Perimeter: <span className="font-semibold text-slate-800">{incident.radiusKm} km radius</span></p>
          )}
          {incident.affectedCount && (
            <p>• Affected Population: <span className="font-semibold text-slate-800">{incident.affectedCount.toLocaleString()} people</span></p>
          )}
          <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{incident.description}</p>
        </div>

        {/* Action Link to Full Map */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Live Geospatial Telemetry</span>
          <Link
            href="/map"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rescue-blue text-white rounded-lg text-[10px] font-semibold hover:bg-blue-700 transition"
          >
            <Navigation className="w-2.5 h-2.5" />
            Open in Full Disaster Map
          </Link>
        </div>
      </div>
    </div>
  )
}
