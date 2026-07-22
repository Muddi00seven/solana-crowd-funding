import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/Navbar'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

// ssr: false prevents the Solana wallet adapters from touching
// window/indexedDB during server render
const Providers = dynamic(
  () => import('@/components/Providers').then((mod) => mod.Providers),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'ChainFund — Solana Crowdfunding',
  description: 'Transparent, non-custodial crowdfunding on Solana devnet',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans bg-background text-foreground antialiased`}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
