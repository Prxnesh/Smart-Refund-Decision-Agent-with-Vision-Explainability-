import { Bot, CheckCircle, Database, Package, Users, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../services/api'

function Dot({ ok }) {
  return (
    <span className={`inline-block h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <span className="font-medium text-slate-700">{value}</span>
      <span>{label}</span>
    </div>
  )
}

export default function StatusBar() {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    const load = () => api.getStatus().then(setStatus).catch(() => {})
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  if (!status) return null

  const ollamaOk = status.ollama.status === 'ok'

  return (
    <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-1.5 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-1">
        {/* Agent health */}
        <div className="flex items-center gap-1.5 text-xs">
          <Dot ok={ollamaOk} />
          <Bot className="h-3.5 w-3.5 text-slate-400" />
          <span className={`font-semibold ${ollamaOk ? 'text-emerald-700' : 'text-rose-600'}`}>
            Ollama {ollamaOk ? 'online' : 'offline'}
          </span>
          <span className="text-slate-400">· {status.ollama.model}</span>
        </div>

        <div className="h-3 w-px bg-slate-200" />

        {/* DB stats */}
        <Stat icon={Database} label="cases" value={status.db.total_cases} />
        <Stat icon={Users} label="users" value={status.db.total_users} />
        <Stat icon={Package} label="products" value={status.db.total_products} />

        <div className="h-3 w-px bg-slate-200" />

        {/* Decision breakdown */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-semibold text-emerald-700">{status.decisions.approved}</span> approved
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 text-rose-500" />
            <span className="font-semibold text-rose-700">{status.decisions.rejected}</span> rejected
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <span className="font-semibold">{status.decisions.partial}</span> partial
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="font-semibold text-slate-700">{status.decisions.fraud_detected}</span> fraud flagged
          </span>
        </div>
      </div>
    </div>
  )
}
