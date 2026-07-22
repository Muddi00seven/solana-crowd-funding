'use client'

/**
 * hooks/useWithdraw.ts
 *
 * Creator-only, only once the goal is met (enforced on-chain). Moves the
 * entire vault balance to the creator's associated token account, creating
 * that account on the fly if it doesn't exist yet.
 */

import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TOKEN_PROGRAM_ID,
  deriveVaultPda,
  getContributorTokenAccount,
  getProgram,
  getTxUrl,
} from '@/lib/solana'
import { useTransactionStore } from '@/store/transactionStore'

export function useWithdraw() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const setPending = useTransactionStore((s) => s.setPending)
  const triggerRefresh = useTransactionStore((s) => s.triggerRefresh)

  async function withdraw(campaignAddress: string): Promise<boolean> {
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
      const creatorTokenAccount = getContributorTokenAccount(mint, wallet.publicKey)

      const signature = await program.methods
        .withdraw()
        .accounts({
          creator: wallet.publicKey,
          campaign: campaignPda,
          vault: vaultPda,
          tokenMint: mint,
          creatorTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc()

      setPending(false)
      triggerRefresh()
      toast.success('Funds withdrawn!', {
        action: { label: 'View tx', onClick: () => window.open(getTxUrl(signature), '_blank') },
      })
      return true
    } catch (err: unknown) {
      setPending(false)
      const e = err as { message?: string }
      toast.error('Withdraw failed', { description: e.message ?? String(err) })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return { withdraw, isSubmitting }
}
