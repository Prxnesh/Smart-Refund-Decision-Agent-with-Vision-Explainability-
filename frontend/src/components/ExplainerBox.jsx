import { Bot, CheckCircle, ShieldAlert, XCircle } from 'lucide-react'
import { DECISION_COLORS } from '../utils/constants'

const DECISION_ICON = {
  APPROVE: <CheckCircle className="h-5 w-5 text-emerald-600" />,
  REJECT: <XCircle className="h-5 w-5 text-rose-600" />,
  PARTIAL: <ShieldAlert className="h-5 w-5 text-amber-600" />,
}

export default function ExplainerBox({ decision, reason, confidence, scores }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Bot className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">AI Explainer</h3>
      </div>

      <div className="flex items-start gap-3">
        {DECISION_ICON[decision]}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${DECISION_COLORS[decision] || ''}`}>
              {decision}
            </span>
            <span className="text-xs text-slate-400">Confidence: {(Number(confidence || 0) * 100).toFixed(1)}%</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{reason}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
        {[
          { label: 'Sentiment', val: scores.sentiment_score },
          { label: 'Anger', val: scores.anger_score },
          { label: 'Fraud', val: scores.fraud_score },
          { label: 'Genuineness', val: scores.genuineness_score },
        ].map(({ label, val }) => (
          <div key={label} className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{(Number(val || 0) * 100).toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}
