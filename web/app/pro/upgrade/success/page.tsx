export default function UpgradeSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-4">
          LEGENDARY PRO
        </span>
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to Legendary Pro</h1>
        <p className="text-gray-400 text-sm mb-8">
          Your membership is active for 365 days. Legendary Packs and all Pro features are now unlocked.
        </p>
        <a href="/marketplace"
          className="inline-block w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold transition-colors">
          Go to Marketplace
        </a>
      </div>
    </div>
  )
}
