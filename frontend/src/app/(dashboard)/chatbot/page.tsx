'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Shield, Sparkles, Database, RefreshCw, ChevronRight, MapPin, Copy, Check, PhoneCall } from 'lucide-react'
import { api } from '@/lib/api'
import { v4 as uuid } from 'uuid'
import ReactMarkdown from 'react-markdown'
import IncidentMapCard from '@/components/chatbot/IncidentMapCard'
import { queryRescueBot, IncidentLocation, EMERGENCY_CONTACTS } from '@/lib/rescueBotEngine'
import toast from 'react-hot-toast'

const SESSION_ID = typeof window !== 'undefined'
  ? (localStorage.getItem('chat_session') || (() => { const id = uuid(); localStorage.setItem('chat_session', id); return id; })())
  : uuid()

type Message = {
  role: 'user' | 'assistant'
  content: string
  sources?: any[]
  incidentMap?: IncidentLocation
  suggestedQuestions?: string[]
  timestamp: Date
}

const DEFAULT_SUGGESTED_PROMPTS = [
  'Show map for Chennai flood',
  'Which shelter is the safest?',
  'Where should I go to evacuate?',
  'List all medical shelters',
  'Show map for the cyclone',
  'Tell me about S-06 Army Center',
  'Which shelters are damaged?',
  'Show emergency hotlines & numbers',
  'Who is critical victim V-003?',
  'Explain the CSP allocation engine',
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 Hello! I am **RescueBot AI**, your trained Disaster Response & Shelter Allocation Assistant.

I am synchronized with **5 active disaster perimeters**, **10 regional shelter registries**, and **12 victim profiles**:
- 🗺️ **Active Hazards & Maps:** Ask *"Where is the flood?"* or *"Show map for cyclone"*
- 🛡️ **Safe Havens & Shelters:** Ask *"Which is the safest shelter?"* or *"Tell me about S-06"*
- 🚨 **Emergency Evacuation:** Ask *"Where should I go?"* or *"Which shelters are damaged?"*
- 🏥 **Medical Facilities:** Ask *"Shelters with medical care"* or *"Who is V-007?"*
- 📞 **Helplines:** Ask *"Emergency phone numbers"*

*I will reply directly with geospatial maps and actionable directives for immediate safety.*`,
      sources: [{ id: 'SYS', name: 'Rescue AI Telemetry' }],
      suggestedQuestions: [
        'Show map for Chennai flood',
        'Which shelter is the safest?',
        'Where should I go to evacuate?',
        'Show emergency hotlines & numbers'
      ],
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    toast.success('Response copied to clipboard')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const send = async (msg: string) => {
    if (!msg.trim() || loading) return
    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    // Execute precision knowledge engine first for instant, accurate answer
    const directAns = queryRescueBot(msg)

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
      const r = await api.post('/api/chat/message', {
        message: msg,
        session_id: SESSION_ID,
        history,
      })

      // Grounded reply from backend or trained telemetry engine
      const botMsg: Message = {
        role: 'assistant',
        content: r.data.reply || directAns.text,
        sources: r.data.sources?.length ? r.data.sources : directAns.sources,
        incidentMap: directAns.incidentMap,
        suggestedQuestions: directAns.suggestedQuestions,
        timestamp: new Date(),
      }
      setMessages(m => [...m, botMsg])
    } catch {
      // Offline fallback: precision engine delivers accurate, concise answer
      setMessages(m => [...m, {
        role: 'assistant',
        content: directAns.text,
        sources: directAns.sources,
        incidentMap: directAns.incidentMap,
        suggestedQuestions: directAns.suggestedQuestions,
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([messages[0]])
  }

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-rescue-blue" />
            RescueBot AI Emergency Assistant
          </h1>
          <p className="text-sm text-gray-500">
            Trained on real disaster telemetry, shelter capacities, and geospatial incident coordinates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Chat
          </button>
          <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Telemetry Ready · 100% Operational
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-card border border-rescue-border overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-xs ${
                  msg.role === 'assistant' ? 'bg-rescue-blue text-white' : 'bg-slate-700 text-white'
                }`}>
                  {msg.role === 'assistant'
                    ? <Shield className="w-4 h-4 text-white" />
                    : <span className="text-xs font-bold">U</span>
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                  <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xs group ${
                    msg.role === 'assistant'
                      ? 'bg-white text-slate-800 border border-slate-200'
                      : 'bg-rescue-blue text-white'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-strong:text-slate-900">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}

                    {/* Interactive Embedded Incident Map */}
                    {msg.incidentMap && (
                      <IncidentMapCard incident={msg.incidentMap} />
                    )}

                    {/* Copy Button */}
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyText(msg.content, i)}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700 rounded transition opacity-0 group-hover:opacity-100"
                        title="Copy answer"
                      >
                        {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Contextual Suggested Questions Chips */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedQuestions.map(q => (
                        <button
                          key={q}
                          onClick={() => send(q)}
                          className="px-2.5 py-1 bg-white border border-blue-200 hover:border-rescue-blue hover:bg-blue-50 text-rescue-blue rounded-full text-xs font-medium transition shadow-xs flex items-center gap-1"
                        >
                          <ChevronRight className="w-3 h-3 text-blue-400" />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-0.5">
                      {msg.sources.map((s: any, si: number) => (
                        <span key={si} className="text-[10px] bg-blue-50 text-rescue-blue px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                          <Database className="w-2.5 h-2.5" /> {s.name || s.id}
                        </span>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-gray-400">
                    {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-rescue-blue flex items-center justify-center text-white">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-xs">
                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-rescue-blue animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                    <span className="text-xs text-slate-500 ml-2">Consulting emergency database & incident coordinates...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
            {DEFAULT_SUGGESTED_PROMPTS.slice(0, 5).map(p => (
              <button
                key={p}
                onClick={() => send(p)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full hover:border-rescue-blue hover:text-rescue-blue transition text-slate-600 flex items-center gap-1 text-[11px]"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about a shelter, evacuation route, flood map, or victim..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rescue-blue focus:ring-1 focus:ring-rescue-blue transition text-slate-800 placeholder-slate-400"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-rescue-blue text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </form>
          </div>
        </div>

        {/* Sidebar: Suggested Prompts & Emergency Numbers */}
        <div className="w-72 flex-shrink-0 space-y-3 hidden lg:block">
          {/* Quick Queries */}
          <div className="bg-white rounded-xl p-4 shadow-card border border-rescue-border">
            <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Quick Emergency Prompts
            </h3>
            <div className="space-y-1.5">
              {DEFAULT_SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="w-full text-left text-xs text-gray-600 hover:text-rescue-blue hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 flex-shrink-0 text-slate-400" />
                  <span className="line-clamp-1">{p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Helpline Numbers */}
          <div className="bg-white rounded-xl p-4 shadow-card border border-rescue-border">
            <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5 text-red-600">
              <PhoneCall className="w-3.5 h-3.5" />
              24/7 Disaster Helplines
            </h3>
            <div className="space-y-1 text-xs">
              {EMERGENCY_CONTACTS.slice(0, 4).map(c => (
                <div key={c.number} className="flex items-center justify-between py-0.5 border-b border-slate-100 last:border-none">
                  <span className="text-[11px] text-slate-600">{c.name}</span>
                  <span className="font-mono font-bold text-rescue-blue bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">{c.number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
