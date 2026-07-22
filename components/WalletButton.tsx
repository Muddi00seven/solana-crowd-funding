'use client'

/**
 * components/WalletButton.tsx
 *
 * Compact wallet chip for the Navbar - replaces the old full-page "connect
 * or nothing" gate in WalletConnect.tsx (still kept as-is for the /debug
 * console). Not connected -> "Connect Wallet" button. Connected -> a small
 * popover with the balance/address, an Explorer link, and Disconnect, so a
 * stray click can't disconnect you by accident the way the old single
 * click-to-disconnect chip could.
 */

import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { ExternalLink, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getAddressUrl } from '@/lib/solana'
import { truncateAddress } from '@/lib/utils'

export function WalletButton() {
  const { connection } = useConnection()
  const { publicKey, connected, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const [balance, setBalance] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalance(null)
      return
    }
    let cancelled = false
    connection
      .getBalance(publicKey)
      .then((lamports) => {
        if (!cancelled) setBalance((lamports / 1e9).toFixed(4))
      })
      .catch(() => {
        if (!cancelled) setBalance('—')
      })
    return () => {
      cancelled = true
    }
  }, [connected, publicKey, connection])

  if (!connected || !publicKey) {
    return (
      <Button size="sm" onClick={() => setVisible(true)}>
        Connect Wallet
      </Button>
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" className="font-mono" onClick={() => setOpen(true)}>
        {balance ?? '...'} SOL · {truncateAddress(publicKey.toBase58())}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono text-base break-all">{publicKey.toBase58()}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Balance: {balance ?? '...'} SOL (devnet)</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" asChild>
              <a href={getAddressUrl(publicKey.toBase58())} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                View on Explorer
              </a>
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                disconnect()
                setOpen(false)
              }}
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
