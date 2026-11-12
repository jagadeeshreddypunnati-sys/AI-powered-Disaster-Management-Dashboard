'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit2, Trash2, Download, Filter, User, AlertTriangle, CheckCircle, Upload } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const PRIORITIES = ['critical', 'high', 'medium', 'low']
const PRIORITY_COLORS: Record<string, string> = {
  critical: 'badge-critical', high: 'badge-high', medium: 'badge-moderate', low: 'badge-low'
}

function PriorityBadge({ p }: { p: string }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[p] || ''}`}>{p.toUpperCase()}</span>
}

const EMPTY_FORM = {
  victim_id: '', representative_name: '', family_size: 1, current_location: '',
  latitude: '', longitude: '', medical_conditions: '', has_disability: false,
  mobility_requirements: '', children_count: 0, elderly_count: 0,
  priority: 'medium', special_requirements: '', disaster_zone_id: null,
}

export default function VictimsPage() {
  const [victims, setVictims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const params: any = { limit: 100 }
      if (search) params.search = search
      if (priorityFilter) params.priority = priorityFilter
      const r = await api.get('/api/victims/', { params })
      setVictims(r.data)
    } catch {
      setVictims(DEMO_VICTIMS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, priorityFilter])

  const openCreate = () => {
    const id = `V-${String(victims.length + 1).padStart(3, '0')}`
    setForm({ ...EMPTY_FORM, victim_id: id })
    setEditing(null)
    setModal(true)
  }

  const openEdit = (v: any) => {
    setForm({ ...v, latitude: v.latitude || '', longitude: v.longitude || '' })
    setEditing(v)
    setModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        family_size: Number(form.family_size),
        children_count: Number(form.children_count),
        elderly_count: Number(form.elderly_count),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      }
      if (editing) {
        await api.put(`/api/victims/${editing.id}`, payload)
        toast.success('Victim record updated')
      } else {
        await api.post('/api/victims/', payload)
        toast.success('Victim registered successfully')
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
    if (!confirm(`Delete record for ${name}?`)) return
    try {
      await api.delete(`/api/victims/${id}`)
      toast.success('Record deleted')
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  const exportCSV = () => {
    const header = 'ID,Name,Family Size,Location,Priority,Medical,Disability,Allocated\n'
    const rows = victims.map(v =>
      `${v.victim_id},${v.representative_name},${v.family_size},${v.current_location || ''},${v.priority},${v.medical_conditions || ''},${v.has_disability},${v.is_allocated}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'victims.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Victim Registry</h1>
          <p className="text-sm text-gray-500">{victims.length} records · Auto-priority classification enabled</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-rescue-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" /> Register Victim
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-card border border-rescue-border flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-50 border border-gray-200 rounded-lg px-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, or location..." className="flex-1 bg-transparent py-2 text-sm outline-none" />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setPriorityFilter('')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition ${!priorityFilter ? 'bg-rescue-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All
          </button>
          {PRIORITIES.map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition capitalize ${priorityFilter === p ? 'bg-rescue-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card border border-rescue-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Representative</th><th>Family Size</th>
                <th>Location</th><th>Medical</th><th>Priority</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : victims.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No victims found</td></tr>
              ) : victims.map(v => (
                <tr key={v.id}>
                  <td className="font-mono text-xs text-gray-500">{v.victim_id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-rescue-blue" />
                      </div>
                      <span className="text-sm font-medium text-gray-800">{v.representative_name}</span>
                    </div>
                  </td>
                  <td className="text-sm text-center">
                    <span className="font-semibold">{v.family_size}</span>
                    {v.children_count > 0 && <span className="text-xs text-gray-400 ml-1">({v.children_count} child)</span>}
                    {v.elderly_count > 0 && <span className="text-xs text-gray-400 ml-1">({v.elderly_count} elderly)</span>}
                  </td>
                  <td className="text-xs text-gray-600 max-w-32 truncate">{v.current_location || '—'}</td>
                  <td className="text-xs">
                    {v.medical_conditions ? (
                      <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-[10px]">Medical Need</span>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                    {v.has_disability && (
                      <span className="ml-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-[10px]">Disability</span>
                    )}
                  </td>
                  <td><PriorityBadge p={v.priority} /></td>
                  <td>
                    {v.is_allocated ? (
                      <span className="flex items-center gap-1 text-xs text-rescue-green"><CheckCircle className="w-3.5 h-3.5" /> Allocated</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-orange-500"><AlertTriangle className="w-3.5 h-3.5" /> Pending</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(v)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(v.id, v.representative_name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">{editing ? 'Edit Victim Record' : 'Register New Victim'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Auto-priority classification based on vulnerability factors</p>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {[
                  { key: 'victim_id', label: 'Victim/Group ID', placeholder: 'V-001', required: true },
                  { key: 'representative_name', label: 'Representative Name', placeholder: 'Full name', required: true },
                  { key: 'family_size', label: 'Family Size', type: 'number', placeholder: '1' },
                  { key: 'children_count', label: 'Children Count', type: 'number', placeholder: '0' },
                  { key: 'elderly_count', label: 'Elderly Count', type: 'number', placeholder: '0' },
                  { key: 'current_location', label: 'Current Location', placeholder: 'Area, City' },
                  { key: 'latitude', label: 'Latitude', placeholder: '13.0827' },
                  { key: 'longitude', label: 'Longitude', placeholder: '80.2707' },
                ].map(({ key, label, type, placeholder, required }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">{label}{required && ' *'}</label>
                    <input
                      type={type || 'text'}
                      value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rescue-blue focus:ring-1 focus:ring-rescue-blue transition"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Medical Conditions</label>
                  <textarea
                    value={form.medical_conditions}
                    onChange={e => setForm(f => ({ ...f, medical_conditions: e.target.value }))}
                    placeholder="List any medical conditions (diabetes, heart condition, etc.)"
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rescue-blue transition resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Priority Level</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rescue-blue transition">
                    {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <input type="checkbox" id="disability" checked={form.has_disability}
                    onChange={e => setForm(f => ({ ...f, has_disability: e.target.checked }))}
                    className="w-4 h-4 accent-rescue-blue" />
                  <label htmlFor="disability" className="text-sm text-gray-700">Has disability / mobility requirements</label>
                </div>
                {form.has_disability && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Mobility Requirements</label>
                    <input value={form.mobility_requirements}
                      onChange={e => setForm(f => ({ ...f, mobility_requirements: e.target.value }))}
                      placeholder="Wheelchair access, bed required, etc."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rescue-blue transition" />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Special Requirements</label>
                  <textarea value={form.special_requirements}
                    onChange={e => setForm(f => ({ ...f, special_requirements: e.target.value }))}
                    placeholder="Any additional special accommodation requirements..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rescue-blue transition resize-none" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                <button onClick={() => setModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-2 bg-rescue-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2">
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editing ? 'Save Changes' : 'Register Victim'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const DEMO_VICTIMS = [
  { id: 1, victim_id: 'V-001', representative_name: 'Rajesh Kumar', family_size: 5, current_location: 'Besant Nagar, Chennai', medical_conditions: 'Diabetes, Hypertension', has_disability: false, children_count: 2, elderly_count: 1, priority: 'high', is_allocated: false },
  { id: 3, victim_id: 'V-003', representative_name: 'Ibrahim Sheikh', family_size: 7, current_location: 'Royapuram, Chennai', medical_conditions: 'Heart condition', has_disability: true, children_count: 3, elderly_count: 1, priority: 'critical', is_allocated: false },
  { id: 10, victim_id: 'V-010', representative_name: 'Kamala Bai', family_size: 1, current_location: 'Triplicane, Chennai', medical_conditions: 'Post-surgery recovery', has_disability: true, children_count: 0, elderly_count: 1, priority: 'critical', is_allocated: false },
  { id: 12, victim_id: 'V-012', representative_name: 'Fatima Begum', family_size: 9, current_location: 'Pulianthope, Chennai', medical_conditions: 'Pregnant (8 months)', has_disability: false, children_count: 4, elderly_count: 1, priority: 'critical', is_allocated: false },
]
