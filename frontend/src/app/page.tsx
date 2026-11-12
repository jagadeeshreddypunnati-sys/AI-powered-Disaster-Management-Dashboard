'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  useEffect(() => { router.replace('/auth/login') }, [router])
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-blue-200">Loading RESCUE AI...</p>
      </div>
    </div>
  )
}
