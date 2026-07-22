'use client'

/**
 * components/campaigns/CampaignGrid.tsx
 *
 * The home page's campaign browser: a tab bar (All / Still Going / Goal
 * Reached / Expired) over a responsive card grid, with loading skeletons,
 * an error+retry state, and an empty state pointing at "Create a campaign".
 *
 * Filtering is entirely client-side over one fetch of every Campaign
 * account (there's no on-chain query language to filter server-side the
 * way a SQL `WHERE` clause would) - fine at devnet-demo scale.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PublicKey } from '@solana/web3.js'
import { PlusCircle, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { CampaignCardSkeleton } from '@/components/campaigns/CampaignCardSkeleton'
import { useCampaigns } from '@/hooks/useCampaigns'
import { getCampaignStatus, type CampaignStatus } from '@/lib/solana'
import { cn } from '@/lib/utils'

type Tab = 'all' | CampaignStatus

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Campaigns' },
  { key: 'active', label: 'Still Going' },
  { key: 'goalReached', label: 'Goal Reached' },
  { key: 'expired', label: 'Expired' },
]

export function CampaignGrid({ onlyCreator }: { onlyCreator?: PublicKey }) {
  const { campaigns, isLoading, isError, refetch } = useCampaigns()
  const [tab, setTab] = useState<Tab>('all')

  const scoped = useMemo(
    () => (onlyCreator ? campaigns.filter((c) => c.account.creator.equals(onlyCreator)) : campaigns),
    [campaigns, onlyCreator]
  )

  const filtered = useMemo(
    () => (tab === 'all' ? scoped : scoped.filter((c) => getCampaignStatus(c.account) === tab)),
    [scoped, tab]
  )

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
              tab === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
            )}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button asChild size="sm">
            <Link href="/campaigns/create">
              <PlusCircle className="h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">Couldn&apos;t load campaigns from devnet.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">
            {tab === 'all' ? 'No campaigns yet.' : `No campaigns in "${TABS.find((t) => t.key === tab)?.label}" right now.`}
          </p>
          <Button asChild>
            <Link href="/campaigns/create">
              <PlusCircle className="h-4 w-4" />
              Create the first campaign
            </Link>
          </Button>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((entry) => (
            <CampaignCard key={entry.publicKey.toBase58()} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
