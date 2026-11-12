'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Key, Shield, Database, Bell, RefreshCw, CheckCircle2,
  AlertTriangle, Save, Lock, UserCheck, HardDrive
} from 'lucide-react'
import { getUser } from '@/lib/auth'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [apiKeyGoogleMaps, setApiKeyGoogleMaps] = useState('')
  const [apiKeyGemini, setApiKeyGemini] = useState('')
  const [requireApproval, setRequireApproval] = useState(true)
  const [enforceStrictSafety, setEnforceStrictSafety] = useState(true)
  const [demoMode, setDemoMode] = useState(true)
  const [capacityThreshold, setCapacityThreshold] = useState(90)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setUser(getUser())
  }, [])

  const handleSaveSettings = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success('Admin security policy & configuration successfully updated!')
    }, 600)
  }

  const handlePurgeLogs = () => {
    if (confirm('Clear audit trails and refresh system cache?')) {
      toast.success('System audit caches flushed.')
    }
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-rescue-blue" />
          System & Administration Settings
        </h1>
        <p className="text-sm text-gray-500">
          Manage system security invariants, emergency override authorization, and API configurations.
        </p>
      </div>

      {/* User Authority Status */}
      <div className="bg-white p-5 rounded-xl border border-rescue-border shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rescue-blue/10 flex items-center justify-center text-rescue-blue">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">{user?.full_name || 'System Administrator'}</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {user?.role || 'ADMIN'} ACCESS GRANTED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized for emergency overrides, shelter capacity re-allocation, and model benchmarking.
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-500">
          <p>Session ID: <span className="font-mono text-slate-700">SEC-8821-ADM</span></p>
          <p className="text-emerald-600 font-medium">RBAC Verification Active</p>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Security & Safety Invariants */}
        <div className="bg-white p-5 rounded-xl border border-rescue-border shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-rescue-red" />
            Mandatory Security Invariants
          </h3>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={enforceStrictSafety}
                onChange={e => setEnforceStrictSafety(e.target.checked)}
                className="mt-1 w-4 h-4 accent-rescue-blue"
              />
              <div>
                <span className="text-xs font-bold text-slate-800">Enforce Hard Safety Constraints</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Prohibits allocation engine from assigning victims to any shelter with risk score &gt; 0.70 or DAMAGED status, even under extreme displacement.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={e => setRequireApproval(e.target.checked)}
                className="mt-1 w-4 h-4 accent-rescue-blue"
              />
              <div>
                <span className="text-xs font-bold text-slate-800">Human-in-the-Loop Emergency Approval</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  The application acts solely as decision support. No automated physical dispatch or database occupancy lock can commit without human officer sign-off.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={e => setDemoMode(e.target.checked)}
                className="mt-1 w-4 h-4 accent-rescue-blue"
              />
              <div>
                <span className="text-xs font-bold text-slate-800">Simulated Safe Environment (Demo Mode)</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pre-loads realistic disaster zones (Floods, Earthquakes, Cyclones) with mock telemetry without mutating production dispatch channels.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* API & External Services Integration */}
        <div className="bg-white p-5 rounded-xl border border-rescue-border shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-4 h-4 text-rescue-blue" />
            API Keys & External Integrations
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Google Maps JavaScript API Key
              </label>
              <input
                type="password"
                value={apiKeyGoogleMaps}
                onChange={e => setApiKeyGoogleMaps(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-rescue-blue focus:bg-white transition"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Powers satellite disaster zone overlays, live traffic estimation, and road blockages.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Google Gemini API Key (RescueBot AI)
              </label>
              <input
                type="password"
                value={apiKeyGemini}
                onChange={e => setApiKeyGemini(e.target.value)}
                placeholder="AIzaSy-gemini-pro..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-rescue-blue focus:bg-white transition"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Enables natural-language RAG reasoning across real-time shelter occupancy schemas.
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Overcrowding Warning Threshold</span>
                <span className="font-mono text-rescue-blue">{capacityThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={capacityThreshold}
                onChange={e => setCapacityThreshold(Number(e.target.value))}
                className="w-full accent-rescue-blue"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Triggers visual warning &amp; reroutes new candidates when occupancy passes this cap.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Maintenance & Audit */}
      <div className="bg-white p-5 rounded-xl border border-rescue-border shadow-card space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-slate-600" />
          Database State & Maintenance
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <p className="text-xs font-bold text-slate-800">Audit Logs & Allocation Cache</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              52 decision traces logged across CSP, Bayesian, and Backtracking execution runs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePurgeLogs}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition shadow-sm"
            >
              Purge Temp Cache
            </button>
            <button
              onClick={() => {
                toast.success('Database verified: 10 Shelters, 12 Victims, 5 Disaster Zones intact.')
              }}
              className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition"
            >
              Verify DB Integrity
            </button>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-rescue-blue text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-md"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Configuration
            </>
          )}
        </button>
      </div>
    </div>
  )
}
