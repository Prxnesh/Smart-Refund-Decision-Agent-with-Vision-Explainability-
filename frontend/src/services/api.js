import { API_BASE_URL } from '../utils/constants'
import { getToken } from './auth'

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
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
