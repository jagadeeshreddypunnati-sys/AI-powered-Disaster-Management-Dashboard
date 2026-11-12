import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 4000,
})

// Auto-attach token
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rescue_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Prevent breaking redirects on static deployments
api.interceptors.response.use(
  r => r,
  err => {
    // If backend 401 and we have no local demo session
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const isDemo = localStorage.getItem('rescue_demo_mode') === 'true'
      if (!isDemo) {
        localStorage.removeItem('rescue_token')
        localStorage.removeItem('rescue_user')
        window.location.href = `${basePath}/auth/login/`
      }
    }
    return Promise.reject(err)
  }
)
