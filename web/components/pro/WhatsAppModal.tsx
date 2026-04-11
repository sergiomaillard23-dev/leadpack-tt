'use client'
import { useEffect, useState } from 'react'
import { phoneToWaMe } from '@/lib/utils'

interface Lead {
  phone: string
  full_name: string
}

interface Template {
  id: string
  name: string
  body: string
  is_default: boolean
}

interface Props {
  lead: Lead
  onClose: () => void
}

function renderTemplate(body: string, lead: Lead): string {
  const parts   = lead.full_name.trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName  = parts.slice(1).join(' ') || ''
  return body
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{lastName\}\}/g, lastName)
    .replace(/\{\{policyInterest\}\}/g, '')
    .trim()
}

export function WhatsAppModal({ lead, onClose }: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected]   = useState<string>('')
  const [message, setMessage]     = useState('')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch('/api/pro/templates')
      .then(r => r.json())
      .then(j => {
        if (!j.success) return
        setTemplates(j.data)
        const def = j.data.find((t: Template) => t.is_default) ?? j.data[0]
        if (def) {
          setSelected(def.id)
          setMessage(renderTemplate(def.body, lead))
        }
      })
      .finally(() => setLoading(false))
  }, [lead])

  function handleTemplateChange(id: string) {
    setSelected(id)
    const t = templates.find(t => t.id === id)
    if (t) setMessage(renderTemplate(t.body, lead))
  }

  function handleOpen() {
    const phone = phoneToWaMe(lead.phone)
    const url   = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <div>
              <p className="text-white font-semibold text-sm">Send via WhatsApp</p>
              <p className="text-gray-500 text-xs mt-0.5">{lead.full_name} · {lead.phone}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Template selector */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Template</label>
              {loading ? (
                <p className="text-gray-500 text-sm">Loading templates…</p>
              ) : templates.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No templates saved.{' '}
                  <a href="/pro/templates" className="text-indigo-400 underline">Create one</a>
                </p>
              ) : (
                <select
                  value={selected}
                  onChange={e => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}{t.is_default ? ' (default)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Message preview / edit */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">
                Message <span className="text-gray-600">(edit before sending)</span>
              </label>
              <textarea
                rows={6}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Select a template above or type your message…"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-300 text-sm hover:border-gray-500 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleOpen}
              disabled={!message.trim()}
              className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.557 4.118 1.528 5.849L0 24l6.335-1.508A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.79 9.79 0 01-5.002-1.371l-.36-.213-3.757.894.952-3.653-.234-.374A9.778 9.778 0 012.182 12C2.182 6.579 6.579 2.182 12 2.182S21.818 6.579 21.818 12 17.421 21.818 12 21.818z"/>
              </svg>
              Open WhatsApp
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
