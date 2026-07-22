'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

import { Button } from '@/components/ui/button'
import { CampaignGrid } from '@/components/campaigns/CampaignGrid'

export default function MyCampaignsPage() {
  const { publicKey, connected } = useWallet()
  const { setVisible } = useWalletModal()

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Campaigns</h1>
        <p className="text-muted-foreground mt-1">Every campaign created by your connected wallet.</p>
      </div>

      {!connected || !publicKey ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">Connect your wallet to see the campaigns you&apos;ve created.</p>
          <Button onClick={() => setVisible(true)}>Connect Wallet</Button>
        </div>
      ) : (
        <CampaignGrid onlyCreator={publicKey} />
      )}
    </main>
  )
}
