'use client'

/**
 * hooks/useContributions.ts
 *
 * Every Contribution PDA for one campaign - powers the contributions table
 * on the detail page, and (filtered client-side by the connected wallet) the
 * "did I already contribute / can I claim a refund" checks. Read-only.
 */

import { useCallback, useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { fetchContributionsForCampaign, type ContributionAccount, type ProgramAccountEntry } from '@/lib/solana'
import { useTransactionStore } from '@/store/transactionStore'

export function useContributions(campaignAddress: string | undefined) {
  const [contributions, setContributions] = useState<ProgramAccountEntry<ContributionAccount>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const refetch = useCallback(async () => {
    if (!campaignAddress) return
    setIsLoading(true)
    setIsError(false)
    try {
      const pda = new PublicKey(campaignAddress)
      const list = await fetchContributionsForCampaign(pda)
      setContributions(list)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [campaignAddress])

  const refreshTrigger = useTransactionStore((state) => state.refreshTrigger)
  useEffect(() => {
    refetch()
  }, [refetch, refreshTrigger])

  return { contributions, isLoading, isError, refetch }
}
