'use client'
import { useEffect, useRef, useState } from 'react'
import type { PipelineLead, LeadNote } from '@/lib/db/pipeline'

interface Props {
  lead: PipelineLead
  onClose: () => void
}

function formatDate(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-TT', {
    timeZone: 'America/Port_of_Spain',
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function LeadSidePanel({ lead, onClose }: Props) {
  const [notes, setNotes]     = useState<LeadNote[]>([])
  const [body, setBody]       = useState('')
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/pro/leads/${lead.id}/notes`)
      .then(r => r.json())
      .then(j => { if (j.success) setNotes(j.data) })
      .finally(() => setLoading(false))
  }, [lead.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes])

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || saving) return
    setSaving(true)
    const res  = await fetch(`/api/pro/leads/${lead.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim() }),
    })
    const json = await res.json()
    if (json.success) { setNotes(n => [...n, json.data]); setBody('') }
    setSaving(false)
  }

  const ovrColor =
    lead.calculated_ovr >= 90 ? 'text-amber-400' :
    lead.calculated_ovr >= 80 ? 'text-yellow-500' :
    lead.calculated_ovr >= 70 ? 'text-slate-300'  : 'text-orange-400'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-800 z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black ${ovrColor}`}>{lead.calculated_ovr}</span>
              <h2 className="text-white font-bold">{lead.full_name}</h2>
            </div>
            <p className="text-gray-500 text-xs mt-1">{lead.pack_name} · {lead.parish ?? 'T&T'}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="px-5 py-4 border-b border-gray-800 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Phone</p>
            <p className="text-white">{lead.phone || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Status</p>
            <p className="text-white">{lead.pipeline_status}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Last note</p>
            <p className="text-white">{formatDate(lead.last_note_at)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Notes</p>
            <p className="text-white">{lead.note_count}</p>
          </div>
        </div>

        {/* Notes thread */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading && <p className="text-gray-500 text-sm">Loading notes…</p>}
          {!loading && notes.length === 0 && (
            <p className="text-gray-600 text-sm">No notes yet. Add the first one below.</p>
          )}
          {notes.map(note => (
            <div key={note.id} className="rounded-lg bg-gray-800/60 border border-gray-700/50 px-3 py-2.5">
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{note.body}</p>
              <p className="text-gray-600 text-xs mt-1.5">{formatDate(note.created_at)}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Add note */}
        <form onSubmit={handleAddNote} className="p-4 border-t border-gray-800 flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            placeholder="Add a note…"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          <button type="submit" disabled={!body.trim() || saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors">
            {saving ? '…' : 'Add'}
          </button>
        </form>
      </div>
    </>
  )
}
