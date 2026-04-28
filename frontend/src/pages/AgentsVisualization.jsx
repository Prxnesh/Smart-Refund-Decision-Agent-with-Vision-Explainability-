import { useEffect, useState } from 'react'
import {
  Activity, AlertCircle, ArrowDown, Brain, ChevronRight,
  Database, MessageSquare, Server, Shield, Users, Zap,
} from 'lucide-react'
import { api } from '../services/api'

// ─── Agent definitions ────────────────────────────────────────────────────────

const PARALLEL_AGENTS = [
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    icon: Brain,
    bg: 'bg-blue-500',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/10 text-blue-400',
    role: 'Analyzes customer emotion, anger level, and complaint genuineness using the Ollama LLM.',
    outputs: ['sentiment_score (0–1)', 'anger_score (0–1)', 'genuineness_score (0–1)'],
    model: 'Ollama LLM (llama3.2)',
    file: 'ollama_service.py → analyze_sentiment()',
    statKey: 'avg_sentiment',
    statLabel: 'Avg Sentiment',
  },
  {
    id: 'fraud',
    name: 'Fraud Detection',
    icon: Shield,
    bg: 'bg-rose-500',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/10 text-rose-400',
    role: 'Scores fraud risk using refund ratio history, suspicious keyword matching, and recent complaint frequency.',
    outputs: ['fraud_score (0–1, capped at 1.0)'],
    model: 'Rule-based + DB history',
    file: 'fraud_service.py → detect_fraud()',
    statKey: 'fraud_detected',
    statLabel: 'Fraud Flagged',
  },
  {
    id: 'policy',
    name: 'Policy Evaluator',
    icon: AlertCircle,
    bg: 'bg-amber-500',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/10 text-amber-400',
    role: 'Checks if the order falls inside the configurable full or partial refund window, respecting per-product overrides.',
    outputs: ['eligibility: "full" | "partial" | "none"'],
    model: 'Configurable policy rules',
    file: 'policy_service.py → evaluate_policy_window()',
    statKey: 'approved',
    statLabel: 'Approved',
  },
  {
    id: 'memory',
    name: 'User Memory',
    icon: Users,
    bg: 'bg-purple-500',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/10 text-purple-400',
    role: 'Retrieves or creates user profile including total orders, past refunds, refund ratio, and last 5 complaint texts.',
    outputs: ['total_orders', 'total_refunds', 'refund_ratio (0–1)', 'past_complaints (last 5)'],
    model: 'Postgres / SQLAlchemy',
    file: 'user_memory_service.py → build_user_memory()',
    statKey: 'total_users',
    statLabel: 'Users Tracked',
  },
]

const DECISION_RULES = [
  { condition: 'Product marked non-refundable', outcome: 'REJECT', confidence: '0.98', color: 'text-rose-400' },
  { condition: 'fraud_score > 0.7', outcome: 'REJECT', confidence: '~0.1', color: 'text-rose-400' },
  { condition: 'Full window AND sentiment ≥ 0.6', outcome: 'APPROVE', confidence: '~1.0', color: 'text-emerald-400' },
  { condition: 'Partial window (31–60 days)', outcome: 'PARTIAL', confidence: '~0.7', color: 'text-amber-400' },
  { condition: 'Otherwise', outcome: 'REJECT', confidence: '~0.2', color: 'text-rose-400' },
]

const OUTPUT_AGENTS = [
  {
    id: 'explanation',
    name: 'Explanation Generator',
    icon: MessageSquare,
    bg: 'bg-emerald-500',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-400',
    role: 'Prompts the LLM to write an empathetic, policy-aware explanation for the decision. Falls back to templated strings when Ollama is unavailable.',
    outputs: ['explanation (natural language string)'],
    model: 'Ollama LLM (llama3.2)',
    file: 'ollama_service.py → generate_explanation()',
  },
  {
    id: 'chat',
    name: 'Chat Service',
    icon: MessageSquare,
    bg: 'bg-cyan-500',
    border: 'border-cyan-500/30',
    badge: 'bg-cyan-500/10 text-cyan-400',
    role: 'Streams token-by-token responses for real-time customer support via Server-Sent Events (SSE). Maintains full conversation context.',
    outputs: ['streaming text (SSE tokens)', 'case-aware context'],
    model: 'Ollama LLM (llama3.2)',
    file: 'ollama_service.py → stream_chat()',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgentsVisualization() {
  const [status, setStatus] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const s = await api.getStatus()
        setStatus(s)
      } catch (e) {
        console.error('Status fetch failed', e)
      }
      try {
        const a = await api.getAnalytics()
        setAnalytics(a)
      } catch (_) {
        // analytics requires auth — silently skip if unauthenticated
      }
      setLoading(false)
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const getAgentStat = (agent) => {
    switch (agent.statKey) {
      case 'avg_sentiment': return analytics ? analytics.avg_sentiment_score.toFixed(2) : null
      case 'fraud_detected': return status ? status.decisions.fraud_detected : null
      case 'approved': return status ? status.decisions.approved : null
      case 'total_users': return status ? status.db.total_users : null
      default: return null
    }
  }

  const ollamaOk = status?.ollama?.status === 'ok'
  const totalCases = status?.db?.total_cases ?? 0

  const toggleAgent = (agent) =>
    setSelectedAgent((prev) => (prev?.id === agent.id ? null : agent))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Agent Architecture</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Multi-agent pipeline powering intelligent refund decisions
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium">
            <span className={`h-2 w-2 rounded-full ${ollamaOk ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className="text-slate-300">
              {loading ? 'Connecting…' : ollamaOk ? 'All Systems Online' : 'LLM Offline — Fallback Mode'}
            </span>
          </div>
        </div>

        {/* ── Live stats row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Cases', value: totalCases, color: 'text-blue-400' },
            { label: 'Approved', value: status?.decisions?.approved ?? '—', color: 'text-emerald-400' },
            { label: 'Rejected', value: status?.decisions?.rejected ?? '—', color: 'text-rose-400' },
            { label: 'Fraud Flagged', value: status?.decisions?.fraud_detected ?? '—', color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-3"
            >
              <div className="text-xs text-slate-400 font-medium mb-1">{label}</div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* ── Pipeline diagram ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 md:p-8 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Execution Pipeline
          </h2>

          {/* Step 1 — Input */}
          <div className="flex justify-center">
            <div className="rounded-xl border border-slate-600 bg-slate-700/50 px-6 py-3 text-center min-w-[200px]">
              <div className="text-xs text-slate-400 mb-0.5">Entry Point</div>
              <div className="text-white font-semibold">Customer Complaint</div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">POST /submit-complaint</div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-5 h-5 text-slate-600" />
          </div>

          {/* Step 2 — Parallel agents */}
          <div className="relative rounded-xl border border-dashed border-slate-600/70 p-4">
            <div className="absolute -top-3 left-4 bg-slate-900 px-2 text-xs text-slate-400 font-medium">
              Parallel Analysis
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {PARALLEL_AGENTS.map((agent) => {
                const Icon = agent.icon
                const stat = getAgentStat(agent)
                const isSelected = selectedAgent?.id === agent.id
                return (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent)}
                    className={`rounded-lg border ${agent.border} ${
                      isSelected ? 'bg-slate-600/60 ring-1 ring-white/10' : 'bg-slate-800 hover:bg-slate-700/80'
                    } p-3 text-left transition`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-lg ${agent.bg} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white leading-tight">{agent.name}</span>
                    </div>
                    {stat !== null && (
                      <span className={`text-xs rounded-full px-2 py-0.5 font-mono inline-block ${agent.badge}`}>
                        {agent.statLabel}: {stat}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-5 h-5 text-slate-600" />
          </div>

          {/* Step 3 — Decision Engine */}
          <div className="rounded-xl border border-orange-500/40 bg-gradient-to-r from-orange-950/30 to-amber-950/20 p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-white font-bold">Decision Engine</div>
                <div className="text-xs text-slate-400">
                  Orchestrates all agents · Applies priority rules · Computes confidence score
                </div>
              </div>
              {totalCases > 0 && (
                <div className="ml-auto text-xs text-orange-400 font-semibold bg-orange-500/10 px-2.5 py-1 rounded-full">
                  {totalCases} decisions made
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {DECISION_RULES.map((rule, i) => (
                <div key={i} className="rounded-lg bg-slate-900/60 px-3 py-2 text-xs flex items-center gap-1 flex-wrap">
                  <span className="text-slate-400 font-mono">{rule.condition}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <span className={`font-bold ${rule.color}`}>{rule.outcome}</span>
                  <span className="text-slate-600">({rule.confidence})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-5 h-5 text-slate-600" />
          </div>

          {/* Step 4 — Output agents */}
          <div className="relative rounded-xl border border-dashed border-slate-600/70 p-4">
            <div className="absolute -top-3 left-4 bg-slate-900 px-2 text-xs text-slate-400 font-medium">
              Response Generation
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OUTPUT_AGENTS.map((agent) => {
                const Icon = agent.icon
                const isSelected = selectedAgent?.id === agent.id
                return (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent)}
                    className={`rounded-lg border ${agent.border} ${
                      isSelected ? 'bg-slate-600/60 ring-1 ring-white/10' : 'bg-slate-800 hover:bg-slate-700/80'
                    } p-3 text-left transition`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-7 h-7 rounded-lg ${agent.bg} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-white">{agent.name}</span>
                      <span className={`ml-auto text-xs rounded-full px-2 py-0.5 ${agent.badge}`}>
                        {ollamaOk ? 'Online' : 'Fallback mode'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 ml-9 leading-relaxed">{agent.role}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-5 h-5 text-slate-600" />
          </div>

          {/* Step 5 — Output */}
          <div className="flex justify-center">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-6 py-3 text-center min-w-[200px]">
              <div className="text-xs text-emerald-400 mb-0.5">Output</div>
              <div className="text-white font-semibold">Decision + Explanation</div>
              <div className="text-xs text-slate-500 mt-0.5">APPROVE · REJECT · PARTIAL</div>
            </div>
          </div>
        </div>

        {/* ── Agent detail panel (inline expand) ──────────────────────────── */}
        {selectedAgent && (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 animate-fade-in">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = selectedAgent.icon
                  return (
                    <div className={`w-10 h-10 rounded-xl ${selectedAgent.bg} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  )
                })()}
                <div>
                  <div className="text-white font-bold text-lg">{selectedAgent.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{selectedAgent.file}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-500 hover:text-slate-300 transition text-sm shrink-0"
              >
                Close ✕
              </button>
            </div>

            <p className="text-slate-300 text-sm mb-4 leading-relaxed">{selectedAgent.role}</p>

            {selectedAgent.outputs?.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Outputs</div>
                <div className="space-y-1.5">
                  {selectedAgent.outputs.map((o, i) => (
                    <div key={i} className="rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300 font-mono">
                      {o}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedAgent.model && (
              <div className="text-xs text-slate-500">
                Powered by:{' '}
                <span className="text-slate-300 font-medium">{selectedAgent.model}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Infrastructure summary ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Server,
              label: 'LLM Backend',
              value: status?.ollama?.model || 'llama3.2',
              sub: `Ollama · ${ollamaOk ? 'connected' : 'unavailable'}`,
              iconColor: ollamaOk ? 'text-emerald-400' : 'text-rose-400',
              dot: ollamaOk ? 'bg-emerald-400' : 'bg-rose-400',
            },
            {
              icon: Database,
              label: 'Database',
              value: `${status?.db?.total_cases ?? 0} cases`,
              sub: `${status?.db?.total_users ?? 0} users · ${status?.db?.total_products ?? 0} products`,
              iconColor: 'text-blue-400',
              dot: 'bg-blue-400',
            },
            {
              icon: Activity,
              label: 'API',
              value: `v${status?.api?.version || '1.0.0'}`,
              sub: 'FastAPI · status: ok',
              iconColor: 'text-purple-400',
              dot: 'bg-purple-400',
            },
          ].map(({ icon: Icon, label, value, sub, iconColor, dot }) => (
            <div
              key={label}
              className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-5 py-4 flex items-center gap-4"
            >
              <div className="rounded-xl bg-slate-700/60 p-2.5 shrink-0">
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400 font-medium">{label}</div>
                <div className="text-white font-bold truncate">{value}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
