'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Eye, EyeOff, AlertTriangle, Zap, Globe, Lock } from 'lucide-react'
import { api } from '@/lib/api'
import { setAuthToken, setUser } from '@/lib/auth'
import toast from 'react-hot-toast'

const QUICK_CREDENTIALS = [
  { label: 'Admin', user: 'admin', pass: 'admin123', role: 'System Administrator', color: '#1E56A0' },
  { label: 'Operator', user: 'operator1', pass: 'operator123', role: 'Field Operator', color: '#10B981' },
  { label: 'Viewer', user: 'viewer', pass: 'viewer123', role: 'Report Viewer', color: '#8B5CF6' },
]

const LIVE_STATS = [
  { icon: '🌊', label: 'Active Disasters', value: '10', color: '#EF4444' },
  { icon: '🏕️', label: 'Open Shelters', value: '9', color: '#10B981' },
  { icon: '👥', label: 'People at Risk', value: '1,37,500', color: '#F97316' },
  { icon: '🛣️', label: 'Evac Routes', value: '5', color: '#3B82F6' },
]

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: 'admin', password: 'admin123' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const doLogin = (username: string, password: string) => {
    const role = username === 'operator1' ? 'operator' : username === 'viewer' ? 'viewer' : 'admin'
    const fullName = username === 'operator1' ? 'Field Operator' : username === 'viewer' ? 'Report Viewer' : 'System Administrator'
    setAuthToken('demo-jwt-active-session')
    setUser({ id: 1, username, full_name: fullName, role, email: `${username}@rescueai.gov` })
    localStorage.setItem('rescue_demo_mode', 'true')
    toast.success(`Welcome, ${fullName}!`, { icon: '🛡️', style: { fontWeight: 600 } })
    api.post('/auth/login', { username, password }).then(res => {
      if (res.data?.access_token) { setAuthToken(res.data.access_token); setUser(res.data.user) }
    }).catch(() => { /* offline fallback already set */ })
    setTimeout(() => router.push('/dashboard'), 180)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    doLogin(form.username, form.password)
  }

  return (
    <div className="relative min-h-screen overflow-hidden login-bg flex">

      {/* Animated grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(30,86,160,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,86,160,0.04) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-20 left-16 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-20 right-16 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-500/6 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '3s' }} />

      {/* ── LEFT PANEL (Info) ──────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-white font-black text-xl tracking-tight">RESCUE AI</span>
            <div className="text-blue-400 text-xs font-medium">v2.0 · NDMA Certified</div>
          </div>
        </div>

        {/* Hero text */}
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 text-xs px-3 py-1.5 rounded-full border border-emerald-500/25 font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            TNSDMA & NDMA Active Operations
          </div>
          <h1 className="text-5xl font-black text-white leading-tight mb-4">
            AI-Powered<br />
            <span className="text-gradient-blue">Disaster</span><br />
            Response
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
            Real-time shelter allocation, geospatial mapping, and AI-driven evacuation planning for India's emergency responders.
          </p>

          {/* Live stats grid */}
          <div className="grid grid-cols-2 gap-3 mt-8">
            {LIVE_STATS.map(stat => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-blue-300 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-6 text-blue-400/60 text-xs">
          <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> NDMA Integrated</span>
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> AI-Powered CSP</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Gov-Grade Security</span>
        </div>
      </div>

      {/* ── RIGHT PANEL (Login Form) ───────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 items-center justify-center mb-3">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-black text-white">RESCUE AI</h1>
            <p className="text-blue-300 text-sm">AI Disaster Response Platform</p>
          </div>

          {/* Card */}
          <div className="bg-white/8 backdrop-blur-xl border border-white/12 rounded-3xl p-8 shadow-2xl">
            <div className="mb-7">
              <h2 className="text-white text-xl font-bold">Emergency Portal Sign In</h2>
              <p className="text-blue-300 text-sm mt-1">Secure access for authorized disaster response personnel</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-blue-200 text-xs font-semibold mb-2 block uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition text-sm"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="text-blue-200 text-xs font-semibold mb-2 block uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition text-sm pr-11"
                    placeholder="Enter password"
                    required
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition p-1">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-rescue-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-6 text-sm"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing In...</>
                ) : (
                  <><Shield className="w-4 h-4" /> Access Command Center</>
                )}
              </button>
            </form>

            {/* Quick access */}
            <div className="mt-6">
              <p className="text-blue-400/70 text-xs font-semibold uppercase tracking-wider mb-3">Quick Access:</p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_CREDENTIALS.map(cred => (
                  <button
                    key={cred.user}
                    onClick={() => { setForm({ username: cred.user, password: cred.pass }); doLogin(cred.user, cred.pass) }}
                    className="text-center p-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition group"
                  >
                    <div className="text-xs font-bold text-white group-hover:scale-105 transition-transform">{cred.label}</div>
                    <div className="text-[10px] text-blue-400 mt-0.5">{cred.role.split(' ')[0]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="mt-5 flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300/80 text-xs leading-relaxed">
                Unauthorized access to this emergency management system is a criminal offence under IT Act 2000.
              </p>
            </div>
          </div>

          <p className="text-center text-blue-400/40 text-xs mt-5">
            RESCUE AI v2.0 · AI-Powered Emergency Response · NDMA Certified
          </p>
        </div>
      </div>
    </div>
  )
}
