import { Activity, Bot, CheckCircle, Database, RefreshCw, Server, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../services/api'

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Icon className="h-4 w-4 text-slate-400" />
        {label}
      </div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  )
}

function Badge({ ok, label }) {
  return ok ? (
    <span className="flex items-center gap-1 text-emerald-600">
      <CheckCircle className="h-4 w-4" /> {label || 'Online'}
    </span>
  ) : (
    <span className="flex items-center gap-1 text-rose-600">
      <XCircle className="h-4 w-4" /> {label || 'Offline'}
    </span>
  )
}

export default function AgentStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const s = await api.getStatus()
      setStatus(s)
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">Agent Status</h2>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Rows */}
      <div className="px-5">
        {status ? (
          <>
            <Row icon={Bot} label="Ollama AI Engine">
              <Badge ok={status.ollama.status === 'ok'} />
            </Row>
            <Row icon={Bot} label="Model">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                {status.ollama.model}
              </span>
            </Row>
            <Row icon={Server} label="API Server">
              <Badge ok={status.api.status === 'ok'} label={`v${status.api.version}`} />
            </Row>
            <Row icon={Database} label="Database (Supabase)">
              <Badge ok={status.db.status === 'ok'} />
            </Row>
            <Row icon={Database} label="Total Cases Processed">
              <span className="text-slate-800">{status.db.total_cases.toLocaleString()}</span>
            </Row>
            <Row icon={Database} label="Registered Users">
              <span className="text-slate-800">{status.db.total_users.toLocaleString()}</span>
            </Row>
            <Row icon={Database} label="Products in Inventory">
              <span className="text-slate-800">{status.db.total_products.toLocaleString()}</span>
            </Row>
          </>
        ) : (
          <div className="py-8 text-center text-sm text-slate-400">Loading status…</div>
        )}
      </div>

      {/* Decision mini-breakdown */}
      {status && (
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Decision Breakdown</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Approved', value: status.decisions.approved, color: 'text-emerald-700 bg-emerald-50' },
              { label: 'Rejected', value: status.decisions.rejected, color: 'text-rose-700 bg-rose-50' },
              { label: 'Partial', value: status.decisions.partial, color: 'text-amber-700 bg-amber-50' },
              { label: 'Fraud Flagged', value: status.decisions.fraud_detected, color: 'text-slate-700 bg-slate-100' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl p-3 ${color}`}>
                <p className="text-xs opacity-70">{label}</p>
                <p className="mt-0.5 text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
