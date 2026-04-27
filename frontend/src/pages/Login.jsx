import { Lock, User, Zap } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Field({ label, icon: Icon, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
          {...props}
        />
      </div>
    </div>
  )
}

export default function Login({ onLogin, loading }) {
  const [form, setForm] = useState({ username: 'admin', password: 'admin' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await onLogin(form.username, form.password)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="flex min-h-[88vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Card */}
        <form
          onSubmit={submit}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60"
        >
          {/* Brand mark */}
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
              <Zap className="h-5 w-5 text-white" />
            </span>
            <h1 className="text-lg font-bold text-slate-900">Admin Login</h1>
            <p className="text-xs text-slate-500">Sign in to access the RefundAgent dashboard</p>
          </div>

          <div className="space-y-4">
            <Field
              label="Username"
              icon={User}
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="admin"
            />
            <Field
              label="Password"
              icon={Lock}
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />

            {error && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
