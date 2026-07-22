'use client'

/**
 * hooks/useCreateCampaign.ts
 *
 * campaign_id is generated client-side (Date.now()) since Solana has no
 * auto-incrementing storage the program could assign one from - see
 * lib/solana.ts's deriveCampaignPda for why. Both the campaign account and
 * its token vault are created (`init`) in this single instruction.
 */

import { useState } from 'react'
import { BN } from '@coral-xyz/anchor'
import { toast } from 'sonner'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'

import {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TOKEN_MINT,
  TOKEN_PROGRAM_ID,
  deriveCampaignPda,
  deriveVaultPda,
  getProgram,
  getTxUrl,
} from '@/lib/solana'
import { toRawToken } from '@/lib/format'
import { useTransactionStore } from '@/store/transactionStore'

export interface CreateCampaignInput {
  title: string
  description: string
  imageUrl: string
  goal: string // human units, e.g. "500"
  durationDays: number
}

export function useCreateCampaign() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const setPending = useTransactionStore((s) => s.setPending)
  const triggerRefresh = useTransactionStore((s) => s.triggerRefresh)

  /** Returns the new campaign's PDA address (base58) on success, null on failure/cancel. */
  async function createCampaign(input: CreateCampaignInput): Promise<string | null> {
    if (!wallet) {
      toast.error('Connect your wallet first')
      return null
    }

    setIsSubmitting(true)
    setPending(true, 'Waiting for wallet signature...')
    try {
      const program = getProgram(wallet, connection)
      const campaignId = new BN(Date.now())
      const [campaignPda] = deriveCampaignPda(wallet.publicKey, campaignId)
      const [vaultPda] = deriveVaultPda(campaignPda)

      const signature = await program.methods
        .createCampaign(
          campaignId,
          input.title,
          input.description,
          input.imageUrl,
          toRawToken(input.goal),
          new BN(input.durationDays)
        )
        .accounts({
          creator: wallet.publicKey,
          tokenMint: TOKEN_MINT,
          campaign: campaignPda,
          vault: vaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc()

      setPending(false)
      triggerRefresh()
      toast.success('Campaign created!', {
        description: input.title,
        action: { label: 'View tx', onClick: () => window.open(getTxUrl(signature), '_blank') },
      })
      return campaignPda.toBase58()
    } catch (err: unknown) {
      setPending(false)
      const e = err as { message?: string }
      toast.error('Failed to create campaign', { description: e.message ?? String(err) })
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return { createCampaign, isSubmitting }
}
