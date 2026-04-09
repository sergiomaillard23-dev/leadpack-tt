'use client'

interface KYCBannerProps {
  kycStatus: string
}

export default function KYCBanner({ kycStatus }: KYCBannerProps) {
  if (kycStatus === 'approved') return null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-4">
      {/* Left: icon + text */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className="text-amber-400 text-lg shrink-0">⚠️</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-300">
            Verification Pending — Upload your ID to unlock Legendary Packs
          </p>

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-amber-900/40 rounded-full overflow-hidden">
              <div className="h-full w-4/5 bg-amber-400 rounded-full" />
            </div>
            <span className="text-[11px] font-bold text-amber-400 shrink-0">80% Verified</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <a
        href="/settings/kyc"
        className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-black uppercase tracking-wider transition-colors"
      >
        Complete Verification →
      </a>
    </div>
  )
}
