import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return ''
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

export function getProgress(raised: bigint, goal: bigint): number {
  if (goal === 0n) return 0
  const pct = Number((raised * 100n) / goal)
  return Math.min(pct, 100)
}

export function getDaysLeft(deadline: bigint): number {
  const now = BigInt(Math.floor(Date.now() / 1000))
  if (deadline <= now) return 0
  return Number((deadline - now) / 86400n)
}

export function timeAgo(timestamp: bigint): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const seconds = Number(BigInt(Math.floor(Date.now() / 1000)) - timestamp)
  if (seconds < 60) return rtf.format(-seconds, 'second')
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), 'minute')
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), 'hour')
  return rtf.format(-Math.floor(seconds / 86400), 'day')
}

export function isValidTokenAmount(amount: string): boolean {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0 && num <= 100000
}
