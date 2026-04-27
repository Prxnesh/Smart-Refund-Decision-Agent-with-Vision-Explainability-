import { ArrowLeft, Bot, IndianRupee, Package, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ExplainerBox from '../components/ExplainerBox'
import LoadingSpinner from '../components/LoadingSpinner'
import ScoreCard from '../components/ScoreCard'
import { api } from '../services/api'
import { DECISION_COLORS } from '../utils/constants'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm text-slate-800">{value}</p>
      </div>
    </div>
  )
}

export default function CaseViewer() {
  const { id } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => { api.getCaseById(id).then(setData) }, [id])

  if (!data) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <LoadingSpinner text="Loading case…" />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Case #{data.id}</h1>
          <p className="mt-0.5 text-xs text-slate-400">{new Date(data.timestamp).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${DECISION_COLORS[data.decision] || ''}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {data.decision}
          </span>
          <Link to="/admin" className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>
      </div>

      {/* Meta + complaint */}
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <InfoRow icon={User} label="User ID" value={data.user_id} />
          <InfoRow icon={Package} label="Product" value={data.product} />
          <InfoRow icon={IndianRupee} label="Price" value={`₹${data.price.toFixed(2)}`} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Bot className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Complaint Text</p>
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{data.text}</p>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ScoreCard title="Sentiment Score" value={data.sentiment_score} color="rose" />
        <ScoreCard title="Anger Score" value={data.anger_score} color="orange" />
        <ScoreCard title="Fraud Score" value={data.fraud_score} color="red" />
        <ScoreCard title="Genuineness" value={data.genuineness_score} color="teal" />
      </div>

      <ExplainerBox decision={data.decision} reason={data.reason} confidence={data.confidence} scores={data} />
    </main>
  )
}
