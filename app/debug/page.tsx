import { WalletConnect } from '@/components/WalletConnect'

/**
 * Advanced / raw program console - the original low-level Read/Write panel
 * (direct instruction calls, raw PDA address inputs). Kept around for
 * debugging the IDL/program directly; the main app (/, /campaigns/*) is the
 * intended day-to-day UI.
 */
export default function DebugPage() {
  return (
    <main className="py-6">
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <h1 className="text-xl font-bold text-foreground">Advanced Console</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Raw instruction calls against the program, for debugging. See{' '}
          <a href="/" className="underline hover:text-foreground">
            the main app
          </a>{' '}
          for the normal campaign UI.
        </p>
      </div>
      <WalletConnect />
    </main>
  )
}
