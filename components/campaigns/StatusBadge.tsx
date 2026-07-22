import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CampaignStatus } from '@/lib/solana'

const LABEL: Record<CampaignStatus, string> = {
  active: 'Still Going',
  goalReached: 'Goal Reached',
  expired: 'Expired',
}

const STYLE: Record<CampaignStatus, string> = {
  active: 'border-accent/40 bg-accent/10 text-accent',
  goalReached: 'border-success/40 bg-success/10 text-success',
  expired: 'border-muted-foreground/30 bg-muted text-muted-foreground',
}

export function StatusBadge({ status, className }: { status: CampaignStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(STYLE[status], className)}>
      {LABEL[status]}
    </Badge>
  )
}
