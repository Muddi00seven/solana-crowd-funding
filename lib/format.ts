/**
 * lib/format.ts
 *
 * Helper functions to convert raw on-chain data into human-readable values.
 * Same purpose as the original EVM version, adapted for Anchor's BN
 * (big-number) type instead of native BigInt, and a configurable decimals
 * count (TOKEN_DECIMALS, set in lib/solana.ts / .env.local).
 */

import { BN } from '@coral-xyz/anchor'
import { TOKEN_DECIMALS } from './solana'

function toBN(value: BN | bigint | number | string): BN {
  if (BN.isBN(value)) return value
  return new BN(value.toString())
}

// ─── Token amount formatting ───────────────────────────────────────────────

/** Convert a raw on-chain token amount (BN) → readable string, e.g. "10.000000 tokens" */
export function formatToken(raw: BN | bigint | number | string): string {
  const bn = toBN(raw)
  const divisor = new BN(10).pow(new BN(TOKEN_DECIMALS))
  const whole = bn.div(divisor)
  const frac = bn.mod(divisor)
  const fracStr = frac.toString().padStart(TOKEN_DECIMALS, '0')
  return `${whole.toString()}.${fracStr} tokens`
}

/** Convert a human-readable amount ("10", "0.5") → raw BN for the program. */
export function toRawToken(humanAmount: string): BN {
  const [wholePartRaw, fracPartRaw = ''] = humanAmount.trim().split('.')
  const wholePart = wholePartRaw || '0'
  const fracPart = (fracPartRaw + '0'.repeat(TOKEN_DECIMALS)).slice(0, TOKEN_DECIMALS)
  const scale = new BN(10).pow(new BN(TOKEN_DECIMALS))
  return new BN(wholePart).mul(scale).add(new BN(fracPart || '0'))
}

// ─── Timestamp formatting ───────────────────────────────────────────────────

/** Convert a Unix timestamp (seconds, BN or number) → readable date string. */
export function formatDate(unixSeconds: BN | bigint | number | string): string {
  const n = BN.isBN(unixSeconds) ? unixSeconds.toNumber() : Number(unixSeconds)
  return new Date(n * 1000).toLocaleString()
}

// ─── Display helper ──────────────────────────────────────────────────────────

/** Pretty-print any value for the result boxes, handling Anchor's BN. */
export function display(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, val) => (BN.isBN(val) ? val.toString() : val),
    2
  )
}
