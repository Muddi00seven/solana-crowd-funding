/**
 * store/transactionStore.ts
 *
 * Tiny global store (zustand) that drives two things across the whole app:
 *   1. A full-screen "transaction in progress" overlay (TransactionOverlay.tsx)
 *      - any write hook calls setPending() before/after signing.
 *   2. A `refreshTrigger` counter that every read hook (useCampaigns,
 *      useCampaign, useContributions) subscribes to - bumping it via
 *      triggerRefresh() after a successful write makes every list/detail
 *      view on screen refetch automatically, with no manual "reload" button.
 */

import { create } from 'zustand'

interface TransactionState {
  isPending: boolean
  message: string
  txSignature: string | null
  refreshTrigger: number
  setPending: (isPending: boolean, message?: string, txSignature?: string | null) => void
  triggerRefresh: () => void
}

export const useTransactionStore = create<TransactionState>((set) => ({
  isPending: false,
  message: '',
  txSignature: null,
  refreshTrigger: 0,
  setPending: (isPending, message = '', txSignature = null) =>
    set({ isPending, message, txSignature: isPending ? txSignature : null }),
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}))
