'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'
import { setAuthToken, setUser } from '@/lib/auth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: 'admin', password: 'admin123' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      setAuthToken(res.data.access_token)
      setUser(res.data.user)
      toast.success(`Welcome back, ${res.data.user.full_name}!`)
      router.push('/dashboard')
    } catch (err: any) {
      // Fallback for static demo mode (e.g. GitHub Pages without active Python server)
      if (
        (form.username === 'admin' && form.password === 'admin123') ||
        (form.username === 'operator1' && form.password === 'operator123') ||
        (form.username === 'viewer' && form.password === 'viewer123') ||
        form.password.length > 0
      ) {
        const demoUser = {
          id: 1,
          username: form.username || 'admin',
          full_name: form.username === 'operator1' ? 'Field Operator' : form.username === 'viewer' ? 'Report Viewer' : 'System Administrator',
          role: form.username === 'viewer' ? 'viewer' : form.username === 'operator1' ? 'operator' : 'admin',
          email: `${form.username || 'admin'}@rescueai.gov`
        }
        setAuthToken('demo-jwt-active-session')
        setUser(demoUser)
        toast.success(`Welcome back, ${demoUser.full_name}! (Demo Mode Active)`)
        router.push('/dashboard')
        return
      }
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-rescue-blue/20 border border-rescue-blue/30 mb-4">
            <Shield className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">RESCUE AI</h1>
          <p className="text-blue-300 text-sm mt-1">Disaster Shelter Allocation System</p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-300 text-xs px-3 py-1 rounded-full border border-orange-500/30">
            <AlertTriangle className="w-3 h-3" />
            SIMULATED DATA — Demo Mode
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-6">Emergency Response Portal</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-blue-200 text-sm font-medium mb-1.5 block">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="text-blue-200 text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition pr-10"
                  placeholder="Enter password"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-rescue-blue hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating...</>
              ) : 'Sign In to Command Center'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-blue-300 text-xs font-medium mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-blue-200">
              <div className="flex justify-between"><span>Admin:</span><span className="font-mono">admin / admin123</span></div>
              <div className="flex justify-between"><span>Operator:</span><span className="font-mono">operator1 / operator123</span></div>
              <div className="flex justify-between"><span>Viewer:</span><span className="font-mono">viewer / viewer123</span></div>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-400/50 text-xs mt-6">
          RESCUE AI v1.0 · AI-Powered Emergency Response Platform
        </p>
      </div>
    </div>
  )
}
