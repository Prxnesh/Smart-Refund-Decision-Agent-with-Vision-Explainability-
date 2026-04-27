import { Package, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import { api } from '../services/api'
import { CATEGORY_COLORS } from '../utils/constants'

function StockBadge({ stock }) {
  if (stock === 0) return <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">Out of stock</span>
  if (stock < 50) return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">{stock} left</span>
  return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">{stock}</span>
}

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Books', 'Beauty']

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    api.getInventory()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = category === 'All' || p.category === category
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
      return matchesCat && matchesSearch
    })
  }, [products, search, category])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 animate-fade-in">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-slate-500" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Product Inventory</h1>
            <p className="text-xs text-slate-400">{products.length} products · refund window per product</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 ${
              category === cat
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-16"><LoadingSpinner text="Loading inventory…" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">No products match your filters.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Return Window</th>
                <th className="px-5 py-3">Refundable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{p.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[p.category] || 'bg-slate-100 text-slate-600'}`}>
                      {p.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">${p.price.toFixed(2)}</td>
                  <td className="px-5 py-3.5"><StockBadge stock={p.stock} /></td>
                  <td className="px-5 py-3.5 text-slate-600">{p.return_window_days}d</td>
                  <td className="px-5 py-3.5">
                    {p.is_refundable ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}
