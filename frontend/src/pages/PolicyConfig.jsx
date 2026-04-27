import { CheckCircle, Save, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../services/api'

const FIELDS = [
  { key: 'refund_window_days', label: 'Full Refund Window', unit: 'days', type: 'number', min: 1 },
  { key: 'partial_window_days', label: 'Partial Refund Window', unit: 'days', type: 'number', min: 1 },
  { key: 'partial_refund_percent', label: 'Partial Refund %', unit: '%', type: 'number', min: 0, max: 1, step: 0.05 },
  { key: 'sentiment_threshold', label: 'Sentiment Threshold', unit: 'score', type: 'number', min: 0, max: 1, step: 0.05 },
  { key: 'fraud_threshold', label: 'Fraud Threshold', unit: 'score', type: 'number', min: 0, max: 1, step: 0.05 },
]

export default function PolicyConfig() {
  const [policy, setPolicy] = useState(null)
  const [status, setStatus] = useState(null) // null | 'ok' | 'error'
  const [msg, setMsg] = useState('')

  useEffect(() => { api.getPolicy().then(setPolicy) }, [])

  const save = async () => {
    setStatus(null)
    try {
      const updated = await api.savePolicy(policy)
      setPolicy(updated)
      setStatus('ok')
      setMsg('Policy saved successfully.')
    } catch (err) {
      setStatus('error')
      setMsg(err.message)
    }
  }

  if (!policy) return null

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 animate-fade-in">
      <div className="mb-5 flex items-center gap-2">
        <Settings className="h-5 w-5 text-slate-500" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Policy Configuration</h1>
          <p className="text-xs text-slate-400">Adjust refund decision thresholds</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          {FIELDS.map(({ key, label, unit, ...props }) => (
            <div key={key}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">{label}</label>
                <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-mono text-slate-600">
                  {policy[key]} {unit}
                </span>
              </div>
              <input
                {...props}
                value={policy[key]}
                onChange={(e) => setPolicy({ ...policy, [key]: parseFloat(e.target.value) || e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={save}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Save className="h-4 w-4" /> Save Policy
          </button>
          {status && (
            <span className={`flex items-center gap-1.5 text-sm ${status === 'ok' ? 'text-emerald-600' : 'text-rose-600'}`}>
              <CheckCircle className="h-4 w-4" /> {msg}
            </span>
          )}
        </div>
      </div>
    </main>
  )
}
