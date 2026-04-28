import { useEffect, useState } from 'react'
import { ArrowRight, Zap, Brain, Shield, Users, MessageSquare, BarChart3, AlertCircle } from 'lucide-react'
import { api } from '../services/api'

const AGENTS = [
  {
    id: 'sentiment',
    name: 'Sentiment Analysis Agent',
    icon: Brain,
    color: 'from-blue-500 to-blue-600',
    description: 'Analyzes customer emotion, anger, and complaint genuineness',
    outputs: [
      { label: 'Sentiment Score', range: '0-1' },
      { label: 'Anger Score', range: '0-1' },
      { label: 'Genuineness Score', range: '0-1' }
    ],
    file: 'ollama_service.py'
  },
  {
    id: 'fraud',
    name: 'Fraud Detection Agent',
    icon: Shield,
    color: 'from-red-500 to-red-600',
    description: 'Identifies fraudulent refund requests and suspicious patterns',
    outputs: [
      { label: 'Fraud Score', range: '0-1' },
      { label: 'Detection Method', range: 'History/Terms/Pattern' }
    ],
    file: 'fraud_service.py'
  },
  {
    id: 'policy',
    name: 'Policy Evaluation Agent',
    icon: AlertCircle,
    color: 'from-amber-500 to-amber-600',
    description: 'Evaluates refund eligibility against configurable policy windows',
    outputs: [
      { label: 'Refund Window', range: '0-30 days' },
      { label: 'Partial Window', range: '0-60 days' },
      { label: 'Eligibility', range: 'Full/Partial/None' }
    ],
    file: 'policy_service.py'
  },
  {
    id: 'memory',
    name: 'User Memory Agent',
    icon: Users,
    color: 'from-purple-500 to-purple-600',
    description: 'Maintains user history, refund ratio, and past complaints',
    outputs: [
      { label: 'Total Orders', range: 'Count' },
      { label: 'Refund Ratio', range: '0-100%' },
      { label: 'History Context', range: 'Last 5 complaints' }
    ],
    file: 'user_memory_service.py'
  },
  {
    id: 'explanation',
    name: 'Explanation Generator',
    icon: MessageSquare,
    color: 'from-green-500 to-green-600',
    description: 'Creates empathetic, customer-facing explanations for decisions',
    outputs: [
      { label: 'Explanation', range: 'Natural language' },
      { label: 'Tone', range: 'Empathetic/Professional' }
    ],
    file: 'ollama_service.py'
  },
  {
    id: 'chat',
    name: 'Chat Service Agent',
    icon: MessageSquare,
    color: 'from-cyan-500 to-cyan-600',
    description: 'Provides real-time customer service chatbot support',
    outputs: [
      { label: 'Response', range: 'Streaming text' },
      { label: 'Context', range: 'Case-aware' }
    ],
    file: 'ollama_service.py'
  }
]

const DECISION_ENGINE = {
  name: 'Decision Engine',
  icon: Zap,
  color: 'from-orange-500 to-orange-600',
  description: 'Orchestrates all agents and applies decision rules',
  rules: [
    'If fraud_score > 0.7 → REJECT',
    'If in full window + sentiment ≥ threshold → APPROVE',
    'If in partial window → PARTIAL',
    'Else → REJECT'
  ]
}

export default function AgentsVisualization() {
  const [systemStatus, setSystemStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get('/status')
        setSystemStatus(response)
      } catch (error) {
        console.error('Failed to fetch status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Agent Architecture</h1>
          <p className="text-slate-400 text-lg">
            Distributed multi-agent system for intelligent refund decisions
          </p>
        </div>

        {/* System Health */}
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-lg p-4 border border-emerald-700">
              <div className="text-emerald-400 text-sm font-semibold mb-1">System Status</div>
              <div className="text-white text-2xl font-bold">
                {systemStatus.ollama_running ? '✓ Online' : '✗ Offline'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-lg p-4 border border-blue-700">
              <div className="text-blue-400 text-sm font-semibold mb-1">Total Cases</div>
              <div className="text-white text-2xl font-bold">{systemStatus.total_cases || 0}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-lg p-4 border border-purple-700">
              <div className="text-purple-400 text-sm font-semibold mb-1">Model</div>
              <div className="text-white text-lg font-bold">{systemStatus.ollama_model || 'llama3.2'}</div>
            </div>
          </div>
        )}

        {/* Decision Engine */}
        <div className="mb-16">
          <div className={`bg-gradient-to-r ${DECISION_ENGINE.color} rounded-lg p-1 mb-6`}>
            <div className="bg-slate-800 rounded p-6">
              <div className="flex items-center gap-3 mb-4">
                <DECISION_ENGINE.icon className="w-8 h-8 text-orange-400" />
                <h2 className="text-2xl font-bold text-white">{DECISION_ENGINE.name}</h2>
              </div>
              <p className="text-slate-300 mb-6">{DECISION_ENGINE.description}</p>
              <div className="bg-slate-900 rounded p-4">
                <div className="text-slate-400 text-sm font-semibold mb-3">Decision Logic</div>
                <div className="space-y-2">
                  {DECISION_ENGINE.rules.map((rule, i) => (
                    <div key={i} className="text-slate-200 text-sm font-mono">
                      {rule}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center mb-6">
            <ArrowRight className="w-8 h-8 text-slate-600 rotate-90" />
          </div>
        </div>

        {/* Agents Grid */}
        <div>
          <h3 className="text-xl font-bold text-white mb-6">Specialized Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENTS.map((agent) => {
              const IconComponent = agent.icon
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                  className={`bg-gradient-to-r ${agent.color} rounded-lg p-1 transition-all hover:shadow-lg hover:shadow-current cursor-pointer text-left group`}
                >
                  <div className="bg-slate-800 rounded p-6 h-full">
                    <div className="flex items-start gap-3 mb-3">
                      <IconComponent className={`w-6 h-6 ${agent.color.split(' ')[1]}`} />
                      <h3 className="text-lg font-bold text-white group-hover:text-slate-200">
                        {agent.name}
                      </h3>
                    </div>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                      {agent.description}
                    </p>
                    <div className="text-slate-500 text-xs font-mono">
                      {agent.file}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Agent Details Modal */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg max-w-2xl w-full border border-slate-700 shadow-2xl">
              <div className={`bg-gradient-to-r ${selectedAgent.color} rounded-t p-1`}>
                <div className="bg-slate-800 rounded-t px-6 py-4 flex items-center gap-3">
                  <selectedAgent.icon className="w-6 h-6" />
                  <h2 className="text-2xl font-bold text-white">{selectedAgent.name}</h2>
                </div>
              </div>

              <div className="p-6">
                <p className="text-slate-300 mb-6">{selectedAgent.description}</p>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Output Metrics</h3>
                  <div className="space-y-2">
                    {selectedAgent.outputs.map((output, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900 p-3 rounded">
                        <span className="text-slate-300">{output.label}</span>
                        <span className="text-slate-500 text-sm font-mono">{output.range}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 rounded p-3">
                  <div className="text-slate-400 text-xs font-mono">
                    Location: /backend/app/services/{selectedAgent.file}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAgent(null)}
                  className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agent Flow Diagram */}
        <div className="mt-16 bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-8">Decision Flow</h3>
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <div className="text-white font-semibold">Customer Complaint</div>
                <div className="text-slate-400 text-sm">Submit complaint with complaint text</div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-2">
              <ArrowRight className="w-6 h-6 text-slate-600 rotate-90" />
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <div className="text-white font-semibold">Parallel Analysis</div>
                <div className="text-slate-400 text-sm">
                  Sentiment Analysis, Fraud Detection, Policy Check, User Memory all run in parallel
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-2">
              <ArrowRight className="w-6 h-6 text-slate-600 rotate-90" />
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                3
              </div>
              <div>
                <div className="text-white font-semibold">Decision Engine</div>
                <div className="text-slate-400 text-sm">
                  Apply rules: fraud check → policy eligibility → sentiment threshold
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-2">
              <ArrowRight className="w-6 h-6 text-slate-600 rotate-90" />
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                4
              </div>
              <div>
                <div className="text-white font-semibold">Generate Decision</div>
                <div className="text-slate-400 text-sm">
                  APPROVE / REJECT / PARTIAL + confidence score + explanation
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-2">
              <ArrowRight className="w-6 h-6 text-slate-600 rotate-90" />
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-emerald-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                5
              </div>
              <div>
                <div className="text-white font-semibold">Customer Response</div>
                <div className="text-slate-400 text-sm">
                  Return decision with empathetic explanation via chat agent
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
