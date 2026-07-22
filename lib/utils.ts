import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BN } from '@coral-xyz/anchor'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return ''
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

// Every on-chain amount/timestamp here is an Anchor BN (u64/i64), not a
// native bigint - these accept either so callers don't have to convert.
function toBigInt(value: BN | bigint | number | string): bigint {
  if (typeof value === 'bigint') return value
  if (BN.isBN(value)) return BigInt(value.toString())
  return BigInt(Math.trunc(Number(value)))
}

export function getProgress(raised: BN | bigint | number, goal: BN | bigint | number): number {
  const r = toBigInt(raised)
  const g = toBigInt(goal)
  if (g === 0n) return 0
  const pct = Number((r * 100n) / g)
  return Math.min(pct, 100)
}

export function getDaysLeft(deadline: BN | bigint | number): number {
  const now = BigInt(Math.floor(Date.now() / 1000))
  const d = toBigInt(deadline)
  if (d <= now) return 0
  return Number((d - now) / 86400n)
}

export function timeAgo(timestamp: BN | bigint | number): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const seconds = Number(BigInt(Math.floor(Date.now() / 1000)) - toBigInt(timestamp))
  if (seconds < 60) return rtf.format(-seconds, 'second')
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), 'minute')
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), 'hour')
  return rtf.format(-Math.floor(seconds / 86400), 'day')
}

export function isValidTokenAmount(amount: string): boolean {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0 && num <= 100000
}
