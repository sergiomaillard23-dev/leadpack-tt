'use client'
import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-red-400 font-semibold mb-2">Something went wrong</p>
      <p className="text-gray-600 text-sm mb-6">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
