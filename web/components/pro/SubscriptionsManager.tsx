'use client'
import { useState } from 'react'

type PackTier = 'STANDARD' | 'PREMIUM' | 'LEGENDARY'

type Subscription = {
  id: string
  pack_tier: PackTier
  quantity_per_cycle: number
  cycle_days: number
  next_delivery_at: string
  active: boolean
}

const TIER_COLORS: Record<PackTier, string> = {
  STANDARD:  'text-cyan-400 border-cyan-800/50 bg-cyan-950/30',
  PREMIUM:   'text-violet-400 border-violet-800/50 bg-violet-950/30',
  LEGENDARY: 'text-amber-400 border-amber-800/50 bg-amber-950/30',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-TT', {
    day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'America/Port_of_Spain',
  })
}

function NewSubscriptionForm({ onCreated }: { onCreated: (sub: Subscription) => void }) {
  const [tier, setTier]   = useState<PackTier>('STANDARD')
  const [qty, setQty]     = useState(1)
  const [days, setDays]   = useState(30)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res  = await fetch('/api/pro/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pack_tier: tier, quantity_per_cycle: qty, cycle_days: days }),
    })
    const json = await res.json()
    setSaving(false)
    if (!json.success) { setError(json.error ?? 'Failed to create'); return }
    onCreated(json.data)
  }

  const selectClass = 'px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm ' +
    'focus:outline-none focus:border-indigo-500'

  return (
    <form onSubmit={handleSubmit}
      className="rounded-xl border border-indigo-700/40 bg-indigo-950/20 p-4 flex flex-col gap-3">
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Pack tier</label>
          <select className={selectClass + ' w-full'} value={tier}
            onChange={e => setTier(e.target.value as PackTier)}>
            <option value="STANDARD">Standard</option>
            <option value="PREMIUM">Premium</option>
            <option value="LEGENDARY">Legendary</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Packs / cycle</label>
          <input type="number" min={1} max={10} className={selectClass + ' w-full'}
            value={qty} onChange={e => setQty(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Every (days)</label>
          <input type="number" min={7} max={90} className={selectClass + ' w-full'}
            value={days} onChange={e => setDays(Number(e.target.value))} />
        </div>
      </div>
      <button type="submit" disabled={saving}
        className="py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                   text-white text-sm font-semibold transition-colors">
        {saving ? 'Creating…' : 'Create subscription'}
      </button>
    </form>
  )
}

export function SubscriptionsManager({ initialSubs }: { initialSubs: Subscription[] }) {
  const [subs, setSubs]       = useState(initialSubs)
  const [creating, setCreating] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleToggle(id: string, active: boolean) {
    const res  = await fetch(`/api/pro/subscriptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    const json = await res.json()
    if (!json.success) { setError(json.error ?? 'Failed'); return }
    setSubs(s => s.map(sub => sub.id === id ? { ...sub, active } : sub))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this subscription?')) return
    const res  = await fetch(`/api/pro/subscriptions/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json.success) { setError(json.error ?? 'Failed'); return }
    setSubs(s => s.filter(sub => sub.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-red-400 text-sm bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {subs.length === 0 && !creating && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 py-12 text-center">
          <p className="text-gray-400 text-sm font-medium">No subscriptions yet</p>
          <p className="text-gray-600 text-xs mt-1">
            Set up auto-delivery and packs will be queued on each cycle.
          </p>
        </div>
      )}

      {subs.map(sub => (
        <div key={sub.id}
          className={`rounded-xl border bg-gray-900 p-4 ${sub.active ? 'border-gray-800' : 'border-gray-800/40 opacity-60'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${TIER_COLORS[sub.pack_tier]}`}>
                {sub.pack_tier}
              </span>
              <div>
                <p className="text-white text-sm font-medium">
                  {sub.quantity_per_cycle} pack{sub.quantity_per_cycle !== 1 ? 's' : ''} every {sub.cycle_days} days
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Next delivery: {formatDate(sub.next_delivery_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleToggle(sub.id, !sub.active)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  sub.active
                    ? 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                    : 'border-indigo-700/50 text-indigo-400 hover:border-indigo-500'
                }`}>
                {sub.active ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => handleDelete(sub.id)}
                className="text-xs px-2.5 py-1 rounded-lg border border-red-900/50 text-red-500
                           hover:border-red-700 hover:text-red-400 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {creating ? (
        <NewSubscriptionForm
          onCreated={sub => { setSubs(s => [sub, ...s]); setCreating(false) }}
        />
      ) : (
        <button onClick={() => setCreating(true)}
          className="w-full py-3 rounded-xl border border-dashed border-gray-700 text-gray-500
                     text-sm hover:border-gray-500 hover:text-gray-300 transition-colors">
          + New subscription
        </button>
      )}
    </div>
  )
}
