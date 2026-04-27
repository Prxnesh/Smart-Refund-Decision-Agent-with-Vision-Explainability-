import { useEffect, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import LoadingSpinner from '../components/LoadingSpinner'
import { api } from '../services/api'

const PIE_COLORS = { APPROVE: '#10b981', REJECT: '#f43f5e', PARTIAL: '#f59e0b' }

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')

    api
      .getAnalytics()
      .then((value) => {
        if (alive) setData(value)
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Unable to load analytics.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <LoadingSpinner text="Loading analytics…" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          <p className="font-semibold">Analytics could not load.</p>
          <p className="mt-1">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Analytics Dashboard</h1>
        <p className="mt-0.5 text-xs text-slate-400">Live metrics from the refund database</p>
      </div>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Refunds" value={data.total_refunds} />
        <StatCard label="Refund Rate" value={`${(data.refund_rate * 100).toFixed(1)}%`} sub="of all complaints" />
        <StatCard label="Fraud Detected" value={data.fraud_cases_detected} sub="score > 0.7" />
        <StatCard label="Avg Sentiment" value={data.avg_sentiment_score.toFixed(3)} sub="0 = neutral, 1 = very negative" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {/* Refunds over time */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Refunds Over Time</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.refunds_over_time} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decision distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Decision Distribution</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.decision_distribution}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="70%"
                  innerRadius="40%"
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.decision_distribution.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Top products */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">Top Refunded Products</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.top_refunded_products} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="product" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  )
}
