'use client'

/**
 * components/Providers.tsx
 *
 * Solana wallet-adapter equivalent of the old Reown AppKit setup.
 * Rendered via dynamic(..., { ssr: false }) in app/layout.tsx, same as
 * before - the wallet adapters touch window/indexedDB and must never run
 * during server render.
 *
 * We pass wallets={[]}: modern wallets (Phantom, Solflare, Backpack, ...)
 * register themselves through the Wallet Standard automatically, so we
 * don't need to list individual @solana/wallet-adapter-wallets packages -
 * whatever the user has installed in their browser just shows up in the
 * connect modal.
 */

import { useMemo } from 'react'
import { Buffer } from 'buffer'
import { Toaster } from 'sonner'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'

import { RPC_URL } from '@/lib/solana'
import { TransactionOverlay } from '@/components/TransactionOverlay'

import '@solana/wallet-adapter-react-ui/styles.css'

// @solana/web3.js expects a global `Buffer` - Next.js/webpack doesn't
// polyfill Node globals in the browser by default.
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer
}

export function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [], [])

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
          <TransactionOverlay />
          <Toaster theme="dark" position="bottom-right" richColors closeButton />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
