import { CreateCampaignForm } from '@/components/campaigns/CreateCampaignForm'

export default function CreateCampaignPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create a Campaign</h1>
        <p className="text-sm text-muted-foreground mt-1">
          One signed transaction creates your campaign and its token vault on devnet.
        </p>
      </div>
      <CreateCampaignForm />
    </main>
  )
}
