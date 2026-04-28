export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const DECISION_COLORS = {
  APPROVE: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
  REJECT: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-100',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100',
}

export const NAV_LINKS = [
  { path: '/', label: 'Chat', icon: 'MessageSquare' },
  { path: '/admin', label: 'Cases', icon: 'FileText' },
  { path: '/admin/agents', label: 'Agents', icon: 'Zap' },
  { path: '/admin/inventory', label: 'Inventory', icon: 'Package' },
  { path: '/admin/analytics', label: 'Analytics', icon: 'BarChart2' },
  { path: '/admin/policy', label: 'Policy', icon: 'Settings' },
]

export const CATEGORY_COLORS = {
  Electronics: 'bg-blue-50 text-blue-700',
  Clothing: 'bg-violet-50 text-violet-700',
  'Home & Kitchen': 'bg-orange-50 text-orange-700',
  Sports: 'bg-green-50 text-green-700',
  Books: 'bg-yellow-50 text-yellow-700',
  Beauty: 'bg-pink-50 text-pink-700',
}
