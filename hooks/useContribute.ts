'use client'

/**
 * hooks/useContribute.ts
 *
 * Transfers SPL tokens straight from the contributor's own token account
 * into the campaign vault - no approve() step, unlike the ERC-20 version
 * this replaced (see README.md section 8). One click, one signature.
 */

import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'

import {
  SystemProgram,
  TOKEN_PROGRAM_ID,
  deriveContributionPda,
  deriveVaultPda,
  getContributorTokenAccount,
  getProgram,
  getTxUrl,
} from '@/lib/solana'
import { toRawToken } from '@/lib/format'
import { useTransactionStore } from '@/store/transactionStore'

export function useContribute() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const setPending = useTransactionStore((s) => s.setPending)
  const triggerRefresh = useTransactionStore((s) => s.triggerRefresh)

  async function contribute(campaignAddress: string, amount: string): Promise<boolean> {
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
        .contribute(toRawToken(amount))
        .accounts({
          contributor: wallet.publicKey,
          campaign: campaignPda,
          vault: vaultPda,
          contribution: contributionPda,
          contributorTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      setPending(false)
      triggerRefresh()
      toast.success('Contribution sent!', {
        description: `${amount} tokens`,
        action: { label: 'View tx', onClick: () => window.open(getTxUrl(signature), '_blank') },
      })
      return true
    } catch (err: unknown) {
      setPending(false)
      const e = err as { message?: string }
      toast.error('Contribution failed', { description: e.message ?? String(err) })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return { contribute, isSubmitting }
}
