import { formatToken, formatDate } from '@/lib/format'
import { truncateAddress } from '@/lib/utils'
import { getAddressUrl, type ContributionAccount, type ProgramAccountEntry } from '@/lib/solana'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function ContributionsList({
  contributions,
  isLoading,
}: {
  contributions: ProgramAccountEntry<ContributionAccount>[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (contributions.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No contributions yet — be the first.</p>
  }

  // Most recent first.
  const sorted = [...contributions].sort((a, b) => b.account.lastContributedAt.cmp(a.account.lastContributedAt))

  return (
    <div className="divide-y divide-border">
      {sorted.map(({ publicKey, account }) => (
        <div key={publicKey.toBase58()} className="flex items-center justify-between py-2.5 text-sm">
          <a
            href={getAddressUrl(account.contributor.toBase58())}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-foreground hover:text-primary transition-colors"
          >
            {truncateAddress(account.contributor.toBase58())}
          </a>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{formatDate(account.lastContributedAt)}</span>
            <span className="font-medium text-foreground">{formatToken(account.amount)}</span>
            {account.refunded && (
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                Refunded
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
