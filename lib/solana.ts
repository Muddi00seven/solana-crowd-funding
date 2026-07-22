/**
 * lib/solana.ts
 *
 * Solana / Anchor equivalent of the old lib/contract.ts (EVM+ethers).
 *
 * Talks to the `crowdfunding` Anchor program deployed on devnet:
 *   6hafcYNa34it4syjPPy8yuQW5LfCmcxhm3D78h2qBA5r
 * (see ../solana-rust/02-crowdfunding-spl in this same machine for the
 * Rust source + deploy scripts this client is wired against).
 *
 * Key differences from the Solidity/ethers version this replaces:
 * - No ERC20 approve() step: SPL token transfers are authorized directly
 *   by the owner's signature (see contribute() in WriteFunctions.tsx).
 * - No global campaign counter / campaigns[] array: every campaign is its
 *   own PDA seeded by (creator, campaign_id), where campaign_id is picked
 *   client-side (we use Date.now()). "getCampaignCount()" has no Solana
 *   equivalent, so ReadFunctions.tsx offers "list my campaigns" instead
 *   (a getProgramAccounts scan filtered by creator).
 */

import { AnchorProvider, BN, Program, type Wallet } from '@coral-xyz/anchor'
import type { AnchorWallet } from '@solana/wallet-adapter-react'
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  clusterApiUrl,
} from '@solana/web3.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'

import { IDL, type Crowdfunding } from './idl/crowdfunding'

export { IDL }
export type CrowdfundingProgram = Program<Crowdfunding>

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? '6hafcYNa34it4syjPPy8yuQW5LfCmcxhm3D78h2qBA5r'
)

// Reuses the SPL token minted in ../01-spl-token-deploy of the solana-rust
// lecture series - set NEXT_PUBLIC_TOKEN_MINT in .env.local to point at a
// different mint (e.g. devnet USDC) instead.
export const TOKEN_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_TOKEN_MINT ?? 'Chtf3dLtuCaBP8mNcC5FcSwA1fvBTZbnPY4xbsuriHMb'
)

export const TOKEN_DECIMALS = parseInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? '6', 10)

export const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl('devnet')

// devnet's public RPC rate-limits aggressively under load (we hit this
// directly deploying the program) - swap in a private RPC (Helius, Ankr,
// etc.) via NEXT_PUBLIC_SOLANA_RPC_URL if reads/writes start failing with
// 429s.
export const EXPLORER_CLUSTER = process.env.NEXT_PUBLIC_EXPLORER_CLUSTER ?? 'devnet'

export { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, SystemProgram, SYSVAR_RENT_PUBKEY }

export function getReadConnection() {
  return new Connection(RPC_URL, 'confirmed')
}

export function getAddressUrl(address: string) {
  return `https://explorer.solana.com/address/${address}?cluster=${EXPLORER_CLUSTER}`
}

export function getTxUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=${EXPLORER_CLUSTER}`
}

/**
 * Builds an Anchor Program client bound to the connected wallet.
 *
 * `useAnchorWallet()` (wallet-adapter-react) returns an `AnchorWallet`
 * ({publicKey, signTransaction, signAllTransactions}) - real browser
 * wallets never expose a raw Keypair, so there's no `payer` field. Anchor's
 * own `Wallet` type still declares one (a leftover from its Node.js-wallet
 * roots), but AnchorProvider never actually touches `.payer` for anything
 * this app does (.rpc()/.instruction()/.fetch() only need
 * signTransaction), so the cast below is safe.
 */
export function getProgram(wallet: AnchorWallet, connection: Connection): CrowdfundingProgram {
  const provider = new AnchorProvider(connection, wallet as unknown as Wallet, {
    commitment: 'confirmed',
  })
  return new Program<Crowdfunding>(IDL, provider)
}

export function getContributorTokenAccount(mint: PublicKey, owner: PublicKey) {
  return getAssociatedTokenAddressSync(mint, owner)
}

// ─── PDA helpers ──────────────────────────────────────────────────────────
// These MUST mirror the exact seeds used in
// ../solana-rust/02-crowdfunding-spl/programs/crowdfunding/src/lib.rs

export function deriveCampaignPda(creator: PublicKey, campaignId: BN | number | string) {
  const idBn = BN.isBN(campaignId) ? campaignId : new BN(campaignId.toString())
  const idBuf = idBn.toArrayLike(Buffer, 'le', 8)
  return PublicKey.findProgramAddressSync(
    [Buffer.from('campaign'), creator.toBuffer(), idBuf],
    PROGRAM_ID
  )
}

export function deriveVaultPda(campaign: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from('vault'), campaign.toBuffer()], PROGRAM_ID)
}

export function deriveContributionPda(campaign: PublicKey, contributor: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('contribution'), campaign.toBuffer(), contributor.toBuffer()],
    PROGRAM_ID
  )
}
