'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, Users, Building2, Brain, MessageSquareText,
  Network, BarChart3, FileBarChart, Settings, Shield, ChevronLeft,
  ChevronRight, Bell, LogOut, Menu, AlertTriangle, Wifi
} from 'lucide-react'
import { getUser, clearAuth, isAuthenticated } from '@/lib/auth'
import Link from 'next/link'
import FloatingChatButton from '@/components/chatbot/FloatingChatButton'

const NAV_ITEMS = [
  { href: '/dashboard',    icon: LayoutDashboard,      label: 'Overview',         badge: null },
  { href: '/map',          icon: Map,                  label: 'Disaster Map',     badge: null },
  { href: '/victims',      icon: Users,                label: 'Victim Registry',  badge: 'NEW' },
  { href: '/shelters',     icon: Building2,            label: 'Shelters',         badge: null },
  { href: '/allocation',   icon: Brain,                label: 'AI Allocation',    badge: 'AI' },
  { href: '/chatbot',      icon: MessageSquareText,    label: 'RescueBot AI',     badge: 'AI' },
  { href: '/agents',       icon: Network,              label: 'Multi-Agent',      badge: null },
  { href: '/comparison',   icon: BarChart3,            label: 'AI Comparison',    badge: null },
  { href: '/analytics',    icon: FileBarChart,         label: 'Analytics',        badge: null },
  { href: '/settings',     icon: Settings,             label: 'Admin Settings',   badge: null },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [alertCount] = useState(3)

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/auth/login'); return }
    setUser(getUser())
  }, [router])

  const handleLogout = () => {
    clearAuth()
    router.push('/auth/login')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-rescue-light-bg overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col bg-navy-900 shadow-sidebar overflow-hidden flex-shrink-0 z-30"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-navy-700">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-rescue-blue flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <span className="text-white font-bold text-lg leading-tight">RESCUE AI</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rescue-green animate-pulse" />
                  <span className="text-rescue-green text-xs font-medium">OPERATIONAL</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <div className={`
                  flex items-center gap-3 mx-2 mb-1 px-3 py-2.5 rounded-xl cursor-pointer transition-all group
                  ${active
                    ? 'bg-rescue-blue text-white shadow-md'
                    : 'text-navy-300 hover:bg-navy-700 hover:text-white'
                  }
                `}>
                  <Icon className={`flex-shrink-0 w-5 h-5 ${active ? 'text-white' : 'text-navy-400 group-hover:text-white'}`} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center justify-between flex-1 min-w-0"
                      >
                        <span className="text-sm font-medium truncate">{item.label}</span>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 ${
                            item.badge === 'AI' ? 'bg-purple-500/30 text-purple-300' : 'bg-rescue-green/30 text-rescue-green'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-rescue-blue rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-white" /> : <ChevronLeft className="w-3 h-3 text-white" />}
        </button>

        {/* User profile at bottom */}
        <div className="border-t border-navy-700 p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rescue-blue/30 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-300 text-sm font-semibold">
                {user?.full_name?.[0] || 'A'}
              </span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{user?.full_name || 'Admin'}</p>
                  <p className="text-navy-400 text-xs capitalize">{user?.role || 'admin'}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={handleLogout} className="text-navy-400 hover:text-white transition" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-rescue-border px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-navy-800 font-semibold text-sm">
              {NAV_ITEMS.find(n => isActive(n.href))?.label || 'Dashboard'}
            </h1>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              <span>Simulated Data</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-rescue-green">
              <Wifi className="w-3.5 h-3.5" />
              <span>Connected</span>
            </div>
            <div className="relative">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition relative">
                <Bell className="w-4 h-4 text-gray-600" />
                {alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rescue-red rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                    {alertCount}
                  </span>
                )}
              </button>
            </div>
            <div className="text-xs text-gray-500 font-mono hidden lg:block">
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Floating chat button */}
      <FloatingChatButton />
    </div>
  )
}
