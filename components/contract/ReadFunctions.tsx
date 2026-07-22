/**
 * components/contract/ReadFunctions.tsx
 *
 * READ (view) functions against the crowdfunding Anchor program.
 *
 * Solana has no "view function, no gas" concept the way Solidity does —
 * every read here is either:
 *   (a) a single account fetch (program.account.campaign.fetch(pda)), or
 *   (b) a getProgramAccounts scan with memcmp filters (for "list" queries)
 * Neither needs a signature or costs SOL - both just hit the RPC node.
 *
 * Functions:
 *   getCampaign(address)        → fetch one Campaign account by its PDA address
 *   getContributions(address)   → list every Contribution PDA for a campaign
 *   listMyCampaigns()           → list every Campaign PDA created by the
 *                                  connected wallet
 *
 * Why no getCampaignCount()/getCampaign(id) like the EVM version?
 * The Solidity contract kept a global `Campaign[] campaigns` array with a
 * sequential index. Solana has no shared mutable array like that — each
 * campaign is its own account (a PDA seeded by creator + a client-chosen
 * campaign_id), so there's nothing to "count" on-chain. "list my
 * campaigns" (via getProgramAccounts filtered by the creator field) is the
 * closest real equivalent, and is what create_campaign's result gives you
 * the address for anyway.
 */

'use client'

import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'

import { getProgram } from '@/lib/solana'
import { display, formatDate, formatToken } from '@/lib/format'

// ─── Component ────────────────────────────────────────────────────────────────
export function ReadFunctions() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  // Input fields
  const [campaignAddr, setCampaignAddr] = useState('')
  const [contribCampaignAddr, setContribCampaignAddr] = useState('')

  // Result strings shown below each function
  const [campaignResult, setCampaignResult] = useState('')
  const [contribsResult, setContribsResult] = useState('')
  const [myCampaignsResult, setMyCampaignsResult] = useState('')

  // ── Generic read helper ─────────────────────────────────────────────────
  async function callRead(setResult: (s: string) => void, fn: () => Promise<unknown>) {
    setResult('⏳ calling...')
    try {
      const data = await fn()
      setResult(display(data))
    } catch (err: unknown) {
      const e = err as { message?: string }
      setResult('❌ ' + (e.message ?? String(err)))
    }
  }

  function requireProgram() {
    if (!wallet) throw new Error('Wallet not connected')
    return getProgram(wallet, connection)
  }

  // ── getCampaign(address) ─────────────────────────────────────────────────
  // Fetches a single Campaign account by its PDA address (shown after
  // create_campaign, or from "list my campaigns" below).
  async function handleGetCampaign() {
    await callRead(setCampaignResult, async () => {
      const program = requireProgram()
      const pda = new PublicKey(campaignAddr.trim())
      const c = await program.account.campaign.fetch(pda)
      return {
        address: pda.toBase58(),
        creator: c.creator.toBase58(),
        campaignId: c.campaignId.toString(),
        title: c.title as string,
        description: c.description as string,
        imageUrl: c.imageUrl as string,
        tokenMint: c.tokenMint.toBase58(),
        goal: formatToken(c.goal),
        raised: formatToken(c.raised),
        deadline: formatDate(c.deadline),
        withdrawn: c.withdrawn as boolean,
        contributorsCount: c.contributorsCount.toString(),
      }
    })
  }

  // ── getContributions(campaignAddress) ────────────────────────────────────
  // Every Contribution PDA is seeded ["contribution", campaign, contributor]
  // - there's no array to index into, so we scan program accounts for every
  // Contribution whose `campaign` field (the first 32 bytes right after the
  // 8-byte Anchor discriminator) matches this campaign's address.
  async function handleGetContributions() {
    await callRead(setContribsResult, async () => {
      const program = requireProgram()
      const campaignPda = new PublicKey(contribCampaignAddr.trim())
      const discFilter = program.coder.accounts.memcmp('contribution')

      const accounts = await connection.getProgramAccounts(program.programId, {
        filters: [
          { memcmp: { offset: 0, bytes: discFilter.bytes } },
          { memcmp: { offset: 8, bytes: campaignPda.toBase58() } }, // `campaign` field
        ],
      })

      return accounts.map(({ pubkey, account }) => {
        const c = program.coder.accounts.decode('contribution', account.data)
        return {
          address: pubkey.toBase58(),
          contributor: c.contributor.toBase58(),
          amount: formatToken(c.amount),
          lastContributedAt: formatDate(c.lastContributedAt),
          refunded: c.refunded as boolean,
        }
      })
    })
  }

  // ── listMyCampaigns() ─────────────────────────────────────────────────────
  // Closest Solana equivalent of the EVM version's getCampaignCount() +
  // iterating every id: scan for every Campaign whose `creator` field
  // matches the connected wallet.
  async function handleListMyCampaigns() {
    await callRead(setMyCampaignsResult, async () => {
      const program = requireProgram()
      if (!wallet) throw new Error('Wallet not connected')
      const discFilter = program.coder.accounts.memcmp('campaign')

      const accounts = await connection.getProgramAccounts(program.programId, {
        filters: [
          { memcmp: { offset: 0, bytes: discFilter.bytes } },
          { memcmp: { offset: 8, bytes: wallet.publicKey.toBase58() } }, // `creator` field
        ],
      })

      return accounts.map(({ pubkey, account }) => {
        const c = program.coder.accounts.decode('campaign', account.data)
        return {
          address: pubkey.toBase58(),
          campaignId: c.campaignId.toString(),
          title: c.title as string,
          goal: formatToken(c.goal),
          raised: formatToken(c.raised),
          withdrawn: c.withdrawn as boolean,
        }
      })
    })
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  const inputStyle = 'border border-border bg-background text-foreground rounded px-2 py-1 text-xs font-mono'
  const btnStyle   = 'px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-mono hover:opacity-80 cursor-pointer'
  const resultBox  = 'mt-2 text-xs font-mono text-green-400 break-all whitespace-pre-wrap bg-black/20 rounded p-2'
  const fnLabel    = 'text-xs font-mono font-bold text-foreground'
  const row        = 'flex flex-wrap gap-2 items-center'

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <section className="border border-border rounded-lg p-4 space-y-5">

      {/* Header */}
      <div className="text-xs text-muted-foreground uppercase tracking-widest">
        READ — no fee, no signature needed
      </div>

      {/* ── listMyCampaigns() ───────────────────────────────────────────── */}
      <div>
        <div className={row}>
          <span className={fnLabel}>listMyCampaigns()</span>
          <button className={btnStyle} onClick={handleListMyCampaigns}>call</button>
        </div>
        {myCampaignsResult && <div className={resultBox}>{myCampaignsResult}</div>}
      </div>

      {/* ── getCampaign(address) ────────────────────────────────────────── */}
      <div>
        <div className={row}>
          <span className={fnLabel}>getCampaign(</span>
          <input
            className={inputStyle}
            style={{ width: 320 }}
            placeholder="campaign PDA address"
            value={campaignAddr}
            onChange={e => setCampaignAddr(e.target.value)}
          />
          <span className={fnLabel}>)</span>
          <button className={btnStyle} onClick={handleGetCampaign}>call</button>
        </div>
        {campaignResult && <div className={resultBox}>{campaignResult}</div>}
      </div>

      {/* ── getContributions(campaignAddress) ───────────────────────────── */}
      <div>
        <div className={row}>
          <span className={fnLabel}>getContributions(</span>
          <input
            className={inputStyle}
            style={{ width: 320 }}
            placeholder="campaign PDA address"
            value={contribCampaignAddr}
            onChange={e => setContribCampaignAddr(e.target.value)}
          />
          <span className={fnLabel}>)</span>
          <button className={btnStyle} onClick={handleGetContributions}>call</button>
        </div>
        {contribsResult && <div className={resultBox}>{contribsResult}</div>}
      </div>

    </section>
  )
}
