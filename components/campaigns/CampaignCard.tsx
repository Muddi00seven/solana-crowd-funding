import Link from 'next/link'
import { Users, Clock } from 'lucide-react'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/campaigns/StatusBadge'
import { formatToken } from '@/lib/format'
import { getCampaignStatus, type CampaignAccount, type ProgramAccountEntry } from '@/lib/solana'
import { getDaysLeft, getProgress, truncateAddress } from '@/lib/utils'

export function CampaignCard({ entry }: { entry: ProgramAccountEntry<CampaignAccount> }) {
  const { publicKey, account } = entry
  const status = getCampaignStatus(account)
  const progress = getProgress(account.raised, account.goal)
  const daysLeft = getDaysLeft(account.deadline)

  return (
    <Link href={`/campaigns/${publicKey.toBase58()}`} className="block group">
      <Card className="h-full overflow-hidden transition-colors group-hover:border-primary/60">
        {/* Header image - the program's imageUrl is a plain string, no on-chain
            guarantee it's a real reachable image, so we always fall back to a
            gradient placeholder instead of risking a broken <img>. */}
        <div className="h-32 w-full bg-gradient-to-br from-primary/30 via-accent/20 to-transparent" />

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground leading-snug line-clamp-2">{account.title}</h3>
            <StatusBadge status={status} className="shrink-0" />
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{account.description}</p>

          <div className="space-y-1.5">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="text-foreground font-medium">{formatToken(account.raised)}</span>
              <span>of {formatToken(account.goal)}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-between text-xs text-muted-foreground border-t border-border pt-3">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {account.contributorsCount.toString()} contributor{account.contributorsCount.eqn(1) ? '' : 's'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {status === 'active' ? `${daysLeft}d left` : status === 'goalReached' ? 'Funded' : 'Ended'}
          </span>
        </CardFooter>

        <div className="px-6 pb-3 -mt-1 text-[11px] font-mono text-muted-foreground/70">
          by {truncateAddress(account.creator.toBase58())} · {truncateAddress(publicKey.toBase58())}
        </div>
      </Card>
    </Link>
  )
}
