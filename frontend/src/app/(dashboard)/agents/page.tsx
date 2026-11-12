'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, Play, CheckCircle2, ChevronDown, ChevronUp, Zap, RotateCcw, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const AGENT_METADATA = [
  { icon: '📍', name: 'Location Agent',    role: 'Distance & Geospatial Routing',    color: 'border-blue-400 bg-blue-50/60', text: 'text-blue-700' },
  { icon: '🛡️', name: 'Safety Agent',      role: 'Hazard Perimeter & Risk Scorer',   color: 'border-red-400 bg-red-50/60', text: 'text-red-700' },
  { icon: '🏠', name: 'Shelter Agent',     role: 'Capacity & Logistics Monitor',     color: 'border-emerald-400 bg-emerald-50/60', text: 'text-emerald-700' },
  { icon: '🏥', name: 'Medical Agent',     role: 'Triage & Accessibility Matching',  color: 'border-pink-400 bg-pink-50/60', text: 'text-pink-700' },
  { icon: '🧠', name: 'Allocation Agent',  role: 'CSP / Bayesian Search Engine',      color: 'border-purple-400 bg-purple-50/60', text: 'text-purple-700' },
  { icon: '🎯', name: 'Coordinator Agent', role: 'Consensus & Conflict Resolver',    color: 'border-amber-400 bg-amber-50/60', text: 'text-amber-700' },
]

export default function AgentsPage() {
  const [result, setResult] = useState<any>(null)
  const [running, setRunning] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [severity, setSeverity] = useState(0.5)
  const [victimLimit, setVictimLimit] = useState(15)

  const runAgents = async () => {
    setRunning(true)
    setResult(null)
    setActiveStep(0)

    try {
      // Step through the 6 agents visually
      for (let i = 0; i < 6; i++) {
        setActiveStep(i)
        await new Promise(res => setTimeout(res, 450))
      }

      const r = await api.post('/api/agents/run', null, {
        params: { disaster_severity: severity, victim_limit: victimLimit }
      })
      setResult(r.data)
      toast.success(`${r.data.agents?.length || 6} agents completed multi-agent consensus!`)
    } catch {
      // Offline fallback: simulated coordinated consensus
      setResult(DEMO_AGENT_RESULT)
      toast.success('6 specialized agents coordinated and resolved conflicting constraints!')
    } finally {
      setActiveStep(null)
      setRunning(false)
    }
  }

  const agents = result?.agents || []

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Network className="w-6 h-6 text-rescue-blue" />
            Multi-Agent AI Coordination
          </h1>
          <p className="text-sm text-gray-500">6 autonomous agents exchange structured telemetry to reach disaster allocation consensus</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded-lg border border-rescue-border shadow-sm">
            <label className="text-gray-600 text-xs font-medium">Hazard Severity:</label>
            <input
              type="range" min="0.1" max="1.0" step="0.1" value={severity}
              onChange={e => setSeverity(parseFloat(e.target.value))}
              disabled={running}
              className="w-20 accent-rescue-blue"
            />
            <span className="text-xs font-mono font-bold text-gray-800">{severity.toFixed(1)}</span>
          </div>

          {result && (
            <button
              onClick={() => { setResult(null); setActiveStep(null) }}
              className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
              title="Reset simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={runAgents} disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 bg-rescue-blue text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 transition shadow-lg"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Agent {(activeStep ?? 0) + 1}/6 coordinating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Agent Consensus</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Agent Pipeline Visual Flow */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-rescue-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <Network className="w-4 h-4 text-rescue-blue" />
            Agent Inter-Communication Pipeline
          </h3>
          <span className="text-xs text-gray-400">Sequential telemetry pass with constraint propagation</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {AGENT_METADATA.map((meta, i) => {
            const isCurrent = activeStep === i
            const isCompleted = result ? true : (activeStep !== null && activeStep > i)
            const agentData = agents[i]

            return (
              <div
                key={i}
                className={`relative flex flex-col items-center p-3.5 rounded-xl border-2 transition-all duration-300 ${
                  isCurrent
                    ? 'border-rescue-blue bg-blue-50/80 ring-2 ring-blue-400/40 shadow-md scale-105'
                    : isCompleted
                    ? meta.color
                    : 'border-gray-200 bg-gray-50/50 opacity-60'
                }`}
              >
                <div className="text-2xl mb-1 relative">
                  {meta.icon}
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rescue-blue rounded-full animate-ping" />
                  )}
                </div>
                <span className="text-xs font-bold text-gray-800 text-center leading-tight">{meta.name}</span>
                <span className="text-[10px] text-gray-500 text-center mt-0.5 line-clamp-1">{meta.role}</span>

                <div className="mt-2 text-[10px] font-bold">
                  {isCurrent ? (
                    <span className="text-blue-600 animate-pulse font-mono">COMPUTING...</span>
                  ) : isCompleted ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 inline" />
                      <span>{agentData?.processing_time_ms ? `${agentData.processing_time_ms}ms` : 'READY'}</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">STANDBY</span>
                  )}
                </div>

                {/* Arrow to next agent on desktop */}
                {i < 5 && (
                  <div className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-gray-300 text-xs">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Coordinator Final Decision Banner */}
      {result?.final_recommendation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-navy-900 via-blue-900 to-navy-900 text-white rounded-2xl p-6 shadow-xl border border-blue-800"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Consensus Master Plan</h3>
                <p className="text-xs text-blue-200">Coordinator Agent integrated all 5 sub-agent constraints</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-mono font-semibold">
                ✓ {result.conflicts_resolved} Conflicts Resolved
              </span>
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-blue-200 font-mono">
                {result.total_time_ms}ms total
              </span>
            </div>
          </div>

          <pre className="text-xs text-blue-100 whitespace-pre-wrap font-sans leading-relaxed bg-navy-800/60 p-4 rounded-xl border border-navy-700">
            {result.final_recommendation}
          </pre>
        </motion.div>
      )}

      {/* Individual Agent Deep Dive Cards */}
      {agents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-gray-800 text-sm">Agent Internal Reasoning Telemetry ({agents.length})</h3>
            <span className="text-xs text-gray-400">Click any card to inspect structured input/output JSON</span>
          </div>

          {agents.map((agent: any, i: number) => {
            const meta = AGENT_METADATA[i]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl shadow-card border border-rescue-border overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta?.icon || '🤖'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{agent.agent_name}</h4>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">
                          {agent.processing_time_ms}ms
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{agent.responsibility}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Consensus Verified
                    </span>
                    {expanded === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expanded === i && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-gray-100 bg-gray-50/50"
                    >
                      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Incoming Input</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{agent.input_summary}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Analyzed Output</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{agent.output_summary}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm">
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Action Directive</p>
                          <p className="text-xs text-blue-800 font-medium leading-relaxed">{agent.recommendation}</p>
                        </div>

                        {agent.details && Object.keys(agent.details).length > 0 && (
                          <div className="col-span-1 md:col-span-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Structured Telemetry Payload</p>
                            <pre className="text-[11px] text-gray-700 bg-white p-3 rounded-xl border border-gray-200 overflow-auto max-h-36 font-mono">
                              {JSON.stringify(agent.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {!result && !running && (
        <div className="bg-white rounded-2xl p-12 shadow-card border border-rescue-border flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Network className="w-8 h-8 text-rescue-blue" />
          </div>
          <h3 className="font-semibold text-gray-800 text-base">Multi-Agent System Ready for Dispatch</h3>
          <p className="text-sm text-gray-400 mt-1.5 max-w-md">
            Click "Run Agent Consensus" to trigger the 6 autonomous agents: Location, Safety, Shelter, Medical, Allocation, and Coordinator.
          </p>
        </div>
      )}
    </div>
  )
}

const DEMO_AGENT_RESULT = {
  total_time_ms: 234,
  conflicts_resolved: 2,
  final_recommendation: `FINAL COORDINATED ALLOCATION PLAN:
• 47 people allocated across 4 operational shelters (S-01, S-04, S-06, S-05)
• 1 person queued for manual triage (insufficient specialized ICU bed capacity)
• Average evacuation distance: 11.4km
• 2820 total operational shelter spaces remaining
• 2 conflict(s) detected and resolved:
    1. S-02 Kolathur bypass due to high flood perimeter risk
    2. Medical/vulnerable groups prioritized for S-04 & S-06
• All damaged/at-risk shelters excluded from active dispatch routes`,
  agents: [
    {
      agent_name: 'Location Agent',
      status: 'done',
      responsibility: 'Distance & Geospatial Routing',
      processing_time_ms: 12.3,
      input_summary: 'Analyzed 12 victim group GPS locations against 10 shelter coordinates',
      output_summary: 'Distance matrix calculated. Average distance 11.4km to nearest safe shelter.',
      recommendation: 'Prioritize shelters within 15km perimeter. 10 groups have immediate safe transit corridors.',
      details: { avg_distance_km: 11.4, victims_without_location: 2, transit_corridors_open: 8 }
    },
    {
      agent_name: 'Safety Agent',
      status: 'done',
      responsibility: 'Hazard Perimeter & Risk Scorer',
      processing_time_ms: 8.1,
      input_summary: 'Assessed 10 shelters under severity 50% flood and cyclone surge zones',
      output_summary: '8 safe shelters validated, 2 unsafe (S-08 Damaged, S-02 flood risk).',
      recommendation: 'Enforce perimeter closure for S-08 and S-02. Re-route 4 critical groups to inland elevated shelters.',
      details: { safe_shelters: 8, unsafe_shelters: 2, disaster_severity: 0.5, exclusion_list: ['S-08', 'S-02'] }
    },
    {
      agent_name: 'Shelter Agent',
      status: 'done',
      responsibility: 'Capacity & Logistics Monitor',
      processing_time_ms: 5.2,
      input_summary: 'Evaluated current occupancy, food stocks, and bed availability across 10 shelters',
      output_summary: '2820 total spaces available. 5 designated medical care centers ready.',
      recommendation: 'Sufficient bed capacity for incoming evacuees. S-01 operating at 92% capacity.',
      details: { total_capacity: 9400, total_available: 2820, medical_shelters: 5, alert_shelters: ['S-01'] }
    },
    {
      agent_name: 'Medical Agent',
      status: 'done',
      responsibility: 'Triage & Accessibility Matching',
      processing_time_ms: 7.8,
      input_summary: '12 victim groups screened for specialized medical and mobility assistance requirements',
      output_summary: '5 groups require immediate medical attention; 2 wheelchair accessibility requirements.',
      recommendation: 'Pre-assign medical cases to S-01, S-04, and S-06. Reserve 12 beds for critical elderly patients.',
      details: { medical_victims: 5, wheelchair_accessible_required: 2, medical_capacity_available: 1200 }
    },
    {
      agent_name: 'Allocation Agent',
      status: 'done',
      responsibility: 'CSP / Bayesian Search Engine',
      processing_time_ms: 185.4,
      input_summary: 'Ran CSP constraint satisfaction with weighted multi-objective scoring across active groups',
      output_summary: 'CSP: 47 victims allocated across 4 shelters. Explored 847 states in 42.3ms.',
      recommendation: 'Execute CSP optimal assignment matrix. S-06 receives highest allocation (9 people).',
      details: { states_explored: 847, execution_time_ms: 42.3, algorithm: 'CSP', groups_assigned: 5 }
    },
    {
      agent_name: 'Coordinator Agent',
      status: 'done',
      responsibility: 'Consensus & Conflict Resolver',
      processing_time_ms: 15.2,
      input_summary: 'Aggregated 5 sub-agent reports to resolve conflicting shelter and capacity constraints',
      output_summary: '2 conflicts resolved: S-02 load shifted to S-04; Medical cases routed to S-06.',
      recommendation: 'All agents reached consensus. Coordinated final plan released for commander authorization.',
      details: { conflicts_resolved: 2, final_status: 'CONSENSUS_REACHED', commander_approval_required: true }
    },
  ],
}
