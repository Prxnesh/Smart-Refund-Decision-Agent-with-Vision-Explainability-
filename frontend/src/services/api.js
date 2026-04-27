import { API_BASE_URL } from '../utils/constants'
import { clearToken, getToken } from './auth'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    if (res.status === 401) {
      clearToken()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?session=expired')
      }
    }
    throw new ApiError(error.detail || 'Request failed', res.status)
  }

  if (res.headers.get('content-type')?.includes('application/json')) return res.json()
  return res.blob()
}

export const api = {
  submitComplaint: (payload) => request('/submit-complaint', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/admin/login', { method: 'POST', body: JSON.stringify(payload) }),
  getCases: (query = '') => request(`/admin/cases${query}`),
  getCaseById: (id) => request(`/admin/case/${id}`),
  getAnalytics: () => request('/analytics'),
  getPolicy: () => request('/admin/policy'),
  savePolicy: (payload) => request('/admin/policy', { method: 'POST', body: JSON.stringify(payload) }),
  exportReport: () => request('/export-report'),
  getInventory: () => request('/inventory'),
  getProduct: (id) => request(`/inventory/${id}`),
  getStatus: () => request('/status'),
}
