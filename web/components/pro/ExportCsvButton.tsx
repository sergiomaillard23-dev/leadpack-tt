'use client'
import { useState } from 'react'

export function ExportCsvButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch('/api/pro/export-csv')
      if (!res.ok) return
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `leadpack-export-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-xs font-medium
                 hover:border-gray-500 hover:text-white transition-colors disabled:opacity-50"
    >
      {loading ? 'Exporting…' : 'Export CSV'}
    </button>
  )
}
