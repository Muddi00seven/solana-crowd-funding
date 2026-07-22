'use client'

/**
 * hooks/useCampaign.ts
 *
 * A single Campaign account by its PDA address string - powers the
 * campaign detail page. Read-only: no wallet required.
 */

import { useCallback, useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { fetchCampaign, type CampaignAccount } from '@/lib/solana'
import { useTransactionStore } from '@/store/transactionStore'

export function useCampaign(address: string) {
  const [campaign, setCampaign] = useState<CampaignAccount | undefined>(undefined)
  const [publicKey, setPublicKey] = useState<PublicKey | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const pda = new PublicKey(address)
      const result = await fetchCampaign(pda)
      setPublicKey(pda)
      setCampaign(result)
    } catch (e) {
      setIsError(true)
      setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }, [address])

  const refreshTrigger = useTransactionStore((state) => state.refreshTrigger)
  useEffect(() => {
    refetch()
  }, [refetch, refreshTrigger])

  return { campaign, publicKey, isLoading, isError, error, refetch }
}
