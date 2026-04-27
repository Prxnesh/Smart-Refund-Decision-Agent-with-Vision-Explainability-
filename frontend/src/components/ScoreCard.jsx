const GRADIENTS = {
  teal: 'from-teal-500 to-emerald-500',
  rose: 'from-rose-500 to-pink-500',
  orange: 'from-orange-500 to-amber-500',
  red: 'from-red-500 to-rose-600',
  blue: 'from-blue-500 to-indigo-500',
}

export default function ScoreCard({ title, value, color = 'teal' }) {
  const score = Number(value || 0)
  const pct = Math.min(score * 100, 100)
  const gradient = GRADIENTS[color] || GRADIENTS.teal

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{pct.toFixed(1)}<span className="text-base font-medium text-slate-400">%</span></p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
