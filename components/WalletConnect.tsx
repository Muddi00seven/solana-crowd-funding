/**
 * components/WalletConnect.tsx
 *
 * The root component — it does three things:
 *   1. Shows a "Connect Wallet" button when no wallet is connected.
 *   2. Once connected, shows the wallet address + SOL balance.
 *   3. Renders the READ and WRITE program panels below.
 *
 * Solana wallet-adapter hooks used here:
 *   useWallet()        → publicKey, connected, disconnect()
 *   useWalletModal()   → setVisible(true) opens the wallet selection modal
 *   useConnection()    → the RPC Connection (from ConnectionProvider)
 *
 * There's no EIP-1193-equivalent "raw provider" to pass down here - every
 * Solana wallet adapter exposes the same signTransaction()/publicKey shape
 * directly via useWallet(), so ReadFunctions/WriteFunctions just call the
 * hooks themselves instead of receiving a provider prop.
 */

'use client'

import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

import { PROGRAM_ID } from '@/lib/solana'
import { ReadFunctions } from '@/components/contract/ReadFunctions'
import { WriteFunctions } from '@/components/contract/WriteFunctions'

export function WalletConnect() {
  const { connection } = useConnection()
  const { publicKey, connected, disconnect } = useWallet()
  const { setVisible } = useWalletModal()

  const [balance, setBalance] = useState<string | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  // ── Fetch SOL balance whenever wallet connects or address changes ──────
  useEffect(() => {
    if (!connected || !publicKey) {
      setBalance(null)
      return
    }

    let cancelled = false

    async function fetchBalance() {
      setLoadingBalance(true)
      try {
        const lamports = await connection.getBalance(publicKey!)
        if (!cancelled) setBalance((lamports / 1e9).toFixed(4))
      } catch {
        if (!cancelled) setBalance('—')
      } finally {
        if (!cancelled) setLoadingBalance(false)
      }
    }

    fetchBalance()
    return () => {
      cancelled = true
    }
  }, [connected, publicKey, connection])

  // Shorten address for display: "9Phw93PE...smwX"
  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}`
    : ''

  // ── Not connected → show connect button centered on screen ───────────
  if (!connected || !publicKey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <button
          onClick={() => setVisible(true)}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  // ── Connected → show wallet info + program panels ────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 p-4 font-mono">

      {/* Wallet header — clicking disconnects (wallet-adapter has no built-in "account view" modal) */}
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
        title="Click to disconnect"
      >
        {loadingBalance ? '...' : `${balance} SOL · ${shortAddress}`}
      </button>

      {/* Show which program we're interacting with */}
      <div className="text-xs text-muted-foreground">
        program: <span className="text-foreground">{PROGRAM_ID.toBase58()}</span>
      </div>

      {/* READ functions (view only — no fee, no signature) */}
      <ReadFunctions />

      {/* WRITE functions (state-changing — needs wallet signature + fees) */}
      <WriteFunctions />

    </div>
  )
}
