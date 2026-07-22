'use client'

/**
 * components/campaigns/CampaignDetail.tsx
 *
 * The full campaign screen: stats, description, a contribute panel, and
 * conditional creator-withdraw / contributor-claim-refund actions that only
 * render when the connected wallet is actually eligible for them (the
 * on-chain `require!()` checks in create_campaign/withdraw/claim_refund are
 * still the real gate - this is just about not showing a button that would
 * only fail).
 */

import { useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Users, Clock, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/campaigns/StatusBadge'
import { ContributionsList } from '@/components/campaigns/ContributionsList'

import { useCampaign } from '@/hooks/useCampaign'
import { useContributions } from '@/hooks/useContributions'
import { useContribute } from '@/hooks/useContribute'
import { useWithdraw } from '@/hooks/useWithdraw'
import { useClaimRefund } from '@/hooks/useClaimRefund'

import { formatToken, formatDate } from '@/lib/format'
import { getAddressUrl, getCampaignStatus } from '@/lib/solana'
import { getDaysLeft, getProgress, isValidTokenAmount, truncateAddress } from '@/lib/utils'

export function CampaignDetail({ address }: { address: string }) {
  const { publicKey: walletPublicKey, connected } = useWallet()
  const { setVisible } = useWalletModal()

  const { campaign, publicKey, isLoading, isError, error } = useCampaign(address)
  const { contributions, isLoading: contributionsLoading } = useContributions(address)

  const { contribute, isSubmitting: contributing } = useContribute()
  const { withdraw, isSubmitting: withdrawing } = useWithdraw()
  const { claimRefund, isSubmitting: refunding } = useClaimRefund()

  const [amount, setAmount] = useState('')

  const myContribution = useMemo(
    () => (walletPublicKey ? contributions.find((c) => c.account.contributor.equals(walletPublicKey)) : undefined),
    [contributions, walletPublicKey]
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (isError || !campaign || !publicKey) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">
          Couldn&apos;t find a campaign at this address on devnet.
          {error?.message ? <span className="block text-xs mt-2 font-mono">{error.message}</span> : null}
        </p>
      </div>
    )
  }

  const status = getCampaignStatus(campaign)
  const progress = getProgress(campaign.raised, campaign.goal)
  const daysLeft = getDaysLeft(campaign.deadline)

  const isCreator = !!walletPublicKey && walletPublicKey.equals(campaign.creator)
  const canWithdraw = isCreator && status === 'goalReached' && !campaign.withdrawn
  const canClaimRefund =
    !!myContribution &&
    status === 'expired' &&
    !myContribution.account.refunded &&
    !myContribution.account.amount.isZero()
  const canContribute = status === 'active'

  return (
    <div className="space-y-6">
      <div className="h-40 w-full rounded-xl bg-gradient-to-br from-primary/30 via-accent/20 to-transparent" />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{campaign.title}</h1>
            <StatusBadge status={status} />
          </div>
          <div className="mt-1 text-xs font-mono text-muted-foreground space-x-3">
            <a
              href={getAddressUrl(campaign.creator.toBase58())}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              by {truncateAddress(campaign.creator.toBase58())}
            </a>
            <a
              href={getAddressUrl(publicKey.toBase58())}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              {truncateAddress(publicKey.toBase58())}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Progress value={progress} className="h-3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Raised</div>
              <div className="font-semibold text-foreground">{formatToken(campaign.raised)}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Goal</div>
              <div className="font-semibold text-foreground">{formatToken(campaign.goal)}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs flex items-center gap-1">
                <Users className="h-3 w-3" /> Contributors
              </div>
              <div className="font-semibold text-foreground">{campaign.contributorsCount.toString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" /> {status === 'active' ? 'Days left' : 'Deadline'}
              </div>
              <div className="font-semibold text-foreground">
                {status === 'active' ? daysLeft : formatDate(campaign.deadline)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</h2>
        <p className="text-foreground whitespace-pre-wrap">{campaign.description || 'No description provided.'}</p>
      </div>

      {/* Actions */}
      {!connected && (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-muted-foreground text-sm">Connect your wallet to contribute to this campaign.</p>
            <Button onClick={() => setVisible(true)}>Connect Wallet</Button>
          </CardContent>
        </Card>
      )}

      {connected && canContribute && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label htmlFor="contribute-amount">Contribute</Label>
            <div className="flex gap-2">
              <Input
                id="contribute-amount"
                placeholder="Amount in tokens (e.g. 10)"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button
                disabled={contributing || !isValidTokenAmount(amount)}
                onClick={async () => {
                  const ok = await contribute(publicKey.toBase58(), amount)
                  if (ok) setAmount('')
                }}
              >
                {contributing ? 'Sending...' : 'Contribute'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">No approve step needed — one signature, one transaction.</p>
          </CardContent>
        </Card>
      )}

      {connected && canWithdraw && (
        <Card className="border-success/40">
          <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium text-foreground">Goal reached — funds are ready to withdraw.</p>
              <p className="text-xs text-muted-foreground">Only you (the creator) can withdraw, once.</p>
            </div>
            <Button disabled={withdrawing} onClick={() => withdraw(publicKey.toBase58())}>
              {withdrawing ? 'Withdrawing...' : 'Withdraw Funds'}
            </Button>
          </CardContent>
        </Card>
      )}

      {connected && canClaimRefund && (
        <Card className="border-warning/40">
          <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium text-foreground">This campaign missed its goal.</p>
              <p className="text-xs text-muted-foreground">
                You contributed {formatToken(myContribution!.account.amount)} — you can claim it back.
              </p>
            </div>
            <Button variant="outline" disabled={refunding} onClick={() => claimRefund(publicKey.toBase58())}>
              {refunding ? 'Claiming...' : 'Claim Refund'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Contributions ({contributions.length})
        </h2>
        <ContributionsList contributions={contributions} isLoading={contributionsLoading} />
      </div>
    </div>
  )
}
