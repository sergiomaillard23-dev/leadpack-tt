'use client'
import { useEffect, useRef, useState } from 'react'
import type { PipelineLead, LeadNote } from '@/lib/db/pipeline'
import { WhatsAppModal } from './WhatsAppModal'

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
  const [notes, setNotes]       = useState<LeadNote[]>([])
  const [body, setBody]         = useState('')
  const [saving, setSaving]     = useState(false)
  const [loading, setLoading]   = useState(true)
  const [showWa, setShowWa]     = useState(false)
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWa(true)}
              className="px-2.5 py-1.5 rounded-lg bg-green-700/60 hover:bg-green-600 border border-green-700/40 text-green-300 text-xs font-semibold transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.557 4.118 1.528 5.849L0 24l6.335-1.508A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.79 9.79 0 01-5.002-1.371l-.36-.213-3.757.894.952-3.653-.234-.374A9.778 9.778 0 012.182 12C2.182 6.579 6.579 2.182 12 2.182S21.818 6.579 21.818 12 17.421 21.818 12 21.818z"/>
              </svg>
              WhatsApp
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white p-1 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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

      {showWa && (
        <WhatsAppModal
          lead={{ phone: lead.phone, full_name: lead.full_name }}
          onClose={() => setShowWa(false)}
        />
      )}
    </>
  )
}
