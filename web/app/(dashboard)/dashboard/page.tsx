import MarketTicker from '@/components/dashboard/MarketTicker'
import NextDropTimer from '@/components/dashboard/NextDropTimer'
import WalletCard from '@/components/dashboard/WalletCard'
import InventoryCard from '@/components/dashboard/InventoryCard'
import KYCBanner from '@/components/dashboard/KYCBanner'

export default function DashboardPage() {
  // TODO (Phase 8 — Real DB): replace with agent.kyc_status from session
  const mockKycStatus = 'pending'

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto">
      {/* Full-width ticker */}
      <MarketTicker />

      {/* Full-width drop timer */}
      <NextDropTimer />

      {/* Stat cards — 2-col on sm, stays 2-col (PerformanceCard omitted for now) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WalletCard />
        <InventoryCard />
      </div>

      {/* KYC banner — only renders when not approved */}
      <KYCBanner kycStatus={mockKycStatus} />
    </div>
  )
}
