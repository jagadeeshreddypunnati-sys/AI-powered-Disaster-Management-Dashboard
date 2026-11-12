export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') localStorage.setItem('rescue_token', token)
}
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('rescue_token')
}
export function setUser(user: any) {
  if (typeof window !== 'undefined') localStorage.setItem('rescue_user', JSON.stringify(user))
}
export function getUser(): any | null {
  if (typeof window === 'undefined') return null
  const u = localStorage.getItem('rescue_user')
  return u ? JSON.parse(u) : null
}
export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('rescue_token')
    localStorage.removeItem('rescue_user')
  }
}
export function isAuthenticated(): boolean {
  return !!getAuthToken()
}
