import { CampaignGrid } from '@/components/campaigns/CampaignGrid'

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
        <p className="text-muted-foreground mt-1">
          Transparent, on-chain crowdfunding — powered by a Solana devnet program. No wallet needed to browse.
        </p>
      </div>
      <CampaignGrid />
    </main>
  )
}
