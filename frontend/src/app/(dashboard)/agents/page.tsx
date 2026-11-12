'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, Play, CheckCircle2, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const AGENT_ICONS = ['📍', '🛡️', '🏠', '🏥', '🧠', '🎯']
const AGENT_COLORS = [
  'border-blue-200 bg-blue-50',
  'border-red-200 bg-red-50',
  'border-green-200 bg-green-50',
  'border-pink-200 bg-pink-50',
  'border-purple-200 bg-purple-50',
  'border-amber-200 bg-amber-50',
]
const STATUS_COLORS: Record<string, string> = {
  ready: 'text-gray-500', processing: 'text-blue-600 animate-pulse',
  done: 'text-green-600', error: 'text-red-600',
}

export default function AgentsPage() {
  const [result, setResult] = useState<any>(null)
  const [running, setRunning] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [severity, setSeverity] = useState(0.5)
  const [victimLimit, setVictimLimit] = useState(15)

  const runAgents = async () => {
    setRunning(true)
    setResult(null)
    try {
      const r = await api.post('/api/agents/run', null, {
        params: { disaster_severity: severity, victim_limit: victimLimit }
      })
      setResult(r.data)
      toast.success(`${r.data.agents?.length || 6} agents completed coordination`)
    } catch (e: any) {
      toast.error('Agent system error: ' + (e.response?.data?.detail || e.message))
      setResult(DEMO_AGENT_RESULT)
    } finally {
      setRunning(false)
    }
  }

  const agents = result?.agents || []

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Multi-Agent AI Coordination</h1>
          <p className="text-sm text-gray-500">6 specialized agents exchange structured data for collaborative allocation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-600">Severity:</label>
            <input type="range" min="0.1" max="1.0" step="0.1" value={severity}
              onChange={e => setSeverity(parseFloat(e.target.value))}
              className="w-24 accent-rescue-blue" />
            <span className="text-xs font-mono text-gray-700">{severity.toFixed(1)}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={runAgents} disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 bg-rescue-blue text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 transition shadow-lg">
            {running ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running...</> : <><Play className="w-4 h-4" /> Run All Agents</>}
          </motion.button>
        </div>
      </div>

      {/* Agent Pipeline Diagram */}
      <div className="bg-white rounded-xl p-5 shadow-card border border-rescue-border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
          <Network className="w-4 h-4 text-rescue-blue" /> Agent Pipeline
        </h3>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {['Location\nAgent', 'Safety\nAgent', 'Shelter\nAgent', 'Medical\nAgent', 'Allocation\nAgent', 'Coordinator\nAgent'].map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 min-w-24 text-center ${
                agents[i]?.status === 'done' ? AGENT_COLORS[i] : 'border-gray-100 bg-gray-50'
              }`}>
                <span className="text-2xl">{AGENT_ICONS[i]}</span>
                <span className="text-xs font-medium text-gray-700 leading-tight whitespace-pre-line">{name}</span>
                {agents[i] && (
                  <span className={`text-[9px] font-bold uppercase ${STATUS_COLORS[agents[i].status]}`}>
                    {agents[i].status} ✓
                  </span>
                )}
              </div>
              {i < 5 && <div className="text-gray-300 text-xl flex-shrink-0">→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Final Decision Banner */}
      {result?.final_recommendation && (
        <div className="bg-gradient-to-r from-rescue-blue to-blue-700 text-white rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-200" />
            <h3 className="font-bold">Coordinator Final Decision</h3>
            <span className="ml-auto text-xs bg-white/20 px-3 py-1 rounded-full">{result.total_time_ms}ms total</span>
          </div>
          <pre className="text-sm text-blue-100 whitespace-pre-wrap font-sans leading-relaxed">{result.final_recommendation}</pre>
          {result.conflicts_resolved > 0 && (
            <div className="mt-3 text-xs bg-white/10 rounded-lg px-3 py-2">
              ✅ {result.conflicts_resolved} conflict(s) detected and resolved
            </div>
          )}
        </div>
      )}

      {/* Individual Agent Results */}
      {agents.length > 0 && (
        <div className="space-y-3">
          {agents.map((agent: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white rounded-xl shadow-card border border-rescue-border overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl">{AGENT_ICONS[i]}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{agent.agent_name}</h4>
                    <p className="text-xs text-gray-500">{agent.responsibility}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold uppercase ${STATUS_COLORS[agent.status] || ''}`}>
                    {agent.status === 'done' ? '✅' : '⏳'} {agent.status}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{agent.processing_time_ms}ms</span>
                  {expanded === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              <AnimatePresence>
                {expanded === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-gray-100">
                    <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Input</p>
                        <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-lg">{agent.input_summary}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Output</p>
                        <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-lg">{agent.output_summary}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Recommendation</p>
                        <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded-lg">{agent.recommendation}</p>
                      </div>

                      {/* Details */}
                      {agent.details && Object.keys(agent.details).length > 0 && (
                        <div className="col-span-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Structured Data Exchange</p>
                          <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-auto max-h-40 font-mono">
                            {JSON.stringify(agent.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {!result && !running && (
        <div className="bg-white rounded-xl p-16 shadow-card border border-rescue-border flex flex-col items-center justify-center text-center">
          <Network className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="font-semibold text-gray-700">Multi-Agent System Ready</h3>
          <p className="text-sm text-gray-400 mt-2 max-w-xs">Click "Run All Agents" to start the 6-agent coordination pipeline. Each agent analyzes a specific domain and passes structured data to the next.</p>
        </div>
      )}
    </div>
  )
}

const DEMO_AGENT_RESULT = {
  total_time_ms: 234, conflicts_resolved: 2,
  final_recommendation: `FINAL COORDINATED ALLOCATION PLAN:
• 47 people allocated across 4 operational shelters
• 1 person remains unallocated (insufficient medical capacity)
• Average evacuation distance: 11.4km
• 2820 shelter spaces available
• 2 conflict(s) detected and resolved
• Medical/disabled victims pre-routed to S-04 and S-06
• All unsafe shelters excluded from final plan`,
  agents: [
    { agent_name: 'Location Agent', status: 'done', responsibility: 'Distance & route evaluation', processing_time_ms: 12.3, input_summary: 'Analyzed 12 victims against 10 shelters', output_summary: 'Distance matrix computed. Avg 11.4km to nearest safe shelter', recommendation: 'Prioritize shelters within 15km. 10 victims have reachable options.', details: { avg_distance_km: 11.4, victims_without_location: 2 } },
    { agent_name: 'Safety Agent', status: 'done', responsibility: 'Risk assessment', processing_time_ms: 8.1, input_summary: 'Assessed 10 shelters under severity 50%', output_summary: '8 safe shelters, 2 unsafe. 4 high-priority victims.', recommendation: 'Exclude 2 unsafe shelters. 4 critical victims need immediate allocation.', details: { safe_shelters: 8, unsafe_shelters: 2, disaster_severity: 0.5 } },
    { agent_name: 'Shelter Agent', status: 'done', responsibility: 'Capacity & facility verification', processing_time_ms: 5.2, input_summary: 'Evaluated 10 shelters', output_summary: '2820 total spaces available. 5 medical shelters.', recommendation: 'Adequate capacity for current demand. 2 shelters nearing full capacity.', details: { total_capacity: 9400, total_available: 2820, medical_shelters: 5 } },
    { agent_name: 'Medical Agent', status: 'done', responsibility: 'Medical prioritization', processing_time_ms: 7.8, input_summary: '12 victims analyzed for medical needs', output_summary: '5 need medical care, 2 need accessibility, 1200 medical spaces available', recommendation: 'Pre-assign medical cases to S-01, S-04, S-06. No capacity conflict detected.', details: { medical_victims: 5, medical_capacity: 1200, capacity_conflict: false } },
    { agent_name: 'Allocation Agent', status: 'done', responsibility: 'CSP & Bayesian algorithms', processing_time_ms: 185.4, input_summary: 'CSP + Bayesian on 12 victims, 10 shelters', output_summary: 'CSP: 47 allocated (847 states, 42ms). Bayesian: 45 allocated.', recommendation: 'CSP allocates 47 people. Recommend CSP as primary plan.', details: { states_explored: 847, execution_time_ms: 42.3 } },
    { agent_name: 'Coordinator Agent', status: 'done', responsibility: 'Conflict resolution & final plan', processing_time_ms: 15.2, input_summary: 'Aggregating 5 agent outputs', output_summary: '2 conflicts resolved. Final plan ready.', recommendation: 'All agents coordinated. 2 conflicts resolved (capacity + medical routing).', details: { conflicts_detected: ['S-02 near capacity', 'Medical routing adjusted'], conflicts_resolved: 2 } },
  ],
}
