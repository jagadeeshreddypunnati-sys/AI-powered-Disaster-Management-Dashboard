'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit2, Trash2, Building2, Wifi, Zap, Heart, Accessibility } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

function StatusBadge({ status }: { status: string }) {
  const cls = {
    operational: 'bg-green-50 text-green-700 border-green-200',
    full: 'bg-orange-50 text-orange-700 border-orange-200',
    closed: 'bg-gray-50 text-gray-600 border-gray-200',
    damaged: 'bg-red-50 text-red-700 border-red-200',
  }[status] || 'bg-gray-50 text-gray-600 border-gray-200'
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>{status.toUpperCase()}</span>
}

function FacilityIcon({ has, Icon, label }: any) {
  return (
    <span title={label} className={`p-1 rounded ${has ? 'text-rescue-green' : 'text-gray-300'}`}>
      <Icon className="w-3.5 h-3.5" />
    </span>
  )
}

function RiskBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = score < 0.3 ? 'bg-rescue-green' : score < 0.6 ? 'bg-rescue-orange' : 'bg-rescue-red'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-8">{pct}%</span>
    </div>
  )
}

const EMPTY_FORM = {
  shelter_id: '', name: '', address: '', latitude: '', longitude: '',
  total_capacity: '', current_occupancy: 0, has_medical: false, has_food: true,
  has_water: true, has_sanitation: true, is_accessible: true, has_power: true,
  has_communication: true, risk_score: 0.1, status: 'operational',
  contact_name: '', contact_phone: '', notes: '',
}

export default function SheltersPage() {
  const [shelters, setShelters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const params: any = { limit: 100 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const r = await api.get('/api/shelters/', { params })
      setShelters(r.data)
    } catch {
      setShelters(DEMO_SHELTERS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, statusFilter])

  const totalCapacity = shelters.reduce((a, s) => a + s.total_capacity, 0)
  const totalOccupied = shelters.reduce((a, s) => a + s.current_occupancy, 0)
  const totalAvail = totalCapacity - totalOccupied

  const openCreate = () => {
    const id = `S-${String(shelters.length + 11).padStart(2, '0')}`
    setForm({ ...EMPTY_FORM, shelter_id: id })
    setEditing(null)
    setModal(true)
  }

  const openEdit = (s: any) => {
    setForm({ ...s, latitude: String(s.latitude), longitude: String(s.longitude), total_capacity: String(s.total_capacity) })
    setEditing(s)
    setModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude), total_capacity: Number(form.total_capacity), current_occupancy: Number(form.current_occupancy), risk_score: Number(form.risk_score) }
      if (editing) {
        await api.put(`/api/shelters/${editing.id}`, payload)
        toast.success('Shelter updated')
      } else {
        await api.post('/api/shelters/', payload)
        toast.success('Shelter added')
      }
      setModal(false)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete shelter "${name}"?`)) return
    try {
      await api.delete(`/api/shelters/${id}`)
      toast.success('Shelter deleted')
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Shelter Management</h1>
          <p className="text-sm text-gray-500">{shelters.length} shelters · {totalAvail.toLocaleString()} spaces available</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-rescue-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Add Shelter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Capacity', value: totalCapacity.toLocaleString(), color: 'text-blue-600' },
          { label: 'Current Occupancy', value: totalOccupied.toLocaleString(), color: 'text-orange-600' },
          { label: 'Available Spaces', value: totalAvail.toLocaleString(), color: 'text-green-600' },
          { label: 'Overall Occupancy', value: `${Math.round(totalOccupied / Math.max(totalCapacity, 1) * 100)}%`, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-card border border-rescue-border text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-card border border-rescue-border flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-50 border border-gray-200 rounded-lg px-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search shelter name, ID, or address..." className="flex-1 bg-transparent py-2 text-sm outline-none" />
        </div>
        <div className="flex gap-1.5">
          {['', 'operational', 'full', 'closed', 'damaged'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition capitalize ${statusFilter === s ? 'bg-rescue-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s || 'All Status'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-card border border-rescue-border animate-pulse h-48" />
          ))
        ) : shelters.map(s => (
          <motion.div key={s.id} whileHover={{ y: -2 }} className={`bg-white rounded-xl p-5 shadow-card border-l-4 border ${
            s.status === 'damaged' || s.risk_score > 0.7 ? 'border-l-rescue-red' :
            s.status === 'closed' ? 'border-l-gray-400' :
            s.occupancy_pct > 85 ? 'border-l-rescue-orange' : 'border-l-rescue-green'
          } border-rescue-border`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-400">{s.shelter_id}</span>
                  <StatusBadge status={s.status} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{s.name}</h3>
                {s.address && <p className="text-xs text-gray-500 mt-0.5">{s.address}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Capacity Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Occupancy: <b>{s.current_occupancy}/{s.total_capacity}</b></span>
                <span className="font-medium">{s.occupancy_pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${
                  s.occupancy_pct > 85 ? 'bg-rescue-red' : s.occupancy_pct > 60 ? 'bg-rescue-orange' : 'bg-rescue-green'
                }`} style={{ width: `${s.occupancy_pct}%` }} />
              </div>
              <div className="text-xs text-gray-500 mt-1">{s.available_capacity} spaces available</div>
            </div>

            {/* Risk Score */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Risk Score</span>
              </div>
              <RiskBar score={s.risk_score} />
            </div>

            {/* Facilities */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex gap-0.5">
                <FacilityIcon has={s.has_medical} Icon={Heart} label="Medical" />
                <FacilityIcon has={s.is_accessible} Icon={Accessibility} label="Accessible" />
                <FacilityIcon has={s.has_power} Icon={Zap} label="Power" />
                <FacilityIcon has={s.has_communication} Icon={Wifi} label="Communication" />
              </div>
              {s.contact_name && (
                <span className="text-xs text-gray-400">{s.contact_name}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">{editing ? 'Edit Shelter' : 'Add New Shelter'}</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {[
                  { key: 'shelter_id', label: 'Shelter ID *', placeholder: 'S-11' },
                  { key: 'name', label: 'Shelter Name *', placeholder: 'Community Center' },
                  { key: 'address', label: 'Address', placeholder: 'Full address' },
                  { key: 'total_capacity', label: 'Total Capacity *', type: 'number', placeholder: '500' },
                  { key: 'current_occupancy', label: 'Current Occupancy', type: 'number', placeholder: '0' },
                  { key: 'latitude', label: 'Latitude', placeholder: '13.0827' },
                  { key: 'longitude', label: 'Longitude', placeholder: '80.2707' },
                  { key: 'risk_score', label: 'Risk Score (0-1)', type: 'number', placeholder: '0.1' },
                  { key: 'contact_name', label: 'Contact Name', placeholder: 'Manager name' },
                  { key: 'contact_phone', label: 'Contact Phone', placeholder: '+91-XXXXXXXXXX' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">{label}</label>
                    <input type={type || 'text'} value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rescue-blue transition" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rescue-blue transition">
                    {['operational', 'full', 'closed', 'damaged'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2 grid grid-cols-3 gap-3">
                  {[
                    { key: 'has_medical', label: 'Medical Facilities' },
                    { key: 'has_food', label: 'Food Supply' },
                    { key: 'has_water', label: 'Water Supply' },
                    { key: 'has_sanitation', label: 'Sanitation' },
                    { key: 'is_accessible', label: 'Wheelchair Accessible' },
                    { key: 'has_power', label: 'Power Supply' },
                    { key: 'has_communication', label: 'Communication' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={(form as any)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                        className="w-4 h-4 accent-rescue-blue" />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rescue-blue transition resize-none" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                <button onClick={() => setModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-2 bg-rescue-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2">
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editing ? 'Save Changes' : 'Add Shelter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const DEMO_SHELTERS = [
  { id: 1, shelter_id: 'S-01', name: 'Gandhi Community Center', address: 'Anna Nagar, Chennai', latitude: 13.0850, longitude: 80.2101, total_capacity: 800, current_occupancy: 320, available_capacity: 480, occupancy_pct: 40, has_medical: true, has_food: true, has_water: true, has_sanitation: true, is_accessible: true, has_power: true, has_communication: true, risk_score: 0.08, status: 'operational', contact_name: 'Ravi Kumar', contact_phone: '+91-9876543210' },
  { id: 2, shelter_id: 'S-02', name: 'St. Thomas School Shelter', address: 'Mylapore, Chennai', latitude: 13.0339, longitude: 80.2676, total_capacity: 500, current_occupancy: 480, available_capacity: 20, occupancy_pct: 96, has_medical: true, has_food: true, has_water: true, has_sanitation: true, is_accessible: true, has_power: true, has_communication: true, risk_score: 0.22, status: 'operational', contact_name: 'Sr. Mary', contact_phone: '+91-9876543211' },
  { id: 6, shelter_id: 'S-06', name: 'Army Relief Center Bravo', address: 'Avadi, Chennai', latitude: 13.1143, longitude: 80.0982, total_capacity: 2000, current_occupancy: 650, available_capacity: 1350, occupancy_pct: 32.5, has_medical: true, has_food: true, has_water: true, has_sanitation: true, is_accessible: true, has_power: true, has_communication: true, risk_score: 0.05, status: 'operational', contact_name: 'Major Krishnan', contact_phone: '+91-9876543215' },
  { id: 8, shelter_id: 'S-08', name: 'Coastal Road Damaged Shelter', address: 'Marina Beach Road', latitude: 13.0592, longitude: 80.2804, total_capacity: 300, current_occupancy: 0, available_capacity: 0, occupancy_pct: 0, has_medical: false, has_food: false, has_water: false, has_sanitation: false, is_accessible: false, has_power: false, has_communication: false, risk_score: 0.95, status: 'damaged', contact_name: 'N/A', contact_phone: 'N/A', notes: 'DO NOT USE' },
]
