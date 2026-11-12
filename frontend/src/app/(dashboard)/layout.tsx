'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, Users, Building2, Brain, MessageSquareText,
  Network, BarChart3, FileBarChart, Settings, Shield, ChevronLeft,
  ChevronRight, Bell, LogOut, AlertTriangle, Wifi, X, CheckCircle2
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

const LIVE_ALERTS = [
  { id: 1, type: 'critical', title: 'Shelter S-08 DAMAGED', body: 'Chennai Coastal — bypass immediately. Reroute to S-06 or S-09.', time: '2 min ago', read: false },
  { id: 2, type: 'warning',  title: 'Cyclone Category 4 approaching', body: 'Bay of Bengal corridor. 25,000 residents at risk. Evacuation in progress.', time: '11 min ago', read: false },
  { id: 3, type: 'info',     title: 'S-01 Gandhi Center: 92% capacity', body: 'Allocate remaining victims to S-04 DRDA or S-07 Tambaram.', time: '34 min ago', read: false },
  { id: 4, type: 'success',  title: 'CSP allocation completed', body: '47 victims assigned across 4 shelters. 8 require manual review.', time: '1 hr ago', read: true },
  { id: 5, type: 'warning',  title: 'Coimbatore seismic aftershock', body: 'Magnitude 4.1 aftershock recorded. Structural re-assessment underway.', time: '2 hr ago', read: true },
]

const ALERT_STYLES: Record<string, { border: string; icon: string; iconColor: string }> = {
  critical: { border: 'border-l-rescue-red',   icon: '🔴', iconColor: 'text-red-600' },
  warning:  { border: 'border-l-orange-400',   icon: '🟠', iconColor: 'text-orange-500' },
  info:     { border: 'border-l-rescue-blue',  icon: '🔵', iconColor: 'text-blue-500' },
  success:  { border: 'border-l-rescue-green', icon: '✅', iconColor: 'text-green-600' },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [alerts, setAlerts] = useState(LIVE_ALERTS)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const unreadCount = alerts.filter(a => !a.read).length

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/auth/login'); return }
    setUser(getUser())
  }, [router])

  // Close notification panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { clearAuth(); router.push('/auth/login') }

  const markAllRead = () => setAlerts(a => a.map(x => ({ ...x, read: true })))
  const dismissAlert = (id: number) => setAlerts(a => a.filter(x => x.id !== id))

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

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-100 transition relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-gray-600" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rescue-red rounded-full text-white text-[9px] flex items-center justify-center font-bold"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-800 text-sm">Live Alerts</span>
                        {unreadCount > 0 && (
                          <span className="bg-rescue-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <button
                        onClick={markAllRead}
                        className="text-xs text-rescue-blue hover:text-blue-700 font-medium transition"
                      >
                        Mark all read
                      </button>
                    </div>

                    {/* Alerts list */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {alerts.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-gray-400">
                          <CheckCircle2 className="w-8 h-8 mb-2" />
                          <p className="text-sm">All caught up!</p>
                        </div>
                      ) : (
                        alerts.map(alert => {
                          const style = ALERT_STYLES[alert.type]
                          return (
                            <div
                              key={alert.id}
                              className={`flex gap-3 px-4 py-3 border-l-4 ${style.border} ${alert.read ? 'bg-white' : 'bg-blue-50/40'} hover:bg-gray-50 transition group`}
                            >
                              <span className="text-base flex-shrink-0 mt-0.5">{style.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold ${alert.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                  {alert.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{alert.body}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{alert.time}</p>
                              </div>
                              <button
                                onClick={() => dismissAlert(alert.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition flex-shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-center">
                      <Link href="/analytics" onClick={() => setShowNotifications(false)}>
                        <span className="text-xs text-rescue-blue hover:text-blue-700 font-medium transition">
                          View all in Analytics →
                        </span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
