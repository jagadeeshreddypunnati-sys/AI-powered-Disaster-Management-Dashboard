'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Building2, AlertTriangle, CheckCircle2, XCircle,
  TrendingUp, MapPin, Clock, Zap, Shield
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import { api } from '@/lib/api'

const COLORS = { critical: '#EF4444', high: '#F97316', moderate: '#F59E0B', low: '#10B981' }
const PIE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6']

function StatCard({ title, value, sub, icon: Icon, color, trend }: any) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white rounded-xl p-5 shadow-card border border-rescue-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value?.toLocaleString?.() ?? value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-rescue-green" />
          <span className="text-xs text-rescue-green font-medium">{trend}</span>
        </div>
      )}
    </motion.div>
  )
}

function AlertBadge({ level }: { level: string }) {
  const cls = {
    critical: 'badge-critical', high: 'badge-high',
    warning: 'badge-moderate', info: 'badge-low',
  }[level] || 'badge-low'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{level.toUpperCase()}</span>
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/analytics/dashboard')
      .then(r => setData(r.data))
      .catch(() => {
        // Demo fallback
        setData(DEMO_DATA)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-rescue-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Loading dashboard data...</p>
      </div>
    </div>
  )

  const stats = data?.stats || {}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Emergency Command Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time disaster response coordination — <span className="text-orange-500 font-medium">⚠ SIMULATED DATA</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Last updated</p>
          <p className="text-sm font-medium text-gray-700">{new Date().toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Affected Population" value={stats.total_affected} icon={Users} color="bg-rescue-red" sub="Across all disaster zones" />
        <StatCard title="Registered Victims" value={stats.registered_victims} icon={Shield} color="bg-rescue-blue" sub="Family groups" />
        <StatCard title="Active Shelters" value={stats.active_shelters} icon={Building2} color="bg-rescue-green" sub="Operational" />
        <StatCard title="Available Spaces" value={stats.available_spaces} icon={CheckCircle2} color="bg-emerald-500" sub={`${100 - (stats.occupancy_pct || 0)}% capacity free`} />
        <StatCard title="Pending Alloc." value={stats.pending_allocations} icon={Clock} color="bg-rescue-orange" sub="Awaiting assignment" />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Capacity" value={stats.total_capacity} icon={Building2} color="bg-indigo-500" />
        <StatCard title="Occupancy Rate" value={`${stats.occupancy_pct}%`} icon={TrendingUp} color="bg-blue-500" />
        <StatCard title="High-Risk Zones" value={stats.high_risk_zones} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Allocated People" value={stats.successful_allocations} icon={CheckCircle2} color="bg-green-500" trend="+18% today" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shelter Capacity Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-card border border-rescue-border">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-rescue-blue" /> Shelter Capacity Utilization
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.capacity_chart} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="occupied" fill="#3B82F6" radius={[2, 2, 0, 0]} name="Occupied" />
              <Bar dataKey="available" fill="#10B981" radius={[2, 2, 0, 0]} name="Available" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-xl p-5 shadow-card border border-rescue-border">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-rescue-blue" /> Priority Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data?.priority_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {data?.priority_distribution?.map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts + Activities + AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <div className="bg-white rounded-xl p-5 shadow-card border border-rescue-border">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rescue-red" /> Critical Alerts
          </h3>
          <div className="space-y-3">
            {data?.alerts?.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <AlertBadge level={a.level} />
                <p className="text-xs text-gray-700 leading-relaxed">{a.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl p-5 shadow-card border border-rescue-border">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-rescue-blue" /> Recent Activities
          </h3>
          <div className="space-y-3">
            {data?.recent_activities?.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rescue-blue mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-800">{a.action}</p>
                  <p className="text-xs text-gray-500">{a.details}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-xl p-5 shadow-card border border-rescue-border">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" /> AI Recommendations
          </h3>
          <div className="space-y-3">
            {data?.ai_recommendations?.map((r: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">{r.algorithm}</span>
                  <span className="text-[10px] text-gray-500">Confidence: {(r.confidence * 100).toFixed(0)}%</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{r.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disaster Zones Overview */}
      <div className="bg-white rounded-xl p-5 shadow-card border border-rescue-border">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rescue-red" /> Active Disaster Zones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {data?.disaster_zones?.map((z: any, i: number) => (
            <div key={i} className={`p-3 rounded-lg border-l-4 ${
              z.risk === 'critical' ? 'bg-red-50 border-red-500' :
              z.risk === 'high' ? 'bg-orange-50 border-orange-500' :
              z.risk === 'moderate' ? 'bg-yellow-50 border-yellow-500' :
              'bg-green-50 border-green-500'
            }`}>
              <p className="text-xs font-semibold text-gray-800 leading-tight">{z.name}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase">{z.type}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{z.affected?.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">affected</p>
              <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                z.risk === 'critical' ? 'bg-red-100 text-red-700' :
                z.risk === 'high' ? 'bg-orange-100 text-orange-700' :
                z.risk === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>{z.risk?.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Demo data fallback
const DEMO_DATA = {
  stats: {
    total_affected: 51200, registered_victims: 12, active_shelters: 9,
    total_capacity: 9400, available_spaces: 6570, occupancy_pct: 30.1,
    high_risk_zones: 4, pending_allocations: 9, successful_allocations: 3,
  },
  capacity_chart: [
    { name: 'S-01', occupied: 320, available: 480 },
    { name: 'S-03', occupied: 410, available: 790 },
    { name: 'S-04', occupied: 180, available: 420 },
    { name: 'S-06', occupied: 650, available: 1350 },
    { name: 'S-09', occupied: 800, available: 2200 },
  ],
  priority_distribution: [
    { name: 'Critical', value: 4 }, { name: 'High', value: 3 },
    { name: 'Medium', value: 4 }, { name: 'Low', value: 1 },
  ],
  risk_distribution: [
    { name: 'Critical', value: 2 }, { name: 'High', value: 2 }, { name: 'Moderate', value: 1 },
  ],
  alerts: [
    { level: 'critical', message: 'Cyclone Category 4 approaching — 25,000 people at risk' },
    { level: 'high', message: 'S-02 Shelter nearing full capacity (96%)' },
    { level: 'warning', message: '12 high-priority victims still unallocated' },
  ],
  recent_activities: [
    { time: '2 min ago', action: 'CSP Allocation Run', details: '12 victims allocated to 4 shelters', type: 'allocation' },
    { time: '15 min ago', action: 'Shelter S-06 Updated', details: 'Capacity increased to 2000', type: 'shelter' },
    { time: '32 min ago', action: 'New Victims Registered', details: '15 family groups from Besant Nagar', type: 'victim' },
    { time: '1 hr ago', action: 'Disaster Alert', details: 'Cyclone warning upgraded to Category 4', type: 'alert' },
    { time: '2 hrs ago', action: 'Agent Coordination', details: 'Multi-agent plan executed successfully', type: 'agent' },
  ],
  ai_recommendations: [
    { algorithm: 'CSP', recommendation: 'Allocate V-003, V-007, V-010 to S-06 (medical + capacity)', confidence: 0.94 },
    { algorithm: 'Bayesian', recommendation: 'S-08 risk P=0.95 — evacuate nearby residents immediately', confidence: 0.91 },
    { algorithm: 'Multi-Agent', recommendation: 'Coordinated plan: 47 victims → 4 shelters, 2 conflicts resolved', confidence: 0.88 },
  ],
  disaster_zones: [
    { name: 'Chennai Coastal Flood', type: 'flood', risk: 'critical', affected: 12500 },
    { name: 'Western Ghats Landslide', type: 'landslide', risk: 'high', affected: 3200 },
    { name: 'Coimbatore Earthquake', type: 'earthquake', risk: 'high', affected: 8700 },
    { name: 'Nilgiris Wildfire', type: 'wildfire', risk: 'moderate', affected: 1800 },
    { name: 'Bay of Bengal Cyclone', type: 'cyclone', risk: 'critical', affected: 25000 },
  ],
}
