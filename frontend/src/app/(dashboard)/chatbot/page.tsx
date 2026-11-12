'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Shield, Sparkles, Database, RefreshCw, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { v4 as uuid } from 'uuid'
import ReactMarkdown from 'react-markdown'

const SESSION_ID = typeof window !== 'undefined' ? (localStorage.getItem('chat_session') || (() => { const id = uuid(); localStorage.setItem('chat_session', id); return id; })()) : uuid()

type Message = { role: 'user' | 'assistant'; content: string; sources?: any[]; timestamp: Date }

const SUGGESTED = [
  'Find the safest available shelter',
  'Which shelters have medical facilities?',
  'Show me the highest-risk shelters',
  'What is the system overview?',
  'How does CSP allocation work?',
  'List all active disaster zones',
  'Which shelters are overcrowded?',
  'Compare CSP and Bayesian approaches',
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 Hello! I'm **RescueBot AI**, your RESCUE AI assistant.

I can help you with:
- 🏠 Finding and comparing shelters
- 📊 System statistics and overview  
- 🏥 Medical facility availability
- 🤖 AI algorithm explanations
- 🌪️ Disaster zone information
- ⚡ Allocation recommendations

*I use real application data to answer your questions. Try one of the suggested prompts below or ask anything about the system!*`,
      sources: [],
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (msg: string) => {
    if (!msg.trim() || loading) return
    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
      const r = await api.post('/api/chat/message', {
        message: msg,
        session_id: SESSION_ID,
        history,
      })
      const botMsg: Message = {
        role: 'assistant',
        content: r.data.reply,
        sources: r.data.sources || [],
        timestamp: new Date(),
      }
      setMessages(m => [...m, botMsg])
    } catch (e: any) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: '⚠️ Unable to connect to the RESCUE AI backend. Please ensure the server is running on port 8000.',
        sources: [],
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-rescue-blue" />
            RescueBot AI Assistant
          </h1>
          <p className="text-sm text-gray-500">RAG-powered chatbot with real application data · Gemini API integration</p>
        </div>
        <div className="flex gap-2">
          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <RefreshCw className="w-3.5 h-3.5" /> Clear Chat
          </button>
          <div className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            RescueBot Online
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-card border border-rescue-border overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'assistant' ? 'bg-rescue-blue' : 'bg-gray-700'
                }`}>
                  {msg.role === 'assistant'
                    ? <Shield className="w-4 h-4 text-white" />
                    : <span className="text-white text-xs font-bold">U</span>
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-gray-50 text-gray-800 border border-gray-100'
                      : 'bg-rescue-blue text-white'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-strong:text-gray-900">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                  
                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {msg.sources.map((s: any, si: number) => (
                        <span key={si} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
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
                <div className="w-8 h-8 rounded-full bg-rescue-blue flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts */}
          {messages.length <= 2 && (
            <div className="px-5 pb-3">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.slice(0, 4).map(p => (
                  <button key={p} onClick={() => send(p)}
                    className="text-xs bg-blue-50 text-rescue-blue border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100 transition flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask RescueBot anything about shelters, victims, or allocation..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rescue-blue focus:ring-1 focus:ring-rescue-blue transition"
              />
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                type="submit" disabled={loading || !input.trim()}
                className="w-10 h-10 bg-rescue-blue text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </form>
          </div>
        </div>

        {/* Sidebar: Suggested Prompts */}
        <div className="w-56 flex-shrink-0 space-y-3">
          <div className="bg-white rounded-xl p-4 shadow-card border border-rescue-border">
            <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Suggested
            </h3>
            <div className="space-y-1.5">
              {SUGGESTED.map(p => (
                <button key={p} onClick={() => send(p)}
                  className="w-full text-left text-xs text-gray-600 hover:text-rescue-blue hover:bg-blue-50 px-3 py-2 rounded-lg transition flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-card border border-rescue-border">
            <h3 className="font-semibold text-gray-800 text-sm mb-2">About RescueBot</h3>
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-rescue-blue" /> Uses real application data</li>
              <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-rescue-blue" /> RAG with Gemini API</li>
              <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-rescue-blue" /> Never invents shelter data</li>
              <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-rescue-blue" /> Requires admin approval for changes</li>
              <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-rescue-blue" /> Calls real allocation engine</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
