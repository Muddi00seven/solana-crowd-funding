/**
 * components/contract/WriteFunctions.tsx
 *
 * WRITE (state-changing) instructions against the crowdfunding Anchor
 * program.
 *
 * Flow of a transaction (same shape as the EVM version, different words):
 *   user clicks button
 *     → wallet popup (user confirms)
 *       → tx sent to the cluster
 *         → we call .rpc(), which sends + waits for confirmation for us
 *           → shows the signature or an error
 *
 * Instructions:
 *   createCampaign(title, desc, imageUrl, goal, durationDays) → creates a
 *     new campaign PDA. campaign_id is generated client-side (Date.now())
 *     since Solana has no auto-incrementing storage the program could
 *     assign one from.
 *   contribute(campaignAddress, amount)  → transfers SPL tokens straight
 *     from the contributor's own token account into the campaign vault.
 *     NOTE: unlike the ERC20/USDT version, there is NO approve() step —
 *     SPL transfers are authorized directly by the owner's signature on
 *     the transaction, so "contribute" is the only click needed.
 *   withdraw(campaignAddress)            → creator pulls the raised funds,
 *     once, only after the goal is met.
 *   claimRefund(campaignAddress)         → BONUS instruction that doesn't
 *     exist in the original Solidity contract: any contributor can pull
 *     their own money back if a campaign's deadline passes without
 *     hitting its goal.
 */

'use client'

import { useState } from 'react'
import { BN } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TOKEN_MINT,
  TOKEN_PROGRAM_ID,
  deriveCampaignPda,
  deriveContributionPda,
  deriveVaultPda,
  getContributorTokenAccount,
  getProgram,
  getTxUrl,
} from '@/lib/solana'
import { toRawToken } from '@/lib/format'

// ─── Component ────────────────────────────────────────────────────────────────
export function WriteFunctions() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  // createCampaign inputs
  const [title,    setTitle]    = useState('')
  const [desc,     setDesc]     = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [goal,     setGoal]     = useState('')     // user types "500" → converted to raw units
  const [duration, setDuration] = useState('')     // number of days

  // contribute inputs
  const [contribAddr, setContribAddr] = useState('') // campaign PDA address
  const [contribAmt,  setContribAmt]  = useState('')

  // withdraw / claimRefund inputs
  const [withdrawAddr, setWithdrawAddr] = useState('')
  const [refundAddr,   setRefundAddr]   = useState('')

  // Result state
  const [createResult,   setCreateResult]   = useState('')
  const [contribResult,  setContribResult]  = useState('')
  const [withdrawResult, setWithdrawResult] = useState('')
  const [refundResult,   setRefundResult]   = useState('')

  function requireProgram() {
    if (!wallet) throw new Error('Wallet not connected')
    return { program: getProgram(wallet, connection), wallet }
  }

  // ── Generic write helper ─────────────────────────────────────────────────
  async function callWrite(setResult: (s: string) => void, fn: () => Promise<string>) {
    setResult('⏳ waiting for wallet signature...')
    try {
      const signature = await fn()
      setResult(`✅ confirmed!\n${getTxUrl(signature)}`)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setResult('❌ ' + (e.message ?? String(err)))
    }
  }

  /**
   * createCampaign
   *
   * campaign_id is a client-chosen number (Date.now()) - it exists purely
   * so one wallet can run several campaigns, since every PDA needs a
   * unique seed. Both the campaign account and its token vault are
   * created (`init`) in this single instruction.
   */
  async function handleCreateCampaign() {
    await callWrite(setCreateResult, async () => {
      const { program, wallet } = requireProgram()

      const campaignId = new BN(Date.now())
      const [campaignPda] = deriveCampaignPda(wallet.publicKey, campaignId)
      const [vaultPda] = deriveVaultPda(campaignPda)

      const signature = await program.methods
        .createCampaign(
          campaignId,
          title,
          desc,
          imageUrl,
          toRawToken(goal),
          new BN(duration || '0')
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

      // Surface the derived campaign address — this is what contribute()/
      // withdraw()/getCampaign() below all need, there's no id to look it
      // up by otherwise.
      return `${signature}\ncampaign address: ${campaignPda.toBase58()}`
    })
  }

  /**
   * contribute
   *
   * Sends SPL tokens straight from your own associated token account into
   * the campaign's vault - no approve() step first, unlike the ERC20
   * version. We fetch the campaign account first purely to read its
   * token_mint (so this works for a campaign created with any mint, not
   * just the default NEXT_PUBLIC_TOKEN_MINT).
   */
  async function handleContribute() {
    await callWrite(setContribResult, async () => {
      const { program, wallet } = requireProgram()
      const campaignPda = new PublicKey(contribAddr.trim())

      const campaign = await program.account.campaign.fetch(campaignPda)
      const mint = campaign.tokenMint as PublicKey

      const [vaultPda] = deriveVaultPda(campaignPda)
      const [contributionPda] = deriveContributionPda(campaignPda, wallet.publicKey)
      const contributorTokenAccount = getContributorTokenAccount(mint, wallet.publicKey)

      return program.methods
        .contribute(toRawToken(contribAmt))
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
    })
  }

  /**
   * withdraw
   *
   * Only the campaign's creator can call this, and only once the goal has
   * been reached (enforced on-chain). Transfers all raised tokens from the
   * vault to the creator's own associated token account (created here if
   * it doesn't exist yet).
   */
  async function handleWithdraw() {
    await callWrite(setWithdrawResult, async () => {
      const { program, wallet } = requireProgram()
      const campaignPda = new PublicKey(withdrawAddr.trim())

      const campaign = await program.account.campaign.fetch(campaignPda)
      const mint = campaign.tokenMint as PublicKey

      const [vaultPda] = deriveVaultPda(campaignPda)
      const creatorTokenAccount = getContributorTokenAccount(mint, wallet.publicKey)

      return program.methods
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
    })
  }

  /**
   * claimRefund
   *
   * Not present in the original Solidity contract — added here so donors
   * aren't stuck forever if a campaign expires without hitting its goal.
   * Any contributor can call this for their own contribution once the
   * deadline has passed.
   */
  async function handleClaimRefund() {
    await callWrite(setRefundResult, async () => {
      const { program, wallet } = requireProgram()
      const campaignPda = new PublicKey(refundAddr.trim())

      const campaign = await program.account.campaign.fetch(campaignPda)
      const mint = campaign.tokenMint as PublicKey

      const [vaultPda] = deriveVaultPda(campaignPda)
      const [contributionPda] = deriveContributionPda(campaignPda, wallet.publicKey)
      const contributorTokenAccount = getContributorTokenAccount(mint, wallet.publicKey)

      return program.methods
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
    })
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  const inputStyle = 'border border-border bg-background text-foreground rounded px-2 py-1 text-xs font-mono'
  const btnStyle   = 'px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-mono hover:opacity-80 cursor-pointer'
  const resultBox  = 'mt-2 text-xs font-mono text-green-400 break-all whitespace-pre-wrap bg-black/20 rounded p-2'
  const fnLabel    = 'text-xs font-mono font-bold text-foreground'
  const note       = 'text-xs text-muted-foreground font-normal font-mono'
  const row        = 'flex flex-wrap gap-2 items-center'

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <section className="border border-border rounded-lg p-4 space-y-6">

      {/* Header */}
      <div className="text-xs text-muted-foreground uppercase tracking-widest">
        WRITE — requires wallet signature + a small SOL fee
      </div>

      {/* ── createCampaign ──────────────────────────────────────────────── */}
      <div className="space-y-1">
        <span className={fnLabel}>createCampaign()</span>
        <input
          className={`${inputStyle} w-full`}
          placeholder="title (min 5 characters)"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          className={`${inputStyle} w-full`}
          placeholder="description (max 200 chars)"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        <input
          className={`${inputStyle} w-full`}
          placeholder="image URL (optional)"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className={`${inputStyle} flex-1`}
            placeholder="goal in tokens (e.g. 500)"
            value={goal}
            onChange={e => setGoal(e.target.value)}
          />
          <input
            className={inputStyle}
            style={{ width: 120 }}
            placeholder="duration (days)"
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />
        </div>
        <button className={btnStyle} onClick={handleCreateCampaign}>send tx</button>
        {createResult && <div className={resultBox}>{createResult}</div>}
      </div>

      {/* ── contribute ──────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <div>
          <span className={fnLabel}>contribute()</span>
          <span className={note}> — no approve step needed on Solana</span>
        </div>
        <div className={row}>
          <input
            className={inputStyle}
            style={{ width: 320 }}
            placeholder="campaign PDA address"
            value={contribAddr}
            onChange={e => setContribAddr(e.target.value)}
          />
          <input
            className={inputStyle}
            style={{ width: 150 }}
            placeholder="amount in tokens (e.g. 10)"
            value={contribAmt}
            onChange={e => setContribAmt(e.target.value)}
          />
          <button className={btnStyle} onClick={handleContribute}>send tx</button>
        </div>
        {contribResult && <div className={resultBox}>{contribResult}</div>}
      </div>

      {/* ── withdraw ────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <div>
          <span className={fnLabel}>withdraw()</span>
          <span className={note}> — only creator, only after goal is reached</span>
        </div>
        <div className={row}>
          <input
            className={inputStyle}
            style={{ width: 320 }}
            placeholder="campaign PDA address"
            value={withdrawAddr}
            onChange={e => setWithdrawAddr(e.target.value)}
          />
          <button className={btnStyle} onClick={handleWithdraw}>send tx</button>
        </div>
        {withdrawResult && <div className={resultBox}>{withdrawResult}</div>}
      </div>

      {/* ── claimRefund ─────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <div>
          <span className={fnLabel}>claimRefund()</span>
          <span className={note}> — bonus instruction, no EVM equivalent; only after deadline if goal missed</span>
        </div>
        <div className={row}>
          <input
            className={inputStyle}
            style={{ width: 320 }}
            placeholder="campaign PDA address"
            value={refundAddr}
            onChange={e => setRefundAddr(e.target.value)}
          />
          <button className={btnStyle} onClick={handleClaimRefund}>send tx</button>
        </div>
        {refundResult && <div className={resultBox}>{refundResult}</div>}
      </div>

    </section>
  )
}
