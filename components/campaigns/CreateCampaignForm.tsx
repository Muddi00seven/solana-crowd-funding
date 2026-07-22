'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateCampaign } from '@/hooks/useCreateCampaign'
import { createCampaignSchema, type CreateCampaignFormData } from '@/lib/validations'
import { TOKEN_DECIMALS } from '@/lib/solana'

export function CreateCampaignForm() {
  const router = useRouter()
  const { connected } = useWallet()
  const { setVisible } = useWalletModal()
  const { createCampaign, isSubmitting } = useCreateCampaign()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCampaignFormData>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: { title: '', description: '', imageUrl: '', goal: '', durationDays: 30 },
  })

  async function onSubmit(data: CreateCampaignFormData) {
    const address = await createCampaign(data)
    if (address) router.push(`/campaigns/${address}`)
  }

  if (!connected) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <p className="text-muted-foreground">Connect your wallet to create a campaign.</p>
          <Button onClick={() => setVisible(true)}>Connect Wallet</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Solar panels for a village clinic" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={4}
              placeholder="What is this campaign for? (max 200 characters)"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input id="imageUrl" placeholder="https://..." {...register('imageUrl')} />
            {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="goal">Goal ({TOKEN_DECIMALS}-decimal token)</Label>
              <Input id="goal" placeholder="e.g. 500" inputMode="decimal" {...register('goal')} />
              {errors.goal && <p className="text-xs text-destructive">{errors.goal.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="durationDays">Duration (days)</Label>
              <Input
                id="durationDays"
                type="number"
                min={1}
                max={365}
                {...register('durationDays', { valueAsNumber: true })}
              />
              {errors.durationDays && <p className="text-xs text-destructive">{errors.durationDays.message}</p>}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating...' : 'Create Campaign'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
