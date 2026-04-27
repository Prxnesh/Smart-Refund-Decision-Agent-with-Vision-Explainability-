import { Download, Eye, Filter } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AgentStatus from '../components/AgentStatus'
import LoadingSpinner from '../components/LoadingSpinner'
import { api } from '../services/api'
import { DECISION_COLORS } from '../utils/constants'

const FILTERS = ['', 'APPROVE', 'REJECT', 'PARTIAL']
const FILTER_LABELS = { '': 'All', APPROVE: 'Approved', REJECT: 'Rejected', PARTIAL: 'Partial' }

export default function AdminDashboard() {
  const [cases, setCases] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const loadCases = async () => {
    setLoading(true)
    try {
      const q = filter ? `?filter_decision=${filter}` : ''
      const data = await api.getCases(q)
      setCases(data.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCases() }, [filter])

  const exportReport = async () => {
    const blob = await api.exportReport()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'refund_report.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 animate-fade-in">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">

        {/* ── Left: Cases table ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Refund Cases</h1>
              <p className="mt-0.5 text-xs text-slate-400">Review and manage all incoming complaints</p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f || 'ALL'}
                    onClick={() => setFilter(f)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                      filter === f ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    {FILTER_LABELS[f]}
                  </button>
                ))}
              </div>
              <button
                onClick={exportReport}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="py-16"><LoadingSpinner text="Loading cases…" /></div>
            ) : cases.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">No cases found.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Decision</th>
                    <th className="px-5 py-3">Confidence</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cases.map((row) => (
                    <tr key={row.id} className="group transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{row.user_id}</td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[140px] truncate">{row.product}</td>
                      <td className="px-5 py-3.5 text-slate-700">₹{row.price.toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${DECISION_COLORS[row.decision] || ''}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          {row.decision}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-500"
                              style={{ width: `${Math.round(row.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{Math.round(row.confidence * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(row.timestamp).toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/admin/case/${row.id}`}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 opacity-0 transition group-hover:opacity-100 hover:bg-slate-50"
                        >
                          <Eye className="h-3 w-3" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Right: Agent status panel ─────────────────────────────────── */}
        <div className="w-full xl:w-80 shrink-0">
          <AgentStatus />
        </div>

      </div>
    </main>
  )
}
