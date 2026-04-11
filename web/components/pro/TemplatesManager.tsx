'use client'
import { useState } from 'react'

interface Template {
  id: string
  name: string
  body: string
  is_default: boolean
}

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm ' +
  'placeholder-gray-500 focus:outline-none focus:border-indigo-500'

function TemplateForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { name: string; body: string }
  onSave: (name: string, body: string) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !body.trim()) return
    setSaving(true)
    await onSave(name.trim(), body.trim())
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 rounded-xl border border-indigo-700/40 bg-indigo-950/20">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Template name</label>
        <input className={inputClass} placeholder="e.g. Initial Outreach" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Message body</label>
        <textarea rows={5} className={inputClass + ' resize-none'} placeholder={'Good day {{firstName}}, my name is…'} value={body} onChange={e => setBody(e.target.value)} required />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export function TemplatesManager({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [creating, setCreating]   = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)

  async function handleCreate(name: string, body: string) {
    const res  = await fetch('/api/pro/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, body }),
    })
    const json = await res.json()
    if (!json.success) { setError(json.error ?? 'Failed to create'); return }
    setTemplates(t => [...t, json.data])
    setCreating(false)
  }

  async function handleUpdate(id: string, name: string, body: string) {
    const res  = await fetch(`/api/pro/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, body }),
    })
    const json = await res.json()
    if (!json.success) { setError(json.error ?? 'Failed to save'); return }
    setTemplates(t => t.map(tmpl => tmpl.id === id ? { ...tmpl, name, body } : tmpl))
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return
    const res  = await fetch(`/api/pro/templates/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json.success) { setError(json.error ?? 'Failed to delete'); return }
    setTemplates(t => t.filter(tmpl => tmpl.id !== id))
  }

  async function handleSetDefault(id: string) {
    const res  = await fetch(`/api/pro/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setDefault: true }),
    })
    const json = await res.json()
    if (!json.success) { setError(json.error ?? 'Failed'); return }
    setTemplates(t => t.map(tmpl => ({ ...tmpl, is_default: tmpl.id === id })))
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-red-400 text-sm bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {templates.length === 0 && !creating && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 py-12 text-center">
          <p className="text-gray-400 text-sm font-medium">No templates yet</p>
          <p className="text-gray-600 text-xs mt-1">Create one to start sending messages quickly.</p>
        </div>
      )}

      {templates.map(tmpl => (
        <div key={tmpl.id}>
          {editingId === tmpl.id ? (
            <TemplateForm
              initial={{ name: tmpl.name, body: tmpl.body }}
              onSave={(name, body) => handleUpdate(tmpl.id, name, body)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white text-sm font-semibold">{tmpl.name}</p>
                    {tmpl.is_default && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 font-semibold">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs whitespace-pre-wrap line-clamp-3">{tmpl.body}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {!tmpl.is_default && (
                    <button onClick={() => handleSetDefault(tmpl.id)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-colors">
                      Set default
                    </button>
                  )}
                  <button onClick={() => setEditingId(tmpl.id)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(tmpl.id)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-red-900/50 text-red-500 hover:border-red-700 hover:text-red-400 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {creating ? (
        <TemplateForm
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <button onClick={() => setCreating(true)}
          className="w-full py-3 rounded-xl border border-dashed border-gray-700 text-gray-500 text-sm hover:border-gray-500 hover:text-gray-300 transition-colors">
          + New template
        </button>
      )}
    </div>
  )
}
