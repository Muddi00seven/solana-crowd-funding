'use client'

/**
 * components/TransactionOverlay.tsx
 *
 * Full-screen "signing / confirming" overlay, driven entirely by
 * store/transactionStore.ts - no prop drilling needed. Rendered once in
 * Providers.tsx so it appears above whichever screen triggered a write.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, ExternalLink } from 'lucide-react'
import { useTransactionStore } from '@/store/transactionStore'
import { getTxUrl } from '@/lib/solana'
import { truncateAddress } from '@/lib/utils'

export function TransactionOverlay() {
  const { isPending, message, txSignature } = useTransactionStore()

  return (
    <AnimatePresence>
      {isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border shadow-2xl max-w-sm w-full mx-4"
          >
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Transaction in progress</h3>
            <p className="text-sm text-muted-foreground mb-4">{message || 'Please wait...'}</p>

            {txSignature && (
              <a
                href={getTxUrl(txSignature)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-mono text-accent hover:text-accent/80 transition-colors bg-muted/50 px-3 py-2 rounded-lg border border-border w-full justify-center"
              >
                <span>{truncateAddress(txSignature, 10, 8)}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
