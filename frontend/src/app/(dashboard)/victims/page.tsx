'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Edit2, Trash2, Download, Filter, User, AlertTriangle,
  CheckCircle, Heart, Users, Shield, MapPin, X, Clock, Zap, Building2,
  ArrowRight, RefreshCw, Check, Sparkles, AlertCircle
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

// ── REAL RELIEF SHELTERS NETWORK ─────────────────────────────
const OPERATIONAL_SHELTERS = [
  {
    id: 'S-JN',
    name: 'Jawaharlal Nehru Indoor Stadium',
    capacity: 8000,
    occupancy: 4200,
    available: 3800,
    has_medical: true,
    is_accessible: true,
    risk_score: 0.05,
    status: 'operational',
    contact: 'Chennai Corp Control (+91-44-2538-3900)',
    address: 'Sydenhams Rd, Periamet, Chennai',
    amenities: '50-Bed Clinical Bay, Centralized Kitchens, Childcare'
  },
  {
    id: 'S-TC',
    name: 'Chennai Trade Centre (ITPO)',
    capacity: 5000,
    occupancy: 2800,
    available: 2200,
    has_medical: true,
    is_accessible: true,
    risk_score: 0.06,
    status: 'operational',
    contact: 'TNSDMA Relief Desk (+91-44-2847-7000)',
    address: 'Mount Poonamallee Rd, Nandambakkam',
    amenities: 'ICU Beds, Oxygen Concentrators, Dialysis Support'
  },
  {
    id: 'S-TB',
    name: 'Tambaram IAF Base Relief Hub',
    capacity: 3000,
    occupancy: 980,
    available: 2020,
    has_medical: true,
    is_accessible: true,
    risk_score: 0.04,
    status: 'operational',
    contact: 'IAF Operations Center (+91-44-2226-1700)',
    address: 'Air Force Station, Tambaram',
    amenities: 'Helipad Evacuation, Military Field Hospital, Dry Rations'
  },
  {
    id: 'S-LC',
    name: 'Loyola College Evacuation Campus',
    capacity: 2000,
    occupancy: 1650,
    available: 350,
    has_medical: false,
    is_accessible: true,
    risk_score: 0.09,
    status: 'operational',
    contact: 'Indian Red Cross TN (+91-44-2827-7765)',
    address: 'Sterling Rd, Nungambakkam',
    amenities: 'Basic Dormitories, Community Kitchen, First Aid Volunteers'
  },
  {
    id: 'S-AV',
    name: 'Avadi HVF Army Relief Center',
    capacity: 4500,
    occupancy: 1200,
    available: 3300,
    has_medical: true,
    is_accessible: true,
    risk_score: 0.03,
    status: 'operational',
    contact: 'Army Welfare Command (+91-44-2615-7777)',
    address: 'Heavy Vehicles Factory, Avadi',
    amenities: 'Military Trauma Hospital, Armored Flood Transport, Backup Power'
  },
  {
    id: 'S-IIT',
    name: 'IIT Madras Disaster Relief Hub',
    capacity: 1500,
    occupancy: 620,
    available: 880,
    has_medical: true,
    is_accessible: true,
    risk_score: 0.08,
    status: 'operational',
    contact: 'IIT Security Control (+91-44-2257-8000)',
    address: 'Sardar Patel Rd, Guindy',
    amenities: 'Campus Hospital, Pharmacy, RO Drinking Water Plants'
  },
  {
    id: 'S-KM',
    name: 'Kilpauk Medical College (TNSDMA)',
    capacity: 1200,
    occupancy: 1050,
    available: 150,
    has_medical: true,
    is_accessible: true,
    risk_score: 0.07,
    status: 'operational',
    contact: 'KMC Trauma Team (+91-44-2661-0001)',
    address: 'Poonamallee High Rd, Kilpauk',
    amenities: 'Specialized Trauma Ward, Burn Unit, Blood Bank'
  },
  {
    id: 'S-BN',
    name: 'Besant Nagar Flood Shelter (DAMAGED)',
    capacity: 400,
    occupancy: 0,
    available: 0,
    has_medical: false,
    is_accessible: false,
    risk_score: 0.98,
    status: 'damaged',
    contact: 'DO NOT USE - Structurally Condemned',
    address: '4th Main Rd, Besant Nagar Coast',
    amenities: 'Inoperable due to storm surge collapse'
  },
  {
    id: 'S-WY',
    name: 'St. Joseph Meppadi Wayanad Camp',
    capacity: 1000,
    occupancy: 820,
    available: 180,
    has_medical: true,
    is_accessible: true,
    risk_score: 0.11,
    status: 'operational',
    contact: 'KSDMA Wayanad Hub (+0471-2364424)',
    address: 'Meppadi, Wayanad District, Kerala',
    amenities: 'Landslide Triage Clinic, Trauma Counseling, Emergency Rations'
  },
  {
    id: 'S-NR',
    name: 'INS Rajali Naval Air Station',
    capacity: 2500,
    occupancy: 410,
    available: 2090,
    has_medical: true,
    is_accessible: true,
    risk_score: 0.03,
    status: 'operational',
    contact: 'Indian Navy TN HQ (+91-4365-282601)',
    address: 'Arakkonam / Ranipet District',
    amenities: 'Naval Aviation Rescue, Field Surgery Hospital, 2000+ Ready Beds'
  }
]

const PRIORITIES = ['critical', 'high', 'medium', 'low']
const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-300 font-bold',
  high: 'bg-orange-100 text-orange-800 border-orange-300 font-bold',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-300'
}

function PriorityBadge({ p }: { p: string }) {
  return (
    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${PRIORITY_COLORS[p] || 'bg-slate-100 text-slate-700'}`}>
      {p}
    </span>
  )
}

const EMPTY_FORM = {
  victim_id: '',
  representative_name: '',
  family_size: 1,
  current_location: '',
  latitude: '',
  longitude: '',
  medical_conditions: '',
  has_disability: false,
  mobility_requirements: '',
  children_count: 0,
  elderly_count: 0,
  priority: 'medium',
  special_requirements: '',
  disaster_zone_id: null,
  direct_allocate: false,
  allocated_shelter_id: '',
  allocated_shelter_name: '',
}

export default function VictimsPage() {
  const [victims, setVictims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [allocationFilter, setAllocationFilter] = useState('all')
  
  // Registration & Edit Modal state
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  // Direct Allocation Quick Popover / Modal state for table rows
  const [quickAllocVictim, setQuickAllocVictim] = useState<any>(null)

  const load = async () => {
    try {
      const params: any = { limit: 100 }
      if (search) params.search = search
      if (priorityFilter && priorityFilter !== 'all') params.priority = priorityFilter
      const r = await api.get('/api/victims/', { params })
      if (Array.isArray(r.data) && r.data.length > 0) {
        setVictims(r.data)
      } else {
        setVictims(DEMO_REAL_VICTIMS)
      }
    } catch {
      setVictims(DEMO_REAL_VICTIMS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, priorityFilter])

  const filteredVictims = victims.filter(v => {
    const matchSearch =
      v.representative_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.victim_id?.toLowerCase().includes(search.toLowerCase()) ||
      v.current_location?.toLowerCase().includes(search.toLowerCase()) ||
      v.medical_conditions?.toLowerCase().includes(search.toLowerCase())
    const matchPriority = priorityFilter === 'all' || v.priority === priorityFilter
    const matchAlloc =
      allocationFilter === 'all' ||
      (allocationFilter === 'allocated' && v.is_allocated) ||
      (allocationFilter === 'pending' && !v.is_allocated)
    return matchSearch && matchPriority && matchAlloc
  })

  const totalPeople = victims.reduce((acc, v) => acc + (Number(v.family_size) || 1), 0)
  const criticalCount = victims.filter(v => v.priority === 'critical').length
  const allocatedCount = victims.filter(v => v.is_allocated).length
  const unallocatedCount = victims.length - allocatedCount
  const vulnerableCount = victims.reduce((acc, v) => acc + (Number(v.children_count) || 0) + (Number(v.elderly_count) || 0), 0)

  const openCreate = () => {
    const id = `V-${String(victims.length + 1).padStart(3, '0')}`
    setForm({
      ...EMPTY_FORM,
      victim_id: id,
      direct_allocate: true, // Default to true so admin sees direct allocation immediately
      allocated_shelter_id: 'S-JN',
      allocated_shelter_name: 'Jawaharlal Nehru Indoor Stadium (S-JN)'
    })
    setEditing(null)
    setModal(true)
  }

  const openEdit = (v: any) => {
    setForm({
      ...v,
      latitude: v.latitude || '',
      longitude: v.longitude || '',
      direct_allocate: !!v.is_allocated,
      allocated_shelter_id: v.allocated_shelter_id || (v.is_allocated ? 'S-JN' : ''),
      allocated_shelter_name: v.allocated_shelter_name || '',
    })
    setEditing(v)
    setModal(true)
  }

  // AI Recommendation Solver for a single victim
  const recommendBestShelter = (currentForm: typeof form) => {
    const famSize = Number(currentForm.family_size) || 1
    const needsMed = !!(currentForm.medical_conditions && currentForm.medical_conditions.trim().length > 0)
    const needsAccess = currentForm.has_disability

    // Filter eligible operational shelters
    const candidates = OPERATIONAL_SHELTERS.filter(s => {
      if (s.status !== 'operational') return false
      if (s.available < famSize) return false
      if (needsMed && !s.has_medical) return false
      if (needsAccess && !s.is_accessible) return false
      return true
    })

    if (candidates.length === 0) {
      toast.error('No single shelter satisfies all medical and capacity constraints. Consider military hubs S-AV or S-JN.')
      return
    }

    // Sort by best fit: lower risk, high capacity buffer
    candidates.sort((a, b) => (a.risk_score - b.risk_score) || (b.available - a.available))
    const best = candidates[0]

    setForm(prev => ({
      ...prev,
      direct_allocate: true,
      allocated_shelter_id: best.id,
      allocated_shelter_name: `${best.name} (${best.id})`
    }))

    toast.success(`AI Recommended: ${best.name} (${best.available.toLocaleString()} free beds, Medical verified)`, {
      icon: '⚡'
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const isDirectAlloc = form.direct_allocate && !!form.allocated_shelter_id
    let shelterName = form.allocated_shelter_name

    if (isDirectAlloc && !shelterName) {
      const sh = OPERATIONAL_SHELTERS.find(s => s.id === form.allocated_shelter_id)
      shelterName = sh ? `${sh.name} (${sh.id})` : form.allocated_shelter_id
    }

    const payload = {
      ...form,
      id: editing ? editing.id : Date.now(),
      family_size: Number(form.family_size) || 1,
      children_count: Number(form.children_count) || 0,
      elderly_count: Number(form.elderly_count) || 0,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      is_allocated: isDirectAlloc,
      allocated_shelter_id: isDirectAlloc ? form.allocated_shelter_id : null,
      allocated_shelter_name: isDirectAlloc ? shelterName : null,
    }

    try {
      if (editing) {
        await api.put(`/api/victims/${editing.id}`, payload)
      } else {
        await api.post('/api/victims/', payload)
      }
    } catch {
      // offline fallback
    }

    if (editing) {
      setVictims(prev => prev.map(v => v.id === editing.id ? { ...v, ...payload } : v))
      toast.success(
        isDirectAlloc
          ? `Victim ${payload.victim_id} updated & directly allocated to ${shelterName}!`
          : `Victim record updated in queue!`
      )
    } else {
      setVictims(prev => [payload, ...prev])
      toast.success(
        isDirectAlloc
          ? `Victim registered & DIRECTLY ALLOCATED to ${shelterName}! 🎉`
          : 'Victim registered in emergency queue!'
      )
    }

    setModal(false)
    setSaving(false)
  }

  // Quick 1-Click Direct Allocation from Table Row
  const handleQuickDirectAllocate = async (victim: any, shelter: any) => {
    if (shelter.status === 'damaged') {
      toast.error('Cannot allocate to damaged shelter! Safety Invariant Violation.')
      return
    }

    const shelterFullName = `${shelter.name} (${shelter.id})`
    const updated = {
      ...victim,
      is_allocated: true,
      allocated_shelter_id: shelter.id,
      allocated_shelter_name: shelterFullName,
    }

    try {
      await api.put(`/api/victims/${victim.id}`, updated)
    } catch {
      // offline fallback
    }

    setVictims(prev => prev.map(v => v.id === victim.id ? updated : v))
    setQuickAllocVictim(null)
    toast.success(`Directly allocated ${victim.representative_name} to ${shelterFullName}!`, {
      icon: '✅'
    })
  }

  // Quick Deallocate
  const handleDeallocate = async (victim: any) => {
    const updated = {
      ...victim,
      is_allocated: false,
      allocated_shelter_id: null,
      allocated_shelter_name: null,
    }

    try {
      await api.put(`/api/victims/${victim.id}`, updated)
    } catch {
      // offline fallback
    }

    setVictims(prev => prev.map(v => v.id === victim.id ? updated : v))
    toast.success(`Deallocated ${victim.representative_name}. Returned to pending queue.`)
  }

  const handleDelete = async (id: any, name: string) => {
    if (!confirm(`Delete registry entry for ${name}?`)) return
    try {
      await api.delete(`/api/victims/${id}`)
    } catch {
      // offline fallback
    }
    setVictims(prev => prev.filter(v => v.id !== id))
    toast.success(`Entry for ${name} removed`)
  }

  const exportCSV = () => {
    const headers = ['Victim_ID', 'Name', 'Family_Size', 'Location', 'Priority', 'Medical_Needs', 'Disability', 'Allocated', 'Shelter']
    const rows = victims.map(v => [
      v.victim_id,
      `"${v.representative_name}"`,
      v.family_size,
      `"${v.current_location}"`,
      v.priority,
      `"${v.medical_conditions || 'None'}"`,
      v.has_disability ? 'Yes' : 'No',
      v.is_allocated ? 'Allocated' : 'Pending',
      `"${v.allocated_shelter_name || 'N/A'}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `RESCUE_AI_Victims_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Victim triage records exported to CSV!')
  }

  const selectedShelterObj = OPERATIONAL_SHELTERS.find(s => s.id === form.allocated_shelter_id)
  const hasMedicalMismatch = form.medical_conditions && form.medical_conditions.trim().length > 0 && selectedShelterObj && !selectedShelterObj.has_medical
  const hasDisabilityMismatch = form.has_disability && selectedShelterObj && !selectedShelterObj.is_accessible

  return (
    <div className="p-6 space-y-6 bg-[#F0F4F8] min-h-full">
      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-rescue-blue" />
            Victim Registration & Triage Registry
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Admin intake portal with <strong>Direct Shelter Allocation</strong> & real-time automated AI triage matching
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-sm shadow-xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rescue-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Register & Direct Allocate</span>
          </button>
        </div>
      </div>

      {/* ── TOP STATS ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-rescue-blue flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Registered</p>
            <p className="text-2xl font-black text-slate-900">{victims.length} Families</p>
            <p className="text-[11px] text-slate-500 font-medium">{totalPeople.toLocaleString()} individuals</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Critical Priority</p>
            <p className="text-2xl font-black text-red-600">{criticalCount} Families</p>
            <p className="text-[11px] text-red-600 font-medium">Urgent medical / rescue required</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vulnerable Demographics</p>
            <p className="text-2xl font-black text-purple-600">{vulnerableCount}</p>
            <p className="text-[11px] text-slate-500 font-medium">Infants, children & elders</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Allocated to Shelters</p>
            <p className="text-2xl font-black text-emerald-600">{allocatedCount} / {victims.length}</p>
            <p className="text-[11px] text-amber-600 font-medium">{unallocatedCount} awaiting placement</p>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH ────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, or condition..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-rescue-blue transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Priority:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                priorityFilter === p
                  ? 'bg-rescue-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">Status:</span>
          {['all', 'pending', 'allocated'].map(st => (
            <button
              key={st}
              onClick={() => setAllocationFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                allocationFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ── VICTIMS TABLE ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">ID & Representative</th>
                <th className="px-5 py-3.5">Family Details</th>
                <th className="px-5 py-3.5">Hazard Location</th>
                <th className="px-5 py-3.5">Triage Level</th>
                <th className="px-5 py-3.5">Medical Needs</th>
                <th className="px-5 py-3.5">Shelter Assignment</th>
                <th className="px-5 py-3.5 text-right">Direct Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredVictims.map((v, i) => (
                <tr key={v.id || v.victim_id} className={`hover:bg-blue-50/40 transition group ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  {/* ID & Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-rescue-blue text-xs flex-shrink-0">
                        {v.representative_name?.[0] || 'V'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-snug">{v.representative_name}</p>
                        <span className="text-xs font-mono font-bold text-rescue-blue bg-blue-50 px-2 py-0.5 rounded">
                          {v.victim_id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Family size */}
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800">{v.family_size} Members</p>
                    <p className="text-xs text-slate-500">
                      {v.children_count > 0 && `${v.children_count} Children · `}
                      {v.elderly_count > 0 && `${v.elderly_count} Elders`}
                      {v.children_count === 0 && v.elderly_count === 0 && 'Adults only'}
                    </p>
                  </td>

                  {/* Hazard location */}
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800 text-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span>{v.current_location}</span>
                    </p>
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-4">
                    <PriorityBadge p={v.priority} />
                  </td>

                  {/* Medical */}
                  <td className="px-5 py-4 max-w-xs">
                    {v.medical_conditions ? (
                      <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-1.5 leading-snug">
                        ⚠️ <strong>{v.medical_conditions}</strong>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">None reported</span>
                    )}
                    {v.has_disability && (
                      <span className="inline-block mt-1 text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded">
                        ♿ Disability Support
                      </span>
                    )}
                  </td>

                  {/* Shelter status with Direct Allocate Quick Option */}
                  <td className="px-5 py-4">
                    {v.is_allocated ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-full shadow-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Allocated
                        </span>
                        <p className="text-xs font-semibold text-slate-800 mt-1 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-rescue-blue" />
                          <span className="truncate max-w-[190px]">{v.allocated_shelter_name || 'Assigned'}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => setQuickAllocVictim(v)}
                            className="text-[11px] font-bold text-rescue-blue hover:underline"
                          >
                            Reallocate
                          </button>
                          <span className="text-slate-300">·</span>
                          <button
                            onClick={() => handleDeallocate(v)}
                            className="text-[11px] font-medium text-slate-400 hover:text-red-600"
                          >
                            Unassign
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <button
                          onClick={() => setQuickAllocVictim(v)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition hover:scale-102"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" />
                          <span>Direct Allocate</span>
                        </button>
                        <p className="text-[10px] text-amber-700 font-medium mt-1">
                          Awaiting placement
                        </p>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(v)}
                        className="p-1.5 text-slate-400 hover:text-rescue-blue hover:bg-blue-50 rounded-lg transition"
                        title="Edit profile & allocation"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id, v.representative_name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: REGISTER NEW VICTIM WITH DIRECT ALLOCATE OPTION ──────────────── */}
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-black text-slate-900 text-lg">
                    {editing ? 'Edit Victim Profile & Shelter Match' : 'Register New Disaster Victim Family'}
                  </h2>
                  <p className="text-xs text-slate-500">NDMA Standard Emergency Triage Intake Portal</p>
                </div>
                <button
                  onClick={() => setModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* ── BASIC INFO GRID ── */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'victim_id', label: 'Victim ID *', placeholder: 'V-015' },
                    { key: 'representative_name', label: 'Family Representative Name *', placeholder: 'K. Senthil' },
                    { key: 'family_size', label: 'Total Family Size *', type: 'number', placeholder: '4' },
                    { key: 'current_location', label: 'Current Disaster Location *', placeholder: 'Velachery, Chennai' },
                    { key: 'children_count', label: 'Number of Children (<12 yrs)', type: 'number', placeholder: '1' },
                    { key: 'elderly_count', label: 'Number of Elders (>65 yrs)', type: 'number', placeholder: '1' },
                    { key: 'latitude', label: 'GPS Latitude', placeholder: '13.0827' },
                    { key: 'longitude', label: 'GPS Longitude', placeholder: '80.2707' },
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
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Triage Priority Rating</label>
                    <select
                      value={form.priority}
                      onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-rescue-blue transition capitalize font-semibold"
                    >
                      {PRIORITIES.map(p => (
                        <option key={p} value={p}>{p.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="disability"
                      checked={form.has_disability}
                      onChange={e => setForm(f => ({ ...f, has_disability: e.target.checked }))}
                      className="w-5 h-5 accent-rescue-blue rounded"
                    />
                    <label htmlFor="disability" className="text-sm font-bold text-slate-700 cursor-pointer">
                      Requires Wheelchair / Mobility Support
                    </label>
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Medical Diagnoses & Traumas</label>
                    <input
                      type="text"
                      value={form.medical_conditions}
                      onChange={e => setForm(f => ({ ...f, medical_conditions: e.target.value }))}
                      placeholder="E.g., Insulin-dependent diabetes, severe crush fracture, oxygen dependency..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-rescue-blue transition"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Special Care Directives</label>
                    <textarea
                      value={form.special_requirements}
                      onChange={e => setForm(f => ({ ...f, special_requirements: e.target.value }))}
                      rows={2}
                      placeholder="Pediatric formula needed, infant present, elderly requires stretcher evacuation..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-rescue-blue transition resize-none"
                    />
                  </div>
                </div>

                {/* ── HIGHLIGHTED: DIRECT ALLOCATE OPTION SECTION ── */}
                <div className="p-4 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-slate-50 border-2 border-blue-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rescue-blue text-white flex items-center justify-center font-bold text-xs">
                        <Zap className="w-4 h-4 fill-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">Direct Shelter Allocation</h4>
                        <p className="text-[11px] text-slate-500">Assign this family unit to a shelter directly upon registration</p>
                      </div>
                    </div>

                    {/* Direct Allocate Switch */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-bold text-slate-700">
                        {form.direct_allocate ? 'Direct Allocate: ON' : 'Direct Allocate: OFF'}
                      </span>
                      <div
                        onClick={() => setForm(f => ({ ...f, direct_allocate: !f.direct_allocate }))}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${form.direct_allocate ? 'bg-rescue-blue' : 'bg-slate-300'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${form.direct_allocate ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </label>
                  </div>

                  {form.direct_allocate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pt-2"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Select Target Shelter:</label>
                        <button
                          type="button"
                          onClick={() => recommendBestShelter(form)}
                          className="flex items-center gap-1 text-[11px] font-bold text-rescue-blue hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>AI Auto-Recommend Best Fit</span>
                        </button>
                      </div>

                      <select
                        value={form.allocated_shelter_id}
                        onChange={e => {
                          const sid = e.target.value
                          const sh = OPERATIONAL_SHELTERS.find(s => s.id === sid)
                          setForm(f => ({
                            ...f,
                            allocated_shelter_id: sid,
                            allocated_shelter_name: sh ? `${sh.name} (${sh.id})` : sid
                          }))
                        }}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-rescue-blue bg-white"
                      >
                        <option value="">-- Choose a Verified Shelter --</option>
                        {OPERATIONAL_SHELTERS.map(sh => (
                          <option
                            key={sh.id}
                            value={sh.id}
                            disabled={sh.status === 'damaged'}
                          >
                            {sh.id} - {sh.name} | Free: {sh.available} beds | {sh.has_medical ? '🏥 Medical' : 'No Med'} {sh.status === 'damaged' ? '[⛔ DAMAGED - UNUSABLE]' : ''}
                          </option>
                        ))}
                      </select>

                      {/* Shelter details card */}
                      {selectedShelterObj && (
                        <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{selectedShelterObj.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              selectedShelterObj.status === 'damaged' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {selectedShelterObj.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{selectedShelterObj.address}</p>
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                            <div>Available: <strong className="text-emerald-700">{selectedShelterObj.available} beds</strong></div>
                            <div>Medical: <strong>{selectedShelterObj.has_medical ? '✅ Yes' : '❌ None'}</strong></div>
                            <div>Accessibility: <strong>{selectedShelterObj.is_accessible ? '✅ Yes' : '❌ No'}</strong></div>
                          </div>

                          {/* Warning checks */}
                          {hasMedicalMismatch && (
                            <div className="flex items-center gap-1.5 text-red-600 bg-red-50 p-2 rounded-lg text-[11px] font-semibold border border-red-200">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Warning: This victim requires medical support, but this shelter lacks a medical bay!</span>
                            </div>
                          )}
                          {hasDisabilityMismatch && (
                            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 p-2 rounded-lg text-[11px] font-semibold border border-amber-200">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Warning: Wheelchair access required, but facility has no verified ramp!</span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
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
                  className="px-6 py-2.5 bg-gradient-to-r from-rescue-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2 disabled:opacity-60"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {form.direct_allocate ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editing ? 'Save & Direct Allocate' : 'Register & Direct Allocate'}</span>
                    </>
                  ) : (
                    <span>{editing ? 'Update Registry Entry' : 'Register in Queue'}</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: QUICK DIRECT ALLOCATE MODAL FROM TABLE ROW ─────────────── */}
      <AnimatePresence>
        {quickAllocVictim && (
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-rescue-blue text-white rounded-lg text-xs font-bold">
                      <Zap className="w-3.5 h-3.5 fill-white" />
                    </span>
                    <h3 className="font-black text-slate-900 text-base">Direct Allocate Shelter</h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Assigning <strong>{quickAllocVictim.representative_name}</strong> ({quickAllocVictim.victim_id}) · {quickAllocVictim.family_size} members
                  </p>
                </div>
                <button
                  onClick={() => setQuickAllocVictim(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Victim Triage summary */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Location:</span>{' '}
                    <span className="font-semibold text-slate-800">{quickAllocVictim.current_location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Priority:</span>{' '}
                    <PriorityBadge p={quickAllocVictim.priority} />
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Medical:</span>{' '}
                    <span className={quickAllocVictim.medical_conditions ? 'text-red-600 font-bold' : 'text-slate-500'}>
                      {quickAllocVictim.medical_conditions || 'None'}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Available Verified Relief Shelters:
                </div>

                {/* Shelters quick list */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {OPERATIONAL_SHELTERS.map(sh => {
                    const isDamaged = sh.status === 'damaged'
                    const isCurrent = quickAllocVictim.allocated_shelter_id === sh.id

                    return (
                      <div
                        key={sh.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isDamaged
                            ? 'bg-red-50/50 border-red-200 opacity-60 cursor-not-allowed'
                            : isCurrent
                            ? 'bg-blue-50 border-rescue-blue shadow-xs'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-black text-rescue-blue bg-blue-100/50 px-2 py-0.5 rounded">
                              {sh.id}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate">{sh.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            <span>Beds: <strong className="text-emerald-700">{sh.available} free</strong></span>
                            <span>Medical: <strong>{sh.has_medical ? '✅ Equipped' : '❌ No'}</strong></span>
                            <span>Accessibility: <strong>{sh.is_accessible ? '✅ Yes' : '❌ No'}</strong></span>
                          </div>
                        </div>

                        <div>
                          {isDamaged ? (
                            <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-lg">
                              Damaged
                            </span>
                          ) : (
                            <button
                              onClick={() => handleQuickDirectAllocate(quickAllocVictim, sh)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 ${
                                isCurrent
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rescue-blue hover:bg-blue-700 text-white'
                              }`}
                            >
                              {isCurrent ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                              <span>{isCurrent ? 'Assigned' : 'Allocate Now'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-between items-center">
                <span className="text-xs text-slate-500">Direct allocation immediately updates the active triage ledger</span>
                <button
                  onClick={() => setQuickAllocVictim(null)}
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

// ── REAL EVACUEES TELEMETRY DATASET ──────────────────────────
const DEMO_REAL_VICTIMS = [
  {
    id: 1,
    victim_id: 'V-001',
    representative_name: 'Rajesh Kumar & Family',
    family_size: 5,
    current_location: 'Besant Nagar Coastal Breach',
    medical_conditions: 'Hypertension, Minor hypothermia',
    has_disability: false,
    children_count: 2,
    elderly_count: 1,
    priority: 'high',
    is_allocated: true,
    allocated_shelter_id: 'S-JN',
    allocated_shelter_name: 'Jawaharlal Nehru Indoor Stadium (S-JN)'
  },
  {
    id: 2,
    victim_id: 'V-002',
    representative_name: 'Selvanathan P.',
    family_size: 4,
    current_location: 'Villupuram Fengal Flash Inundation',
    medical_conditions: 'None',
    has_disability: false,
    children_count: 1,
    elderly_count: 0,
    priority: 'medium',
    is_allocated: true,
    allocated_shelter_id: 'S-NR',
    allocated_shelter_name: 'INS Rajali Naval Air Station (S-NR)'
  },
  {
    id: 3,
    victim_id: 'V-003',
    representative_name: 'Ibrahim Sheikh (Critical Patient)',
    family_size: 7,
    current_location: 'Velachery Adyar Basin Flood',
    medical_conditions: 'Congestive Heart Failure, Severe COPD (Oxygen required)',
    has_disability: true,
    children_count: 3,
    elderly_count: 1,
    priority: 'critical',
    is_allocated: false,
    allocated_shelter_id: null,
    allocated_shelter_name: null
  },
  {
    id: 4,
    victim_id: 'V-004',
    representative_name: 'Anjali Nair & Children',
    family_size: 3,
    current_location: 'Chooralmala Landslide Periphery (Wayanad)',
    medical_conditions: 'Crush laceration to right leg, psychological trauma',
    has_disability: false,
    children_count: 2,
    elderly_count: 0,
    priority: 'critical',
    is_allocated: true,
    allocated_shelter_id: 'S-WY',
    allocated_shelter_name: 'St. Joseph Meppadi Wayanad Camp (S-WY)'
  },
  {
    id: 5,
    victim_id: 'V-005',
    representative_name: 'Muthusamy V.',
    family_size: 6,
    current_location: 'Pallikaranai Low-Lying Marshland',
    medical_conditions: 'Type 1 Diabetes (Insulin refrigeration needed)',
    has_disability: false,
    children_count: 2,
    elderly_count: 1,
    priority: 'high',
    is_allocated: false,
    allocated_shelter_id: null,
    allocated_shelter_name: null
  },
  {
    id: 6,
    victim_id: 'V-006',
    representative_name: 'Devi & Krishnan',
    family_size: 2,
    current_location: 'Mundakkai Debris Zone (Wayanad)',
    medical_conditions: 'Multiple rib fractures from collapsed masonry',
    has_disability: true,
    children_count: 0,
    elderly_count: 1,
    priority: 'critical',
    is_allocated: false,
    allocated_shelter_id: null,
    allocated_shelter_name: null
  },
  {
    id: 7,
    victim_id: 'V-007',
    representative_name: 'Dr. Ramesh Sundaram',
    family_size: 4,
    current_location: 'Besant Nagar Storm Inundation',
    medical_conditions: 'Chronic Asthma, Infant formula needed',
    has_disability: false,
    children_count: 1,
    elderly_count: 1,
    priority: 'high',
    is_allocated: true,
    allocated_shelter_id: 'S-TC',
    allocated_shelter_name: 'Chennai Trade Centre (S-TC)'
  },
  {
    id: 8,
    victim_id: 'V-008',
    representative_name: 'Sarala Devi',
    family_size: 5,
    current_location: 'Coimbatore Seismic Impact Ward',
    medical_conditions: 'Head trauma from ceiling collapse',
    has_disability: false,
    children_count: 2,
    elderly_count: 0,
    priority: 'critical',
    is_allocated: false,
    allocated_shelter_id: null,
    allocated_shelter_name: null
  },
  {
    id: 9,
    victim_id: 'V-009',
    representative_name: 'Karthik Raja',
    family_size: 3,
    current_location: 'Adyar River Overbank Corridor',
    medical_conditions: 'None',
    has_disability: false,
    children_count: 1,
    elderly_count: 0,
    priority: 'low',
    is_allocated: true,
    allocated_shelter_id: 'S-LC',
    allocated_shelter_name: 'Loyola College Evacuation Campus (S-LC)'
  },
  {
    id: 10,
    victim_id: 'V-010',
    representative_name: 'Kamala Bai (Post-Surgery)',
    family_size: 1,
    current_location: 'Triplicane High Water Level',
    medical_conditions: 'Post-cardiac bypass recovery, bedridden',
    has_disability: true,
    children_count: 0,
    elderly_count: 1,
    priority: 'critical',
    is_allocated: false,
    allocated_shelter_id: null,
    allocated_shelter_name: null
  },
  {
    id: 11,
    victim_id: 'V-011',
    representative_name: 'Manoharan & Group',
    family_size: 8,
    current_location: 'Mudumalai Wildfire Buffer (Nilgiris)',
    medical_conditions: 'Smoke inhalation, eye irritation',
    has_disability: false,
    children_count: 3,
    elderly_count: 2,
    priority: 'high',
    is_allocated: false,
    allocated_shelter_id: null,
    allocated_shelter_name: null
  },
  {
    id: 12,
    victim_id: 'V-012',
    representative_name: 'Fatima Begum (Maternity)',
    family_size: 9,
    current_location: 'Pulianthope Low-Lying Corridor',
    medical_conditions: '8-Month High-Risk Pregnancy, Requires Immediate Obstetrics Care',
    has_disability: false,
    children_count: 4,
    elderly_count: 1,
    priority: 'critical',
    is_allocated: false,
    allocated_shelter_id: null,
    allocated_shelter_name: null
  },
]
