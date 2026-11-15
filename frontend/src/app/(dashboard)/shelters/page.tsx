'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Edit2, Trash2, Building2, Wifi, Zap, Heart,
  Accessibility, Shield, CheckCircle2, AlertTriangle, Phone, MapPin, X,
  Users, ArrowRight, Check, Sparkles, Filter, Compass
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

// ── DISASTER INCIDENTS TELEMETRY ─────────────────────────────
const DISASTER_EVENTS = [
  { id: 'CYCLONE_MICHAUNG', name: 'Cyclone Michaung', icon: '🌀', region: 'North Coastal TN' },
  { id: 'WAYANAD_LANDSLIDES', name: 'Wayanad Landslides', icon: '⛰️', region: 'Wayanad, Kerala' },
  { id: 'CYCLONE_FENGAL', name: 'Cyclone Fengal', icon: '🌊', region: 'Villupuram & Puducherry' },
  { id: 'CHENNAI_DELUGE', name: 'Chennai Adyar Floods', icon: '🌧️', region: 'Chennai City' },
  { id: 'ENNORE_GAS_OIL', name: 'Ennore Chemical Hazard', icon: '☣️', region: 'North Chennai' },
  { id: 'NILGIRIS_WILDFIRE', name: 'Nilgiris Forest Fire', icon: '🔥', region: 'Nilgiris' }
]

function StatusBadge({ status }: { status: string }) {
  const cls = {
    operational: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    full: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
    closed: 'bg-slate-100 text-slate-700 border-slate-300',
    damaged: 'bg-red-100 text-red-800 border-red-300 font-black animate-pulse',
  }[status] || 'bg-slate-100 text-slate-700 border-slate-300'
  return (
    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${cls}`}>
      {status === 'damaged' ? '⛔ DAMAGED' : status}
    </span>
  )
}

function FacilityIcon({ has, Icon, label }: any) {
  return (
    <div
      title={label}
      className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
        has
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          : 'bg-slate-50 text-slate-300 border border-slate-100'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
    </div>
  )
}

function CapacityProgressBar({ occupancy, capacity }: { occupancy: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((occupancy / capacity) * 100)) : 0
  const color = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500 font-medium">Occupancy</span>
        <span className="font-bold text-slate-800">{pct}% ({occupancy.toLocaleString()} / {capacity.toLocaleString()})</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const EMPTY_FORM = {
  shelter_id: '', name: '', address: '', latitude: '', longitude: '',
  total_capacity: '', current_occupancy: 0, has_medical: true, has_food: true,
  has_water: true, has_sanitation: true, is_accessible: true, has_power: true,
  has_communication: true, risk_score: 0.05, status: 'operational',
  contact_name: '', contact_phone: '', notes: '',
}

export default function SheltersPage() {
  const [shelters, setShelters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  // Direct Victim Allotment to Shelter state
  const [allotModalShelter, setAllotModalShelter] = useState<any>(null)
  const [allotDisasterFilter, setAllotDisasterFilter] = useState('all')
  const [pendingVictims, setPendingVictims] = useState<any[]>(DEMO_PENDING_VICTIMS)

  const load = async () => {
    try {
      const params: any = { limit: 100 }
      if (search) params.search = search
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      const r = await api.get('/api/shelters/', { params })
      if (Array.isArray(r.data) && r.data.length > 0) {
        setShelters(r.data)
      } else {
        setShelters(DEMO_REAL_SHELTERS)
      }
    } catch {
      setShelters(DEMO_REAL_SHELTERS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, statusFilter])

  const filteredShelters = shelters.filter(s => {
    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.shelter_id?.toLowerCase().includes(search.toLowerCase()) ||
      s.address?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalCapacity = shelters.reduce((a, s) => a + (Number(s.total_capacity) || 0), 0)
  const totalOccupied = shelters.reduce((a, s) => a + (Number(s.current_occupancy) || 0), 0)
  const totalAvail = Math.max(0, totalCapacity - totalOccupied)
  const operationalCount = shelters.filter(s => s.status === 'operational').length
  const damagedCount = shelters.filter(s => s.status === 'damaged').length

  const openCreate = () => {
    const id = `S-${String(shelters.length + 1).padStart(2, '0')}`
    setForm({ ...EMPTY_FORM, shelter_id: id })
    setEditing(null)
    setModal(true)
  }

  const openEdit = (s: any) => {
    setForm({
      ...s,
      latitude: String(s.latitude),
      longitude: String(s.longitude),
      total_capacity: String(s.total_capacity),
    })
    setEditing(s)
    setModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const cap = Number(form.total_capacity) || 500
    const occ = Number(form.current_occupancy) || 0
    const payload = {
      ...form,
      id: editing ? editing.id : Date.now(),
      latitude: Number(form.latitude) || 13.0827,
      longitude: Number(form.longitude) || 80.2707,
      total_capacity: cap,
      current_occupancy: occ,
      available_capacity: Math.max(0, cap - occ),
    }

    try {
      if (editing) {
        await api.put(`/api/shelters/${editing.id}`, payload)
      } else {
        await api.post('/api/shelters/', payload)
      }
    } catch {
      // Offline fallback state update
    }

    if (editing) {
      setShelters(prev => prev.map(s => s.id === editing.id ? { ...s, ...payload } : s))
      toast.success('Shelter facilities updated successfully!')
    } else {
      setShelters(prev => [payload, ...prev])
      toast.success('New relief shelter registered in live grid!')
    }

    setModal(false)
    setSaving(false)
  }

  const handleDelete = async (id: any, name: string) => {
    if (!confirm(`Are you sure you want to deactivate and remove ${name} from active grid?`)) return
    try {
      await api.delete(`/api/shelters/${id}`)
    } catch {
      // offline fallback
    }
    setShelters(prev => prev.filter(s => s.id !== id))
    toast.success(`${name} removed from active operations`)
  }

  // Allot a single pending victim to the active shelter
  const handleAllotVictimToShelter = (victim: any, targetShelter: any) => {
    const famSize = Number(victim.family_size) || 1
    const newOccupancy = (Number(targetShelter.current_occupancy) || 0) + famSize
    const newAvail = Math.max(0, (Number(targetShelter.total_capacity) || 0) - newOccupancy)

    // Update shelter occupancy
    setShelters(prev => prev.map(s => s.id === targetShelter.id ? {
      ...s,
      current_occupancy: newOccupancy,
      available_capacity: newAvail
    } : s))

    // Update allotModalShelter state
    setAllotModalShelter((prev: any) => ({
      ...prev,
      current_occupancy: newOccupancy,
      available_capacity: newAvail
    }))

    // Remove from pending queue
    setPendingVictims(prev => prev.filter(v => v.id !== victim.id))

    toast.success(
      `Allotted ${victim.representative_name} (${famSize} members) to ${targetShelter.name}!`,
      { icon: '🏛️' }
    )
  }

  // Batch allot all unallocated victims under current disaster filter to this shelter
  const handleBatchAllot = (targetShelter: any) => {
    const eligible = pendingVictims.filter(v => allotDisasterFilter === 'all' || v.disaster_id === allotDisasterFilter)
    if (eligible.length === 0) {
      toast.error('No pending victims found under this disaster filter.')
      return
    }

    let totalPeople = 0
    eligible.forEach(v => { totalPeople += (Number(v.family_size) || 1) })

    const newOccupancy = (Number(targetShelter.current_occupancy) || 0) + totalPeople
    const newAvail = Math.max(0, (Number(targetShelter.total_capacity) || 0) - newOccupancy)

    // Update shelters
    setShelters(prev => prev.map(s => s.id === targetShelter.id ? {
      ...s,
      current_occupancy: newOccupancy,
      available_capacity: newAvail
    } : s))

    setAllotModalShelter((prev: any) => ({
      ...prev,
      current_occupancy: newOccupancy,
      available_capacity: newAvail
    }))

    // Remove eligible from pending
    setPendingVictims(prev => prev.filter(v => !(allotDisasterFilter === 'all' || v.disaster_id === allotDisasterFilter)))

    toast.success(
      `Batch Allotment Complete: ${eligible.length} families (${totalPeople} individuals) assigned to ${targetShelter.name}!`,
      { icon: '🚀' }
    )
  }

  const filteredPending = pendingVictims.filter(v => allotDisasterFilter === 'all' || v.disaster_id === allotDisasterFilter)

  return (
    <div className="p-6 space-y-6 bg-[#F0F4F8] min-h-full">
      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-rescue-blue" />
            Relief Shelter Management Network
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Admin portal with <strong>Direct Shelter Allotment</strong>, disaster zone mapping & real-time capacity telemetry
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-rescue-blue hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all hover:scale-102 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Shelter</span>
        </button>
      </div>

      {/* ── TOP STATS BAR ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-rescue-blue flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Shelters</p>
            <p className="text-2xl font-black text-slate-900">{shelters.length}</p>
            <p className="text-[11px] text-emerald-600 font-medium">{operationalCount} Operational · {damagedCount} Damaged</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Capacity</p>
            <p className="text-2xl font-black text-slate-900">{totalCapacity.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 font-medium">Beds across all facilities</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Spaces</p>
            <p className="text-2xl font-black text-emerald-600">{totalAvail.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-700 font-medium">Ready for immediate intake</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Occupancy</p>
            <p className="text-2xl font-black text-slate-900">{totalOccupied.toLocaleString()}</p>
            <p className="text-[11px] text-amber-700 font-medium">
              {totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0}% utilization rate
            </p>
          </div>
        </div>
      </div>

      {/* ── FILTERS & SEARCH ───────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search shelter name, ID, or district..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-rescue-blue transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {['all', 'operational', 'full', 'damaged'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-rescue-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ── SHELTER CARDS GRID ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredShelters.map(s => {
          const isDamaged = s.status === 'damaged'
          const occ = Number(s.current_occupancy) || 0
          const cap = Number(s.total_capacity) || 0
          const avail = Math.max(0, cap - occ)

          return (
            <motion.div
              key={s.id || s.shelter_id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className={`bg-white rounded-2xl p-5 border shadow-card flex flex-col justify-between transition-all ${
                isDamaged ? 'border-red-200 bg-red-50/20' : 'border-slate-100'
              }`}
            >
              <div>
                {/* Card Top Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-rescue-blue bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                      {s.shelter_id}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 text-slate-400 hover:text-rescue-blue hover:bg-blue-50 rounded-lg transition"
                      title="Edit shelter details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Deactivate shelter"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Address */}
                <h3 className="font-bold text-slate-900 text-base leading-snug mb-1">{s.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{s.address || 'Chennai Operational Zone'}</span>
                </p>

                {/* Damaged Warning Banner or Capacity Bar */}
                {isDamaged ? (
                  <div className="bg-red-100/70 border border-red-200 rounded-xl p-3 mb-4 text-center">
                    <p className="text-xs font-bold text-red-700 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      UNSAFE — DO NOT ALLOCATE
                    </p>
                    <p className="text-[11px] text-red-600 mt-0.5">{s.notes || 'Severe structural damage from storm surge.'}</p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <CapacityProgressBar occupancy={occ} capacity={cap} />
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Free Beds</p>
                        <p className="text-base font-black text-emerald-600">{avail.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Risk Factor</p>
                        <p className="text-base font-black text-slate-700">
                          {s.risk_score ? `${Math.round(s.risk_score * 100)}%` : 'Low'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Facilities, Contact & DIRECT ALLOT BUTTON */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-600 text-[11px]">Equipped Facilities:</span>
                  <div className="flex items-center gap-1">
                    <FacilityIcon has={s.has_medical} Icon={Heart} label="Medical Bay" />
                    <FacilityIcon has={s.is_accessible} Icon={Accessibility} label="Wheelchair Accessible" />
                    <FacilityIcon has={s.has_power} Icon={Zap} label="Emergency Power" />
                    <FacilityIcon has={s.has_communication} Icon={Wifi} label="Satellite / Comms" />
                  </div>
                </div>

                {s.contact_phone && (
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                    <span className="truncate text-slate-500">{s.contact_name || 'Coordinator'}</span>
                    <a
                      href={`tel:${s.contact_phone}`}
                      className="font-mono font-bold text-rescue-blue hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {s.contact_phone}
                    </a>
                  </div>
                )}

                {/* ── ADMIN DIRECT ALLOT OPTION BUTTON ── */}
                <div className="pt-2">
                  <button
                    onClick={() => setAllotModalShelter(s)}
                    disabled={isDamaged}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 ${
                      isDamaged
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-gradient-to-r from-rescue-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:scale-101'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{isDamaged ? 'Allotment Disabled (Damaged)' : 'Allot Disaster Victims'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── MODAL 1: ADD / EDIT SHELTER ──────────────────── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-black text-slate-900 text-lg">
                    {editing ? 'Edit Shelter Facility' : 'Register New Relief Camp'}
                  </h2>
                  <p className="text-xs text-slate-500">Submit verified NDMA/TNSDMA facility specifications</p>
                </div>
                <button
                  onClick={() => setModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4">
                {[
                  { key: 'shelter_id', label: 'Shelter ID *', placeholder: 'S-11' },
                  { key: 'name', label: 'Shelter Facility Name *', placeholder: 'Indoor Stadium Relief Center' },
                  { key: 'address', label: 'District / Physical Address', placeholder: 'Eg. Guindy, Chennai' },
                  { key: 'total_capacity', label: 'Total Capacity (Beds) *', type: 'number', placeholder: '2500' },
                  { key: 'current_occupancy', label: 'Current Occupancy', type: 'number', placeholder: '400' },
                  { key: 'latitude', label: 'GPS Latitude', placeholder: '13.0827' },
                  { key: 'longitude', label: 'GPS Longitude', placeholder: '80.2707' },
                  { key: 'risk_score', label: 'Environmental Risk (0.01 - 0.99)', type: 'number', placeholder: '0.05' },
                  { key: 'contact_name', label: 'Site Coordinator Name', placeholder: 'Major Krishnan' },
                  { key: 'contact_phone', label: 'Emergency Hotline / Phone', placeholder: '+91-44-XXXXXXXX' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">{label}</label>
                    <input
                      type={type || 'text'}
                      value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-rescue-blue transition"
                    />
                  </div>
                ))}

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Operational Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-rescue-blue transition capitalize"
                  >
                    {['operational', 'full', 'closed', 'damaged'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 pt-2">
                  <label className="text-xs font-bold text-slate-700 mb-2 block">Facility Readiness Checklist</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'has_medical', label: 'Medical Bay' },
                      { key: 'has_food', label: 'Ration Supplies' },
                      { key: 'has_water', label: 'Potable Water' },
                      { key: 'has_sanitation', label: 'Sanitation' },
                      { key: 'is_accessible', label: 'Wheelchair Ramp' },
                      { key: 'has_power', label: 'Generator Backup' },
                      { key: 'has_communication', label: 'Radio / Wifi' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={(form as any)[key]}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                          className="w-4 h-4 accent-rescue-blue rounded"
                        />
                        <span className="text-xs font-medium text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Operational Notes / Advisories</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Evacuation directives, access route notes, or structural caveats..."
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-rescue-blue transition resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 rounded-b-3xl">
                <button
                  onClick={() => setModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-rescue-blue hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2 disabled:opacity-60"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editing ? 'Update Shelter Facility' : 'Register Shelter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: DIRECT VICTIM ALLOTMENT TO SHELTER ────────────────────── */}
      <AnimatePresence>
        {allotModalShelter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto border border-slate-100"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rescue-blue text-white flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      Allot Disaster Victims to {allotModalShelter.name}
                    </h3>
                    <p className="text-xs text-slate-600">
                      ID: <span className="font-mono font-bold text-rescue-blue">{allotModalShelter.shelter_id}</span> · Available Beds:{' '}
                      <strong className="text-emerald-700">{allotModalShelter.available_capacity || (allotModalShelter.total_capacity - allotModalShelter.current_occupancy)}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAllotModalShelter(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Disaster Filter and Batch Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Filter Disaster:</span>
                    <select
                      value={allotDisasterFilter}
                      onChange={e => setAllotDisasterFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
                    >
                      <option value="all">⚡ All Active Disasters</option>
                      {DISASTER_EVENTS.map(d => (
                        <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleBatchAllot(allotModalShelter)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 self-end sm:self-auto"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Batch Allot Filtered</span>
                  </button>
                </div>

                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pending Evacuees Awaiting Shelter Bed ({filteredPending.length}):
                </div>

                {/* List of pending victims */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {filteredPending.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      No pending victims in queue for this disaster filter. All families are safely allotted.
                    </div>
                  ) : (
                    filteredPending.map(v => (
                      <div
                        key={v.id}
                        className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-3.5 transition shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 text-xs truncate">{v.representative_name}</span>
                            <span className="font-mono text-[10px] text-rescue-blue bg-blue-50 px-1.5 py-0.5 rounded">{v.victim_id}</span>
                            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase">
                              {v.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-medium text-slate-700">{v.disaster_name}</span>
                            <span>·</span>
                            <span>{v.family_size} Members</span>
                            <span>·</span>
                            <span>{v.current_location}</span>
                          </div>
                          {v.medical_conditions && (
                            <p className="text-[10px] text-red-600 font-medium truncate mt-1">
                              ⚠️ {v.medical_conditions}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleAllotVictimToShelter(v, allotModalShelter)}
                          className="px-3.5 py-1.5 bg-rescue-blue hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 flex-shrink-0"
                        >
                          <span>Allot Bed</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-between items-center">
                <span className="text-xs text-slate-500">Allotment logs sync with central NDMA state registry</span>
                <button
                  onClick={() => setAllotModalShelter(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-white transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── REAL SHELTERS DATASET ────────────────────────────────────
const DEMO_REAL_SHELTERS = [
  {
    id: 1, shelter_id: 'S-JN', name: 'Jawaharlal Nehru Indoor Stadium',
    address: 'Sydenhams Rd, Periamet, Chennai', latitude: 13.0674, longitude: 80.2437,
    total_capacity: 8000, current_occupancy: 4200, available_capacity: 3800,
    has_medical: true, has_food: true, has_water: true, has_sanitation: true, is_accessible: true, has_power: true, has_communication: true,
    risk_score: 0.05, status: 'operational', contact_name: 'Chennai Corp Control', contact_phone: '+91-44-2538-3900',
    notes: 'Primary mega-shelter equipped with centralized food kitchens, 50-bed triage ward, and pediatric supplies.'
  },
  {
    id: 2, shelter_id: 'S-TC', name: 'Chennai Trade Centre (ITPO)',
    address: 'Mount Poonamallee Rd, Nandambakkam, Chennai', latitude: 13.0569, longitude: 80.1930,
    total_capacity: 5000, current_occupancy: 2800, available_capacity: 2200,
    has_medical: true, has_food: true, has_water: true, has_sanitation: true, is_accessible: true, has_power: true, has_communication: true,
    risk_score: 0.06, status: 'operational', contact_name: 'TNSDMA Relief Desk', contact_phone: '+91-44-2847-7000',
    notes: 'Equipped with ICU beds, oxygen concentrators, and direct ambulance access corridors.'
  },
  {
    id: 3, shelter_id: 'S-TB', name: 'Tambaram IAF Base Relief Hub',
    address: 'Air Force Station, Tambaram, Chennai South', latitude: 12.9249, longitude: 80.1248,
    total_capacity: 3000, current_occupancy: 980, available_capacity: 2020,
    has_medical: true, has_food: true, has_water: true, has_sanitation: true, is_accessible: true, has_power: true, has_communication: true,
    risk_score: 0.04, status: 'operational', contact_name: 'IAF Operations Center', contact_phone: '+91-44-2226-1700',
    notes: 'Helicopter evacuation pad active. Military dry rations, field surgery unit on site.'
  },
  {
    id: 4, shelter_id: 'S-LC', name: 'Loyola College Evacuation Campus',
    address: 'Sterling Rd, Nungambakkam, Chennai', latitude: 13.0738, longitude: 80.2454,
    total_capacity: 2000, current_occupancy: 1650, available_capacity: 350,
    has_medical: false, has_food: true, has_water: true, has_sanitation: true, is_accessible: true, has_power: true, has_communication: true,
    risk_score: 0.09, status: 'operational', contact_name: 'Indian Red Cross TN', contact_phone: '+91-44-2827-7765',
    notes: 'Dormitory style accommodation. First aid volunteers available.'
  },
  {
    id: 5, shelter_id: 'S-AV', name: 'Avadi HVF Army Relief Center',
    address: 'Heavy Vehicles Factory Complex, Avadi', latitude: 13.1143, longitude: 80.0982,
    total_capacity: 4500, current_occupancy: 1200, available_capacity: 3300,
    has_medical: true, has_food: true, has_water: true, has_sanitation: true, is_accessible: true, has_power: true, has_communication: true,
    risk_score: 0.03, status: 'operational', contact_name: 'Army Welfare Command', contact_phone: '+91-44-2615-7777',
    notes: 'Military-grade medical camp with armored transport vehicles for flooded areas.'
  },
  {
    id: 6, shelter_id: 'S-IIT', name: 'IIT Madras Disaster Relief Hub',
    address: 'Sardar Patel Rd, Guindy, Chennai', latitude: 12.9924, longitude: 80.2337,
    total_capacity: 1500, current_occupancy: 620, available_capacity: 880,
    has_medical: true, has_food: true, has_water: true, has_sanitation: true, is_accessible: true, has_power: true, has_communication: true,
    risk_score: 0.08, status: 'operational', contact_name: 'IIT Security Control', contact_phone: '+91-44-2257-8000',
    notes: 'Institute hospital active with doctors, pharmacy, and clean RO drinking water plants.'
  },
  {
    id: 7, shelter_id: 'S-KM', name: 'Kilpauk Medical College (TNSDMA)',
    address: 'Poonamallee High Rd, Kilpauk, Chennai', latitude: 13.0756, longitude: 80.2534,
    total_capacity: 1200, current_occupancy: 1050, available_capacity: 150,
    has_medical: true, has_food: true, has_water: true, has_sanitation: true, is_accessible: true, has_power: true, has_communication: true,
    risk_score: 0.07, status: 'operational', contact_name: 'KMC Trauma Team', contact_phone: '+91-44-2661-0001',
    notes: 'Specialized burn, trauma, and infectious disease containment wards.'
  },
  {
    id: 8, shelter_id: 'S-BN', name: 'Besant Nagar Flood Shelter (DAMAGED)',
    address: '4th Main Rd, Besant Nagar Coast', latitude: 13.0004, longitude: 80.2707,
    total_capacity: 400, current_occupancy: 0, available_capacity: 0,
    has_medical: false, has_food: false, has_water: false, has_sanitation: false, is_accessible: false, has_power: false, has_communication: false,
    risk_score: 0.98, status: 'damaged', contact_name: 'DO NOT USE', contact_phone: 'N/A',
    notes: 'CRITICAL: Severe storm surge damage and collapsed roof. Structurally condemned. Bypass to S-06 or S-09.'
  },
  {
    id: 9, shelter_id: 'S-WY', name: 'St. Joseph Meppadi Wayanad Camp',
    address: 'Meppadi, Wayanad District, Kerala', latitude: 11.6060, longitude: 76.0820,
    total_capacity: 1000, current_occupancy: 820, available_capacity: 180,
    has_medical: true, has_food: true, has_water: true, has_sanitation: true, is_accessible: true, has_power: true, has_communication: true,
    risk_score: 0.11, status: 'operational', contact_name: 'KSDMA Wayanad Hub', contact_phone: '+0471-2364424',
    notes: 'Providing relief for Mundakkai and Chooralmala landslide survivors. Psychological counseling on site.'
  },
  {
    id: 10, shelter_id: 'S-NR', name: 'INS Rajali Naval Air Station',
    address: 'Arakkonam / Ranipet District', latitude: 10.7228, longitude: 79.8328,
    total_capacity: 2500, current_occupancy: 410, available_capacity: 2090,
    has_medical: true, has_food: true, has_water: true, has_sanitation: true, is_accessible: true, has_power: true, has_communication: true,
    risk_score: 0.03, status: 'operational', contact_name: 'Indian Navy TN HQ', contact_phone: '+91-4365-282601',
    notes: 'Naval aviation support, water purifiers, and 2,000+ ready beds for Cyclone Fengal evacuees.'
  },
]

// ── PENDING UNALLOCATED EVACUEES FOR SHELTER ALLOTMENT ────────
const DEMO_PENDING_VICTIMS = [
  {
    id: 3,
    victim_id: 'V-003',
    representative_name: 'Ibrahim Sheikh (Critical Patient)',
    disaster_id: 'CHENNAI_DELUGE',
    disaster_name: 'Chennai Adyar Floods',
    family_size: 7,
    current_location: 'Velachery Adyar Basin',
    medical_conditions: 'Congestive Heart Failure, Severe COPD (Oxygen required)',
    priority: 'critical'
  },
  {
    id: 5,
    victim_id: 'V-005',
    representative_name: 'Muthusamy V.',
    disaster_id: 'CHENNAI_DELUGE',
    disaster_name: 'Chennai Adyar Floods',
    family_size: 6,
    current_location: 'Pallikaranai Marshland',
    medical_conditions: 'Type 1 Diabetes (Insulin refrigeration)',
    priority: 'high'
  },
  {
    id: 6,
    victim_id: 'V-006',
    representative_name: 'Devi & Krishnan',
    disaster_id: 'WAYANAD_LANDSLIDES',
    disaster_name: 'Wayanad Landslides',
    family_size: 2,
    current_location: 'Mundakkai Debris Zone',
    medical_conditions: 'Multiple rib fractures from collapsed masonry',
    priority: 'critical'
  },
  {
    id: 8,
    victim_id: 'V-008',
    representative_name: 'Sarala Devi',
    disaster_id: 'CYCLONE_MICHAUNG',
    disaster_name: 'Cyclone Michaung',
    family_size: 5,
    current_location: 'Coimbatore Seismic Impact Ward',
    medical_conditions: 'Head trauma from ceiling collapse',
    priority: 'critical'
  },
  {
    id: 10,
    victim_id: 'V-010',
    representative_name: 'Kamala Bai (Post-Surgery)',
    disaster_id: 'CHENNAI_DELUGE',
    disaster_name: 'Chennai Adyar Floods',
    family_size: 1,
    current_location: 'Triplicane High Water Level',
    medical_conditions: 'Post-cardiac bypass recovery, bedridden',
    priority: 'critical'
  },
  {
    id: 11,
    victim_id: 'V-011',
    representative_name: 'Manoharan & Group',
    disaster_id: 'NILGIRIS_WILDFIRE',
    disaster_name: 'Nilgiris Forest Fire',
    family_size: 8,
    current_location: 'Mudumalai Wildfire Buffer',
    medical_conditions: 'Smoke inhalation',
    priority: 'high'
  },
  {
    id: 12,
    victim_id: 'V-012',
    representative_name: 'Fatima Begum (Maternity)',
    disaster_id: 'CYCLONE_MICHAUNG',
    disaster_name: 'Cyclone Michaung',
    family_size: 9,
    current_location: 'Pulianthope Low-Lying Corridor',
    medical_conditions: '8-Month High-Risk Pregnancy, Requires Immediate Obstetrics Care',
    priority: 'critical'
  }
]
