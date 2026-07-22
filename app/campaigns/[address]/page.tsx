import { CampaignDetail } from '@/components/campaigns/CampaignDetail'

export default function CampaignDetailPage({ params }: { params: { address: string } }) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <CampaignDetail address={params.address} />
    </main>
  )
}
