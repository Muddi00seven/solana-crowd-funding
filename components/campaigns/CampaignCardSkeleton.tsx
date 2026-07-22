import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function CampaignCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <Skeleton className="h-32 w-full rounded-none" />
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-2 w-full" />
      </CardContent>
      <CardFooter className="border-t border-border pt-3">
        <Skeleton className="h-4 w-full" />
      </CardFooter>
    </Card>
  )
}
