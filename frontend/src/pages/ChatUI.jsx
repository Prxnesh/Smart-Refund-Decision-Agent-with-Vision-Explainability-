import { Calendar, IndianRupee, Package, Send, ShoppingCart, Square, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ChatMessage from '../components/ChatMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import { api } from '../services/api'
import { API_BASE_URL } from '../utils/constants'

const INITIAL_MESSAGES = [
  {
    role: 'bot',
    content:
      "Hi! I'm your AI refund assistant. Describe your issue and I'll guide you through the process. When ready, fill in the form to get an official decision.",
  },
]

function Field({ label, icon: Icon, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        {children}
      </div>
    </div>
  )
}

const inputCls = (hasIcon = true) =>
  `w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 ${hasIcon ? 'pl-9 pr-3' : 'px-3'}`

export default function ChatUI() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [chatInput, setChatInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({
    user_id: '',
    product_id: '',
    product: '',
    price: '',
    days_since_order: 10,
    total_orders: 1,
    text: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const chatEndRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    api.getInventory().then(setProducts).catch(() => {})
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleProductSelect = (e) => {
    const id = Number(e.target.value)
    if (!id) {
      setForm((f) => ({ ...f, product_id: '', product: '', price: '' }))
      return
    }
    const p = products.find((x) => x.id === id)
    if (p) setForm((f) => ({ ...f, product_id: id, product: p.name, price: p.price }))
  }

  const buildHistory = (msgs) =>
    msgs
      .slice(1)
      .map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }))
      .filter((m) => m.content)

  const sendChatMessage = async (e) => {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text || streaming) return

    const userMsg = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setChatInput('')
    setForm((f) => ({ ...f, text }))
    setStreaming(true)
    setMessages((prev) => [...prev, { role: 'bot', content: '' }])

    try {
      abortRef.current = new AbortController()
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: buildHistory(next) }),
        signal: abortRef.current.signal,
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let botContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break
          try {
            const data = JSON.parse(payload)
            botContent += data.content || data.error || ''
            setMessages((prev) => [...prev.slice(0, -1), { role: 'bot', content: botContent }])
          } catch { /* ignore malformed chunk */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'bot', content: 'Sorry, I could not connect to the AI assistant right now.' },
        ])
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  const submitComplaint = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const result = await api.submitComplaint({
        ...form,
        product_id: form.product_id || null,
        price: Number(form.price),
        total_orders: Number(form.total_orders),
        days_since_order: Number(form.days_since_order),
      })
      const label = result.decision === 'APPROVE' ? '✅ Approved' : result.decision === 'PARTIAL' ? '⚠️ Partial refund' : '❌ Rejected'
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: `**Formal decision — ${label}**\n\n${result.explanation}\n\n_Case #${result.complaint_id}_` },
      ])
      setForm((f) => ({ ...f, text: '' }))
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', content: `Could not process request: ${err.message}` }])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[1.15fr_0.85fr] sm:px-6">

      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-100 animate-fade-in">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900">
            <Package className="h-4 w-4 text-white" />
          </span>
          <div>
            <h1 className="text-sm font-semibold text-slate-900">AI Refund Assistant</h1>
            <p className="text-xs text-slate-400">Powered by Ollama · streaming</p>
          </div>
          <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-100" />
        </div>

        <div
          className="flex-1 overflow-y-auto p-5 space-y-1"
          style={{ minHeight: 420, maxHeight: 520 }}
        >
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} role={msg.role} content={msg.content} />
          ))}
          {streaming && messages.at(-1)?.content === '' && <LoadingSpinner text="Thinking…" />}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendChatMessage} className="flex gap-2 border-t border-slate-100 p-4">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Describe your issue…"
            disabled={streaming}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          {streaming ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700">
              <Square className="h-3.5 w-3.5" /> Stop
            </button>
          ) : (
            <button type="submit" disabled={!chatInput.trim()} className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-40">
              <Send className="h-3.5 w-3.5" /> Send
            </button>
          )}
        </form>
      </div>

      {/* ── Formal complaint form ───────────────────────────────────────── */}
      <form
        onSubmit={submitComplaint}
        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100 animate-fade-in"
      >
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-sm font-semibold text-slate-900">Formal Complaint Submission</h2>
          <p className="mt-0.5 text-xs text-slate-400">Get an official AI-powered refund decision.</p>
        </div>

        {/* Product from inventory */}
        <Field label="Select Product from Inventory" icon={Package}>
          <select
            value={form.product_id}
            onChange={handleProductSelect}
            className={inputCls(true)}
          >
            <option value="">— Choose a product (optional) —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · ₹{p.price} · {p.return_window_days}d window
              </option>
            ))}
          </select>
        </Field>

        {/* Manual product name (editable even after select) */}
        <Field label="Product Name" icon={ShoppingCart}>
          <input
            value={form.product}
            onChange={(e) => setForm({ ...form, product: e.target.value })}
            placeholder="e.g. Wireless Earbuds"
            required
            className={inputCls(true)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price Paid (₹)" icon={IndianRupee}>
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0.00"
              required
              className={inputCls(true)}
            />
          </Field>
          <Field label="User ID" icon={User}>
            <input
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              placeholder="e.g. U1001"
              required
              className={inputCls(true)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Days Since Order" icon={Calendar}>
            <input
              type="number"
              min="0"
              value={form.days_since_order}
              onChange={(e) => setForm({ ...form, days_since_order: e.target.value })}
              className={inputCls(true)}
            />
          </Field>
          <Field label="Lifetime Orders">
            <input
              type="number"
              min="1"
              value={form.total_orders}
              onChange={(e) => setForm({ ...form, total_orders: e.target.value })}
              className={inputCls(false)}
            />
          </Field>
        </div>

        <Field label="Complaint Details">
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            required
            minLength={10}
            rows={5}
            placeholder="Describe your issue in detail (auto-filled from chat)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? 'Processing…' : 'Submit for Decision'}
        </button>
      </form>
    </section>
  )
}
