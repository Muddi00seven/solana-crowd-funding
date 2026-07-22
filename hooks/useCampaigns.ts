'use client'

/**
 * hooks/useCampaigns.ts
 *
 * Every Campaign account on the program - powers the home grid and (with a
 * client-side filter) "my campaigns". Read-only: no wallet required to
 * browse. Refetches automatically whenever a write succeeds anywhere in the
 * app, via the shared refreshTrigger in store/transactionStore.
 */

import { useCallback, useEffect, useState } from 'react'
import { fetchAllCampaigns, type CampaignAccount, type ProgramAccountEntry } from '@/lib/solana'
import { useTransactionStore } from '@/store/transactionStore'

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<ProgramAccountEntry<CampaignAccount>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const all = await fetchAllCampaigns()
      setCampaigns(all)
    } catch (e) {
      setIsError(true)
      setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshTrigger = useTransactionStore((state) => state.refreshTrigger)
  useEffect(() => {
    refetch()
  }, [refetch, refreshTrigger])

  return { campaigns, isLoading, isError, error, refetch }
}
