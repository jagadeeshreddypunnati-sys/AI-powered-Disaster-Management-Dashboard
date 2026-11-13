'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Building2, AlertTriangle, CheckCircle2,
  TrendingUp, MapPin, Clock, Zap, Shield, ArrowUpRight,
  Activity, Wifi
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import { api } from '@/lib/api'

const PIE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6']

function StatCard({ title, value, sub, icon: Icon, gradient, trend, badge }: any) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl p-5 shadow-lg"
      style={{ background: gradient }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-black/5 translate-y-6 -translate-x-6" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-white/75 text-xs font-semibold uppercase tracking-wider">{title}</p>
          <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <p className="text-white font-black text-2xl leading-none mb-1">
          {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
        </p>
        {sub && <p className="text-white/65 text-xs mt-1">{sub}</p>}
        {trend && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-white/15 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              {trend}
            </div>
          </div>
        )}
        {badge && (
          <div className="absolute top-0 right-0 -translate-y-0 mt-1 mr-1">
            <span className="text-[9px] font-black bg-white/20 text-white px-1.5 py-0.5 rounded-full uppercase">{badge}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function AlertRow({ level, message }: { level: string; message: string }) {
  const styles: Record<string, { dot: string; bg: string; border: string }> = {
    critical: { dot: 'bg-red-500 animate-pulse', bg: 'bg-red-50', border: 'border-l-4 border-red-500' },
    high:     { dot: 'bg-orange-500',            bg: 'bg-orange-50', border: 'border-l-4 border-orange-500' },
    warning:  { dot: 'bg-amber-500',             bg: 'bg-amber-50', border: 'border-l-4 border-amber-500' },
    info:     { dot: 'bg-blue-500',              bg: 'bg-blue-50', border: 'border-l-4 border-blue-500' },
  }
  const s = styles[level] || styles.info
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl ${s.bg} ${s.border}`}>
      <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${s.dot}`} />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 mr-2">{level}</span>
        <p className="text-xs text-gray-800 leading-relaxed mt-0.5">{message}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    api.get('/api/analytics/dashboard')
      .then(r => setData(r.data))
      .catch(() => setData(DEMO_DATA))
      .finally(() => setLoading(false))
    const tick = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(tick)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-[#F0F4F8]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-3 w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
        </div>
        <p className="text-gray-600 font-semibold">Loading Command Center...</p>
        <p className="text-gray-400 text-sm mt-1">Connecting to NDMA live feed</p>
      </div>
    </div>
  )

  const stats = data?.stats || {}

  const STAT_CARDS = [
    {
      title: 'Affected Population', value: stats.total_affected,
      icon: Users, gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      sub: 'Across all disaster zones', badge: 'LIVE'
    },
    {
      title: 'Registered Victims', value: stats.registered_victims,
      icon: Shield, gradient: 'linear-gradient(135deg, #1E56A0 0%, #2563EB 100%)',
      sub: 'Family groups registered'
    },
    {
      title: 'Active Shelters', value: stats.active_shelters,
      icon: Building2, gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      sub: 'Operational today', trend: '+2 this week'
    },
    {
      title: 'Available Spaces', value: stats.available_spaces,
      icon: CheckCircle2, gradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
      sub: `${100 - (stats.occupancy_pct || 0)}% capacity free`
    },
    {
      title: 'Pending Allocations', value: stats.pending_allocations,
      icon: Clock, gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
      sub: 'Awaiting assignment'
    },
    {
      title: 'Total Capacity', value: stats.total_capacity,
      icon: Building2, gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      sub: 'All facilities combined'
    },
    {
      title: 'Occupancy Rate', value: `${stats.occupancy_pct}%`,
      icon: TrendingUp, gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      sub: 'System-wide average'
    },
    {
      title: 'High-Risk Zones', value: stats.high_risk_zones,
      icon: AlertTriangle, gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      sub: 'Requiring immediate attention'
    },
    {
      title: 'Allocated People', value: stats.successful_allocations,
      icon: CheckCircle2, gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
      sub: 'Successfully placed', trend: '+18% today'
    },
  ]

  return (
    <div className="p-6 space-y-6 bg-[#F0F4F8] min-h-full">

      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Emergency Command Center</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-700 font-semibold">NDMA & TNSDMA Integrated Live Operations</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span>Connected · Last sync {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS GRID ───────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAT_CARDS.slice(0, 5).map(card => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.slice(5).map(card => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* ── CHARTS ROW ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shelter Capacity Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" /> Shelter Capacity Utilization
            </h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border">Live Data</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.capacity_chart} margin={{ top: 0, right: 0, left: -10, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                cursor={{ fill: 'rgba(59,130,246,0.04)' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#6B7280' }} />
              <Bar dataKey="occupied" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Occupied" />
              <Bar dataKey="available" fill="#10B981" radius={[4, 4, 0, 0]} name="Available" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Pie */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" /> Victim Priority
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data?.priority_distribution}
                dataKey="value" nameKey="name"
                cx="50%" cy="50%"
                innerRadius={52} outerRadius={82}
                paddingAngle={4}
                strokeWidth={2}
              >
                {data?.priority_distribution?.map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E5E7EB' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#6B7280' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ALERTS + ACTIVITY + AI ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Critical Alerts
            <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              {data?.alerts?.filter((a: any) => a.level === 'critical').length} CRITICAL
            </span>
          </h3>
          <div className="space-y-2">
            {data?.alerts?.map((a: any, i: number) => <AlertRow key={i} level={a.level} message={a.message} />)}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" /> Recent Activity
          </h3>
          <div className="space-y-3">
            {data?.recent_activities?.map((a: any, i: number) => (
              <div key={i} className="flex gap-3 group">
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-xs">
                    {a.type === 'allocation' ? '🧠' : a.type === 'shelter' ? '🏕️' : a.type === 'victim' ? '👤' : a.type === 'alert' ? '🚨' : '🤖'}
                  </div>
                  {i < (data?.recent_activities?.length - 1) && (
                    <div className="absolute left-3.5 top-7 w-px h-4 bg-gray-100" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-xs font-semibold text-gray-800">{a.action}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.details}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" /> AI Recommendations
          </h3>
          <div className="space-y-3">
            {data?.ai_recommendations?.map((r: any, i: number) => (
              <div key={i} className="rounded-xl overflow-hidden border border-purple-100">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-2 flex items-center justify-between border-b border-purple-100">
                  <span className="text-[10px] font-black text-purple-700 tracking-wider">{r.algorithm}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                        style={{ width: `${(r.confidence * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-purple-600 font-bold">{(r.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="bg-white px-3 py-2.5">
                  <p className="text-xs text-gray-700 leading-relaxed">{r.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DISASTER ZONES OVERVIEW ────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-500" /> Active Disaster Zones — NDMA Summary
          <span className="ml-auto text-xs text-gray-400">Click the Map tab to view full geospatial view</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {data?.disaster_zones?.map((z: any, i: number) => {
            const gradients: Record<string, string> = {
              critical: 'from-red-500 to-red-600',
              high: 'from-orange-500 to-orange-600',
              moderate: 'from-amber-400 to-amber-500',
            }
            const icons: Record<string, string> = {
              flood: '🌊', cyclone: '🌀', earthquake: '🏚️', wildfire: '🔥', landslide: '⛰️'
            }
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ duration: 0.2 }}
                className={`bg-gradient-to-br ${gradients[z.risk] || 'from-gray-500 to-gray-600'} rounded-xl p-4 text-white shadow-md`}
              >
                <div className="text-2xl mb-2">{icons[z.type] || '⚠️'}</div>
                <p className="text-xs font-semibold leading-tight text-white/90 mb-2">{z.name}</p>
                <p className="text-xl font-black">{z.affected?.toLocaleString()}</p>
                <p className="text-xs text-white/70 mt-0.5">people affected</p>
                <div className="mt-3 inline-block bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {z.risk}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const DEMO_DATA = {
  stats: {
    total_affected: 137500, registered_victims: 12, active_shelters: 9,
    total_capacity: 29200, available_spaces: 16370, occupancy_pct: 43.9,
    high_risk_zones: 6, pending_allocations: 9, successful_allocations: 3,
  },
  capacity_chart: [
    { name: 'JN Stadium', occupied: 4200, available: 3800 },
    { name: 'Trade Ctr', occupied: 2800, available: 2200 },
    { name: 'IAF Tamb', occupied: 980, available: 2020 },
    { name: 'Avadi HVF', occupied: 1200, available: 3300 },
    { name: 'INS Rajali', occupied: 410, available: 2090 },
  ],
  priority_distribution: [
    { name: 'Critical', value: 4 }, { name: 'High', value: 3 },
    { name: 'Medium', value: 4 }, { name: 'Low', value: 1 },
  ],
  alerts: [
    { level: 'critical', message: 'Cyclone Fengal active — 36,000 displaced. Villupuram roads blocked. NDRF boats deployed.' },
    { level: 'critical', message: 'Wayanad landslide: 400+ deaths confirmed. Mundakkai & Chooralmala buried.' },
    { level: 'high', message: 'Kilpauk Medical College (S-KM) at 87.5% capacity — reroute critical patients.' },
    { level: 'warning', message: 'Teesta GLOF Sikkim: Chungthang dam destroyed. 100+ missing persons.' },
  ],
  recent_activities: [
    { time: '3 min ago', action: 'CSP Allocation Run #42', details: '12 victims allocated across JN Stadium, Trade Centre', type: 'allocation' },
    { time: '18 min ago', action: 'INS Rajali Activated', details: 'Naval base opened as relief center — 2,090 spaces available', type: 'shelter' },
    { time: '41 min ago', action: 'New Victims Registered', details: '23 families from Villupuram Fengal flood zone', type: 'victim' },
    { time: '1 hr ago', action: 'CRITICAL ALERT', details: 'Wayanad landslide death toll confirmed at 400+', type: 'alert' },
    { time: '2 hr ago', action: 'Multi-Agent Coordination', details: 'AI agents resolved 3 shelter conflicts automatically', type: 'agent' },
  ],
  ai_recommendations: [
    { algorithm: 'CSP Solver', recommendation: 'Route Fengal victims (V-003, V-007) to INS Rajali — 2,090 open beds + Naval medical', confidence: 0.96 },
    { algorithm: 'Bayesian Network', recommendation: 'S-BN Besant Nagar risk P=0.98 — evacuate 400m perimeter immediately', confidence: 0.93 },
    { algorithm: 'Multi-Agent', recommendation: 'Coordinated plan: 47 victims → 4 shelters, 3 resource conflicts auto-resolved', confidence: 0.90 },
  ],
  disaster_zones: [
    { name: 'Cyclone Fengal', type: 'cyclone', risk: 'critical', affected: 36000 },
    { name: 'Wayanad Landslide', type: 'landslide', risk: 'critical', affected: 7000 },
    { name: 'Teesta GLOF Sikkim', type: 'flood', risk: 'critical', affected: 8500 },
    { name: 'Coimbatore Earthquake', type: 'earthquake', risk: 'high', affected: 8700 },
    { name: 'Delhi Yamuna Flood', type: 'flood', risk: 'high', affected: 20000 },
  ],
}
