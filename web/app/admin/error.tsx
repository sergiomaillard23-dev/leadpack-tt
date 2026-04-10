'use client'

export default function AdminError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <div className="text-center">
        <p className="text-red-400 font-semibold mb-2">Admin page error</p>
        <p className="text-gray-500 text-sm font-mono">{error.message}</p>
        <p className="text-gray-600 text-xs mt-2">Check Vercel function logs for details.</p>
      </div>
    </div>
  )
}
