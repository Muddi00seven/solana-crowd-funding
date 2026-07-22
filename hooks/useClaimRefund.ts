'use client'

/**
 * hooks/useClaimRefund.ts
 *
 * Bonus instruction - no equivalent in the original Solidity contract. Any
 * contributor can pull back exactly what they put in once a campaign's
 * deadline passes without hitting its goal.
 */

import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'

import {
  TOKEN_PROGRAM_ID,
  deriveContributionPda,
  deriveVaultPda,
  getContributorTokenAccount,
  getProgram,
  getTxUrl,
} from '@/lib/solana'
import { useTransactionStore } from '@/store/transactionStore'

export function useClaimRefund() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const setPending = useTransactionStore((s) => s.setPending)
  const triggerRefresh = useTransactionStore((s) => s.triggerRefresh)

  async function claimRefund(campaignAddress: string): Promise<boolean> {
    if (!wallet) {
      toast.error('Connect your wallet first')
      return false
    }

    setIsSubmitting(true)
    setPending(true, 'Waiting for wallet signature...')
    try {
      const program = getProgram(wallet, connection)
      const campaignPda = new PublicKey(campaignAddress)

      const campaign = await program.account.campaign.fetch(campaignPda)
      const mint = campaign.tokenMint as PublicKey

      const [vaultPda] = deriveVaultPda(campaignPda)
      const [contributionPda] = deriveContributionPda(campaignPda, wallet.publicKey)
      const contributorTokenAccount = getContributorTokenAccount(mint, wallet.publicKey)

      const signature = await program.methods
        .claimRefund()
        .accounts({
          contributor: wallet.publicKey,
          campaign: campaignPda,
          vault: vaultPda,
          contribution: contributionPda,
          contributorTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc()

      setPending(false)
      triggerRefresh()
      toast.success('Refund claimed!', {
        action: { label: 'View tx', onClick: () => window.open(getTxUrl(signature), '_blank') },
      })
      return true
    } catch (err: unknown) {
      setPending(false)
      const e = err as { message?: string }
      toast.error('Refund failed', { description: e.message ?? String(err) })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return { claimRefund, isSubmitting }
}
