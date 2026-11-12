'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquareText, X, Send, Shield, Sparkles, Database } from 'lucide-react'
import { api } from '@/lib/api'
import { v4 as uuid } from 'uuid'
import ReactMarkdown from 'react-markdown'
import IncidentMapCard from './IncidentMapCard'
import { queryRescueBot, IncidentLocation } from '@/lib/rescueBotEngine'

type Message = {
  role: 'user' | 'assistant'
  content: string
  sources?: any[]
  incidentMap?: IncidentLocation
  timestamp: Date
}

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm **RescueBot AI**.\n\nAsk me about live disaster incidents (e.g. *"Where is the flood?"*), shelter availability, medical clinics, or active hazard zones with interactive maps.`,
      sources: [{ id: 'SYS', name: 'Rescue AI' }],
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    let sid = localStorage.getItem('rescue_chat_session')
    if (!sid) {
      sid = uuid()
      localStorage.setItem('rescue_chat_session', sid)
    }
    setSessionId(sid)
  }, [])

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input
    if (!text.trim() || loading) return

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setInput('')
    setLoading(true)

    // Execute precision query engine
    const directAns = queryRescueBot(text)

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const res = await api.post('/api/chat/message', {
        message: text,
        session_id: sessionId || 'floating-session',
        history,
      })

      const botMsg: Message = {
        role: 'assistant',
        content: res.data.reply || directAns.text,
        sources: res.data.sources?.length ? res.data.sources : directAns.sources,
        incidentMap: directAns.incidentMap,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMsg])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: directAns.text,
          sources: directAns.sources,
          incidentMap: directAns.incidentMap,
          timestamp: new Date(),
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-rescue-blue text-white shadow-2xl flex items-center justify-center hover:bg-blue-700 transition z-50 border-2 border-white/20"
        title="Chat with RescueBot AI"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquareText className="w-6 h-6" />}
      </motion.button>

      {/* Pop-up Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[380px] sm:w-[440px] h-[570px] bg-white rounded-2xl shadow-2xl border border-rescue-border flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-navy-900 text-white px-4 py-3 flex items-center justify-between border-b border-navy-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rescue-blue flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">RescueBot AI</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-medium">TRAINED INCIDENT AGENT</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-navy-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Prompts Bar */}
            <div className="bg-slate-50 border-b border-slate-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
              <button
                onClick={() => handleSend('Where is the flood incident? Show map')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded-full hover:border-rescue-blue hover:text-rescue-blue transition text-slate-600"
              >
                Flood Map 🗺️
              </button>
              <button
                onClick={() => handleSend('What is the safest available shelter?')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded-full hover:border-rescue-blue hover:text-rescue-blue transition text-slate-600"
              >
                Safest shelter?
              </button>
              <button
                onClick={() => handleSend('Which shelters have medical facilities?')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded-full hover:border-rescue-blue hover:text-rescue-blue transition text-slate-600"
              >
                Medical shelters?
              </button>
              <button
                onClick={() => handleSend('Show map for the cyclone')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded-full hover:border-rescue-blue hover:text-rescue-blue transition text-slate-600"
              >
                Cyclone map 🌪️
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-rescue-blue text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-bl-xs'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <div className="prose prose-xs max-w-none text-slate-800">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}

                    {m.incidentMap && (
                      <IncidentMapCard incident={m.incidentMap} />
                    )}
                  </div>

                  {m.sources && m.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {m.sources.map((s, si) => (
                        <span
                          key={si}
                          className="inline-flex items-center gap-1 text-[9px] bg-blue-50 text-rescue-blue border border-blue-200 rounded-full px-2 py-0.2"
                        >
                          <Database className="w-2.5 h-2.5" /> {s.name || s.id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs pl-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rescue-blue animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-rescue-blue animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-rescue-blue animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] ml-1">Searching incident telemetry...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form
                onSubmit={e => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask RescueBot about an incident or shelter..."
                  className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rescue-blue transition"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="w-8 h-8 rounded-xl bg-rescue-blue text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
