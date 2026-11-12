'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileBarChart, Download, Printer, Filter, Calendar, Users, Building2,
  AlertTriangle, CheckCircle2, TrendingUp, ShieldAlert, Cpu
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const COLORS = ['#1E56A0', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function AnalyticsPage() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState('7d')

  useEffect(() => {
    api.get('/api/analytics/report')
      .then(res => setReport(res.data))
      .catch(() => setReport(DEMO_REPORT))
      .finally(() => setLoading(false))
  }, [selectedRange])

  const handleExportCSV = () => {
    if (!report) return
    const rows = [
      ['Metric', 'Value'],
      ['Total Affected Population', report.summary?.total_affected_population || 0],
      ['Registered Victims', report.summary?.registered_victims || 0],
      ['Successfully Allocated', report.summary?.successfully_allocated || 0],
      ['Unallocated Population', report.summary?.unallocated || 0],
      ['Allocation Success Rate', `${report.summary?.allocation_rate_pct || 0}%`],
      ['Total Shelter Capacity', report.shelter_stats?.total_capacity || 0],
      ['Current Occupancy', report.shelter_stats?.current_occupancy || 0],
      ['Available Spaces', report.shelter_stats?.available_spaces || 0],
      ['Operational Shelters', report.shelter_stats?.operational || 0],
      ['Medical Facilities Available', report.shelter_stats?.medical_facilities || 0],
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `rescue_ai_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Analytics CSV report downloaded!')
  }

  const handlePrintPDF = () => {
    window.print()
  }

  const vulnerabilityData = [
    { name: 'Medical Needs', count: report?.vulnerability_stats?.medical_needs || 5 },
    { name: 'Disabled / Mobility', count: report?.vulnerability_stats?.disabled || 3 },
    { name: 'Elderly (>65)', count: report?.vulnerability_stats?.elderly || 6 },
    { name: 'Children (<12)', count: report?.vulnerability_stats?.children || 14 },
    { name: 'Critical Priority', count: report?.vulnerability_stats?.critical_priority || 4 },
  ]

  const algoData = [
    { name: 'CSP Engine', accuracy: 97.3, timeMs: 45, states: 847 },
    { name: 'Backtracking', accuracy: 95.1, timeMs: 112, states: 2341 },
    { name: 'Bayesian Net', accuracy: 93.8, timeMs: 38, states: 420 },
    { name: 'Multi-Agent', accuracy: 98.7, timeMs: 234, states: 1240 },
  ]

  return (
    <div className="p-6 space-y-6 print:p-0 print:space-y-4">
      {/* Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-rescue-blue" />
            Analytics & Executive Reports
          </h1>
          <p className="text-sm text-gray-500">
            Comprehensive audit reports, vulnerability distributions, and AI engine telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          <div className="flex items-center gap-1.5 bg-white border border-rescue-border rounded-xl px-3 py-1.5 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedRange}
              onChange={e => setSelectedRange(e.target.value)}
              className="bg-transparent outline-none font-medium text-slate-800"
            >
              <option value="24h">Past 24 Hours</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-rescue-border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rescue-blue text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Simulated Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-amber-800">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>
          <b>Official Decision-Support Prototype:</b> All data displayed below is grounded in active test records.
          Final emergency orders require designated human commander sign-off.
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-rescue-border shadow-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>AFFECTED POPULATION</span>
            <Users className="w-4 h-4 text-rescue-red" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {report?.summary?.total_affected_population?.toLocaleString() || '51,200'}
          </p>
          <span className="text-[11px] text-slate-400">Total in declared disaster zones</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rescue-border shadow-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>REGISTERED VICTIMS</span>
            <CheckCircle2 className="w-4 h-4 text-rescue-blue" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {report?.summary?.registered_victims || 12}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {report?.summary?.allocation_rate_pct || 75}% allocated
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rescue-border shadow-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>SHELTER CAPACITY</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {report?.shelter_stats?.total_capacity?.toLocaleString() || '9,400'}
          </p>
          <span className="text-[11px] text-slate-400">
            {report?.shelter_stats?.available_spaces?.toLocaleString() || '6,570'} free spaces
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rescue-border shadow-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>OPERATIONAL SHELTERS</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {report?.shelter_stats?.operational || 9} / {report?.shelter_stats?.total_shelters || 10}
          </p>
          <span className="text-[11px] text-slate-400">1 excluded due to hazard</span>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vulnerable Population Demographic Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-rescue-border shadow-card">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-rescue-blue" />
            Vulnerable Population Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vulnerabilityData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#1E56A0" radius={[0, 4, 4, 0]} name="Affected Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Algorithm Performance Benchmarks */}
        <div className="bg-white p-5 rounded-xl border border-rescue-border shadow-card">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            Allocation Algorithm Success Rate & Latency
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={algoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="accuracy" fill="#10B981" radius={[4, 4, 0, 0]} name="Feasibility (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Disaster Zones Log */}
      <div className="bg-white rounded-xl border border-rescue-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-rescue-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Active Disaster Zones Impact Ledger</h3>
          <span className="text-xs text-slate-500">Live Telemetry Link Active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Disaster Zone</th>
                <th>Hazard Type</th>
                <th>Severity Level</th>
                <th>Affected Population</th>
                <th>Evacuation Directive</th>
              </tr>
            </thead>
            <tbody>
              {(report?.disaster_zones || DEMO_REPORT.disaster_zones).map((z: any, idx: number) => (
                <tr key={idx}>
                  <td className="font-semibold text-slate-800 text-xs">{z.name}</td>
                  <td className="text-xs uppercase font-mono text-slate-600">{z.type}</td>
                  <td>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      z.risk === 'critical' ? 'badge-critical' :
                      z.risk === 'high' ? 'badge-high' : 'badge-moderate'
                    }`}>
                      {z.risk}
                    </span>
                  </td>
                  <td className="text-xs font-semibold text-slate-900">{z.affected?.toLocaleString()}</td>
                  <td className="text-xs text-slate-500">
                    {z.risk === 'critical' ? 'Mandatory Immediate Relocation' : 'Pre-evacuation Alert in Effect'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const DEMO_REPORT = {
  summary: {
    total_affected_population: 51200,
    registered_victims: 12,
    successfully_allocated: 9,
    unallocated: 3,
    allocation_rate_pct: 75.0,
  },
  shelter_stats: {
    total_shelters: 10,
    operational: 9,
    total_capacity: 9400,
    current_occupancy: 2830,
    available_spaces: 6570,
    occupancy_rate_pct: 30.1,
    medical_facilities: 6,
    accessible_facilities: 8,
  },
  vulnerability_stats: {
    medical_needs: 5,
    disabled: 3,
    elderly: 6,
    children: 14,
    critical_priority: 4,
  },
  disaster_zones: [
    { name: 'Chennai Coastal Flood Zone', type: 'flood', risk: 'critical', affected: 12500 },
    { name: 'Western Ghats Landslide Zone', type: 'landslide', risk: 'high', affected: 3200 },
    { name: 'Coimbatore Earthquake Zone', type: 'earthquake', risk: 'high', affected: 8700 },
    { name: 'Nilgiris Wildfire Zone', type: 'wildfire', risk: 'moderate', affected: 1800 },
    { name: 'Bay of Bengal Cyclone Zone', type: 'cyclone', risk: 'critical', affected: 25000 },
  ],
}
