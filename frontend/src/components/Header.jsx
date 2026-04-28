import { BarChart2, FileText, LogIn, LogOut, MessageSquare, Package, Settings, Zap } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

const ICON_MAP = { MessageSquare, FileText, Package, BarChart2, Settings, Zap }

const NAV_LINKS = [
  { path: '/', label: 'Chat', icon: 'MessageSquare' },
  { path: '/admin', label: 'Cases', icon: 'FileText', end: true },
  { path: '/admin/agents', label: 'Agents', icon: 'Zap' },
  { path: '/admin/inventory', label: 'Inventory', icon: 'Package' },
  { path: '/admin/analytics', label: 'Analytics', icon: 'BarChart2' },
  { path: '/admin/policy', label: 'Policy', icon: 'Settings' },
]

export default function Header({ authed, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 transition group-hover:bg-slate-700">
            <Zap className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900">RefundAgent</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ path, label, icon, end }) => {
            const Icon = ICON_MAP[icon]
            return (
              <NavLink
                key={path}
                to={path}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Auth */}
        {authed ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-rose-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <LogIn className="h-3.5 w-3.5" />
            Admin Login
          </Link>
        )}
      </div>
    </header>
  )
}
