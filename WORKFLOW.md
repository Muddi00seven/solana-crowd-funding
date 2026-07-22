# ChainFund — Complete Rebuild Workflow

> ⚠️ **OUTDATED — describes the retired Ethereum/Solidity/ethers.js build of this app.**
> The project has since been fully migrated to Solana: the contract is now the Anchor program
> in `../solana-rust/02-crowdfunding-spl` (deployed on devnet), the frontend uses
> `@coral-xyz/anchor` + `@solana/wallet-adapter-react` instead of ethers/AppKit, and the actual
> current file layout is `lib/solana.ts` + `lib/idl/crowdfunding.ts` + `lib/format.ts` +
> `components/{Providers,WalletConnect}.tsx` + `components/contract/{Read,Write}Functions.tsx` —
> not the `hooks/`, `store/`, and per-feature `components/` tree described below. See
> `README.md` for a full, accurate description of the current Solana architecture, the Rust
> program's instructions/accounts, and the end-to-end flow. Everything below this notice is
> kept only as historical reference for the pre-migration EVM rebuild and has not been updated.

> Provide this file to Claude along with your `.env` values and the existing web3 libraries.
> Claude will recreate the exact same app from scratch.

---

## What You Provide

- This file
- `.env.local` with values filled in (see Environment Variables section)
- Installed packages: `@reown/appkit`, `@reown/appkit-adapter-ethers`, `ethers`, `zustand`, `sonner`, `framer-motion`, `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`
- Shadcn/UI already initialized with components: `button`, `card`, `badge`, `skeleton`, `dialog`, `input`, `label`, `progress`, `tooltip`

---

## Tech Stack

```
Framework:     Next.js 14 — App Router only (no pages/)
Language:      TypeScript strict
Styling:       Tailwind CSS v3
UI:            Shadcn/UI
Animations:    Framer Motion
Wallet:        @reown/appkit + @reown/appkit-adapter-ethers (EthersAdapter)
Web3:          ethers v6 (BrowserProvider, Contract, parseUnits, formatUnits)
Forms:         React Hook Form + Zod
Toasts:        Sonner
State:         Zustand (global tx state only)
Icons:         Lucide React
Fonts:         Space Grotesk (sans) + JetBrains Mono (mono) from next/font/google
```

---

## Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # Reown/WalletConnect Cloud project ID
NEXT_PUBLIC_CONTRACT_ADDRESS=           # CrowdFunding contract address (leave empty for mock mode)
NEXT_PUBLIC_USDT_ADDRESS=               # USDT ERC-20 token contract address
NEXT_PUBLIC_CHAIN_ID=11155111           # 11155111 = Sepolia
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.org
NEXT_PUBLIC_EXPLORER_URL=https://sepolia.etherscan.io
```

---

## Design System

### CSS Variables (add to `globals.css` inside `:root`)

```css
:root {
  --background: #0a0a0f;
  --foreground: #f0f0ff;
  --card: #12121a;
  --card-foreground: #e8e8ff;
  --primary: #6366f1;
  --primary-foreground: #fff;
  --accent: #22d3ee;
  --accent-foreground: #0a0a0f;
  --muted: #1e1e2e;
  --muted-foreground: #7070a0;
  --border: #2a2a3e;
  --success: #22c55e;
  --warning: #f59e0b;
  --destructive: #ef4444;
  --destructive-foreground: #fff;
  --radius: 0.75rem;
}
```

---

## Folder Structure

```
app/
  layout.tsx
  page.tsx                          ← Homepage with campaign grid
  campaigns/
    [id]/page.tsx                   ← Campaign detail
    create/page.tsx                 ← Create campaign form
    mine/page.tsx                   ← My campaigns

components/
  Providers.tsx                     ← Client-only shell (AppKit init + Toaster + LoadingScreen)
  Navbar.tsx
  PageWrapper.tsx
  TransactionLoadingScreen.tsx
  wallet/
    ConnectButton.tsx
    WalletStatus.tsx
  campaigns/
    CampaignCard.tsx
    CampaignGrid.tsx
    CampaignDetail.tsx
    CampaignSkeleton.tsx
    ProgressBar.tsx
    CreateCampaignForm.tsx
  contribute/
    ContributeForm.tsx
    ContributeButton.tsx
  transactions/
    TransactionHistory.tsx
    TransactionRow.tsx
  withdraw/
    WithdrawButton.tsx
  contract/
    ContractStatus.tsx

hooks/
  useWeb3.ts
  useCampaigns.ts
  useCampaign.ts
  useContribute.ts
  useCreateCampaign.ts
  useWithdraw.ts
  useTransactions.ts
  useTokenBalance.ts

lib/
  appkit.ts                         ← createAppKit() called once, client-only
  contract.ts                       ← ABIs, addresses, read provider, contract factories
  authorizedSigner.ts               ← Robust signer helper (handles Opera/MetaMask 4100)
  utils.ts
  validations.ts
  mockData.ts

store/
  transactionStore.ts               ← Zustand: isPending, message, txHash, refreshTrigger

types/
  index.ts
```

---

## Build Order

Build in this exact order — later files depend on earlier ones.

```
1.  types/index.ts
2.  lib/utils.ts
3.  lib/validations.ts
4.  lib/contract.ts
5.  lib/mockData.ts
6.  lib/appkit.ts
7.  lib/authorizedSigner.ts
8.  store/transactionStore.ts
9.  hooks/useWeb3.ts
10. hooks/useCampaigns.ts
11. hooks/useCampaign.ts
12. hooks/useTransactions.ts
13. hooks/useTokenBalance.ts
14. hooks/useContribute.ts
15. hooks/useCreateCampaign.ts
16. hooks/useWithdraw.ts
17. components/TransactionLoadingScreen.tsx
18. components/Providers.tsx
19. app/layout.tsx
20. components/PageWrapper.tsx
21. components/contract/ContractStatus.tsx
22. components/wallet/WalletStatus.tsx
23. components/wallet/ConnectButton.tsx
24. components/Navbar.tsx
25. components/campaigns/CampaignSkeleton.tsx
26. components/campaigns/ProgressBar.tsx
27. components/campaigns/CampaignCard.tsx
28. components/campaigns/CampaignGrid.tsx
29. components/transactions/TransactionRow.tsx
30. components/transactions/TransactionHistory.tsx
31. components/contribute/ContributeButton.tsx
32. components/contribute/ContributeForm.tsx
33. components/withdraw/WithdrawButton.tsx
34. components/campaigns/CampaignDetail.tsx
35. components/campaigns/CreateCampaignForm.tsx
36. app/page.tsx
37. app/campaigns/[id]/page.tsx
38. app/campaigns/create/page.tsx
39. app/campaigns/mine/page.tsx
```

---

## File Implementations

### `types/index.ts`

```typescript
export interface Campaign {
  id: bigint
  creator: string
  title: string
  description: string
  goal: bigint          // USDT in 6-decimal units
  raised: bigint        // USDT in 6-decimal units
  deadline: bigint      // Unix timestamp
  withdrawn: boolean
  contributorsCount: bigint
}

export interface Contribution {
  contributor: string
  amount: bigint        // USDT in 6-decimal units
  txHash: string
  timestamp: bigint
}
```

---

### `lib/utils.ts`

```typescript
import { formatUnits } from 'ethers'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return ''
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

// USDT has 6 decimals
export function formatUsdt(amount: bigint, decimals = 2): string {
  return parseFloat(formatUnits(amount, 6)).toFixed(decimals)
}

export function getProgress(raised: bigint, goal: bigint): number {
  if (goal === 0n) return 0
  const pct = Number(raised * 100n / goal)
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

export function isValidUsdtAmount(amount: string): boolean {
  const num = parseFloat(amount)
  return !isNaN(num) && num >= 1 && num <= 100000
}
```

---

### `lib/validations.ts`

```typescript
import { z } from 'zod'

export const contributeSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)), { message: "Enter a valid number" })
    .refine((val) => parseFloat(val) >= 1, { message: "Minimum contribution is 1 USDT" })
    .refine((val) => parseFloat(val) <= 100000, { message: "Maximum 100,000 USDT per transaction" }),
})

export const createCampaignSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title is too long (max 100 chars)"),
  description: z.string().min(20, "Please provide more detail (min 20 chars)").max(1000, "Description is too long (max 1000 chars)"),
  goalUsdt: z
    .string()
    .refine((val) => parseFloat(val) >= 1, { message: "Goal must be at least 1 USDT" })
    .refine((val) => parseFloat(val) <= 10000000, { message: "Goal cannot exceed 10,000,000 USDT" }),
  durationDays: z.number().min(1, "Campaign must run for at least 1 day").max(365, "Maximum duration is 365 days"),
})

export type ContributeFormData = z.infer<typeof contributeSchema>
export type CreateCampaignFormData = z.infer<typeof createCampaignSchema>
```

---

### `lib/contract.ts`

```typescript
import { JsonRpcProvider, Contract } from 'ethers'

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? ''
export const USDT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS ?? ''
export const SUPPORTED_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? '11155111')
export const USDT_DECIMALS = 6

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://rpc.sepolia.org'
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL ?? 'https://sepolia.etherscan.io'

export function getReadProvider() {
  return new JsonRpcProvider(RPC_URL)
}

export function getTxUrl(hash: string) {
  return `${EXPLORER_URL}/tx/${hash}`
}

export function getAddressUrl(address: string) {
  return `${EXPLORER_URL}/address/${address}`
}

export const USDT_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function faucet()',
] as const

export const CONTRACT_ABI = [
  'function getCampaignCount() view returns (uint256)',
  'function getCampaign(uint256 id) view returns (uint256 id, address creator, string title, string description, uint256 goal, uint256 raised, uint256 deadline, bool withdrawn, uint256 contributorsCount)',
  'function createCampaign(string title, string description, uint256 goal, uint256 durationDays)',
  'function contribute(uint256 campaignId, uint256 amount)',
  'function withdraw(uint256 campaignId)',
  'function getContributions(uint256 campaignId) view returns (tuple(address contributor, uint256 amount, bytes32 txHash, uint256 timestamp)[])',
] as const

export function getCrowdFundingContract(signerOrProvider: ConstructorParameters<typeof Contract>[2]) {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider)
}

export function getUsdtContract(signerOrProvider: ConstructorParameters<typeof Contract>[2]) {
  return new Contract(USDT_TOKEN_ADDRESS, USDT_ABI, signerOrProvider)
}
```

---

### `lib/mockData.ts`

```typescript
import type { Campaign } from '@/types'
import { parseUnits } from 'ethers'

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 0n,
    creator: '0x7aF3b12c9d8E4F5a6B7C8D9E0F1a2B3c4D5e6F7',
    title: 'Solar Energy Project',
    description: 'Installing solar panels in remote areas to provide clean energy access to underserved communities...',
    goal: parseUnits('10000', 6),
    raised: parseUnits('6400', 6),
    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 12),
    withdrawn: false,
    contributorsCount: 47n,
  },
  {
    id: 1n,
    creator: '0x91BcA2d3e4F5a6B7C8D9E0F1a2B3c4D5e6F7a8',
    title: 'Medical Aid DAO',
    description: 'Funding medical treatment and medicine for patients who cannot afford healthcare...',
    goal: parseUnits('5000', 6),
    raised: parseUnits('2100', 6),
    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 5),
    withdrawn: false,
    contributorsCount: 23n,
  },
  {
    id: 2n,
    creator: '0xB3Cd4E5f6A7B8c9D0e1F2a3B4c5D6e7F8a9B0c',
    title: 'Education Fund',
    description: 'Covering school fees and educational materials for children from low-income families...',
    goal: parseUnits('8000', 6),
    raised: parseUnits('8200', 6),
    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 3),
    withdrawn: false,
    contributorsCount: 89n,
  },
]
```

---

### `lib/appkit.ts`

> IMPORTANT: This file must be `'use client'` and imported only inside `Providers.tsx` to avoid SSR errors.

```typescript
'use client'
import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { sepolia } from '@reown/appkit/networks'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''
const ethersAdapter = new EthersAdapter()

createAppKit({
  adapters: [ethersAdapter],
  networks: [sepolia],
  defaultNetwork: sepolia,
  projectId,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: false,
  enableWalletConnect: false,
  allWallets: 'HIDE',
  metadata: {
    name: 'ChainFund',
    description: 'Decentralized Crowdfunding on Blockchain',
    url: 'http://localhost:3000',
    icons: [],
  },
  features: { analytics: false, allWallets: false, email: false, socials: [] },
  themeMode: 'dark',
})
```

---

### `lib/authorizedSigner.ts`

> Critical utility — prevents MetaMask error 4100 (unauthorized) on Opera and Chromium-based browsers.
> Always use this instead of `new BrowserProvider(walletProvider).getSigner()` directly.

```typescript
import { BrowserProvider } from 'ethers'
import type { Eip1193Provider } from 'ethers'

type SignerContext = {
  provider: BrowserProvider
  signer: Awaited<ReturnType<BrowserProvider['getSigner']>>
  signerAddress: string
}

export async function getAuthorizedSigner(
  walletProvider: Eip1193Provider,
  expectedAddress?: string,
): Promise<SignerContext> {
  const provider = new BrowserProvider(walletProvider)
  const normalizedExpected = expectedAddress?.toLowerCase()

  // Try eth_accounts first (silent), fall back to eth_requestAccounts (prompts user)
  let accounts = (await walletProvider.request({ method: 'eth_accounts' })) as string[]
  if (!accounts?.length) {
    accounts = (await walletProvider.request({ method: 'eth_requestAccounts' })) as string[]
  }
  if (!accounts?.length) throw new Error('No wallet account authorized')

  let signerAddress =
    accounts.find((a) => a.toLowerCase() === normalizedExpected) ?? accounts[0]

  if (normalizedExpected && signerAddress.toLowerCase() !== normalizedExpected) {
    accounts = (await walletProvider.request({ method: 'eth_requestAccounts' })) as string[]
    signerAddress =
      accounts.find((a) => a.toLowerCase() === normalizedExpected) ?? accounts[0] ?? signerAddress
  }

  const signer = await provider.getSigner(signerAddress)
  const finalAddress = await signer.getAddress()
  if (normalizedExpected && finalAddress.toLowerCase() !== normalizedExpected) {
    throw new Error('Connected wallet account does not match selected dapp account')
  }

  return { provider, signer, signerAddress: finalAddress }
}
```

---

### `store/transactionStore.ts`

```typescript
import { create } from 'zustand'

interface TransactionState {
  isPending: boolean
  message: string
  txHash: string | null
  refreshTrigger: number
  setPending: (isPending: boolean, message?: string, txHash?: string | null) => void
  triggerRefresh: () => void
}

export const useTransactionStore = create<TransactionState>((set) => ({
  isPending: false,
  message: '',
  txHash: null,
  refreshTrigger: 0,
  setPending: (isPending, message = '', txHash = null) =>
    set({ isPending, message, txHash: isPending ? txHash : null }),
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}))
```

---

### `hooks/useWeb3.ts`

```typescript
'use client'
import { useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect, useAppKitNetwork } from '@reown/appkit/react'
import type { Eip1193Provider } from 'ethers'
import { SUPPORTED_CHAIN_ID } from '@/lib/contract'

export function useWeb3() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()
  const { walletProvider } = useAppKitProvider<Eip1193Provider>('eip155')
  const { disconnect } = useDisconnect()

  const chainId = caipNetwork
    ? Number(String(caipNetwork.id).includes(':') ? String(caipNetwork.id).split(':').pop() : caipNetwork.id)
    : undefined
  const isCorrectNetwork = chainId === SUPPORTED_CHAIN_ID

  return {
    address: address as string | undefined,
    isConnected,
    chainId,
    isCorrectNetwork,
    walletProvider,
    openModal: (options?: { view?: 'Account' | 'Connect' | 'Networks' | 'ApproveTransaction' | 'OnRampProviders' }) => open(options),
    disconnect,
  }
}
```

---

### `hooks/useCampaigns.ts`

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'
import { getReadProvider, getCrowdFundingContract, CONTRACT_ADDRESS } from '@/lib/contract'
import { MOCK_CAMPAIGNS } from '@/lib/mockData'
import type { Campaign } from '@/types'
import { useTransactionStore } from '@/store/transactionStore'

function parseCampaign(r: Record<number, unknown>): Campaign {
  return {
    id: r[0] as bigint, creator: r[1] as string, title: r[2] as string,
    description: r[3] as string, goal: r[4] as bigint, raised: r[5] as bigint,
    deadline: r[6] as bigint, withdrawn: r[7] as boolean, contributorsCount: r[8] as bigint,
  }
}

export function useCampaigns() {
  const useMock = !CONTRACT_ADDRESS
  const [campaigns, setCampaigns] = useState<Campaign[]>(useMock ? MOCK_CAMPAIGNS : [])
  const [isLoading, setIsLoading] = useState(!useMock)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCampaigns = useCallback(async () => {
    if (useMock) return
    setIsLoading(true); setIsError(false)
    try {
      const contract = getCrowdFundingContract(getReadProvider())
      const count = Number(await contract.getCampaignCount())
      if (count === 0) { setCampaigns([]); return }
      const results = await Promise.all(Array.from({ length: count }, (_, i) => contract.getCampaign(i)))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCampaigns(results.map((r: any) => parseCampaign(r)))
    } catch (e) {
      setIsError(true); setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }, [useMock])

  const refreshTrigger = useTransactionStore((state) => state.refreshTrigger)
  useEffect(() => { fetchCampaigns() }, [fetchCampaigns, refreshTrigger])

  return { campaigns, isLoading, isError, error, refetch: fetchCampaigns }
}
```

---

### `hooks/useCampaign.ts`

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'
import { getReadProvider, getCrowdFundingContract, CONTRACT_ADDRESS } from '@/lib/contract'
import { MOCK_CAMPAIGNS } from '@/lib/mockData'
import type { Campaign } from '@/types'
import { useTransactionStore } from '@/store/transactionStore'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCampaign(r: any): Campaign {
  return {
    id: r[0] as bigint, creator: r[1] as string, title: r[2] as string,
    description: r[3] as string, goal: r[4] as bigint, raised: r[5] as bigint,
    deadline: r[6] as bigint, withdrawn: r[7] as boolean, contributorsCount: r[8] as bigint,
  }
}

export function useCampaign(campaignId: bigint) {
  const useMock = !CONTRACT_ADDRESS
  const [campaign, setCampaign] = useState<Campaign | undefined>(
    useMock ? MOCK_CAMPAIGNS.find((c) => c.id === campaignId) : undefined
  )
  const [isLoading, setIsLoading] = useState(!useMock)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCampaign = useCallback(async () => {
    if (useMock) return
    setIsLoading(true); setIsError(false)
    try {
      const result = await getCrowdFundingContract(getReadProvider()).getCampaign(campaignId)
      setCampaign(parseCampaign(result))
    } catch (e) {
      setIsError(true); setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }, [useMock, campaignId])

  const refreshTrigger = useTransactionStore((state) => state.refreshTrigger)
  useEffect(() => { fetchCampaign() }, [fetchCampaign, refreshTrigger])

  return { campaign, isLoading, isError, error, refetch: fetchCampaign }
}
```

---

### `hooks/useTransactions.ts`

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'
import { getReadProvider, getCrowdFundingContract, CONTRACT_ADDRESS } from '@/lib/contract'
import type { Contribution } from '@/types'
import { useTransactionStore } from '@/store/transactionStore'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseContribution(r: any): Contribution {
  return { contributor: r[0] as string, amount: r[1] as bigint, txHash: r[2] as string, timestamp: r[3] as bigint }
}

export function useTransactions(campaignId: bigint) {
  const useMock = !CONTRACT_ADDRESS
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [isLoading, setIsLoading] = useState(!useMock)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchContributions = useCallback(async () => {
    if (useMock) { setIsLoading(false); return }
    setIsLoading(true); setIsError(false)
    try {
      const results = await getCrowdFundingContract(getReadProvider()).getContributions(campaignId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setContributions((results as any[]).map(parseContribution))
    } catch (e) {
      setIsError(true); setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }, [useMock, campaignId])

  const refreshTrigger = useTransactionStore((state) => state.refreshTrigger)
  useEffect(() => { fetchContributions() }, [fetchContributions, refreshTrigger])

  return { contributions, isLoading, isError, error, refetch: fetchContributions }
}
```

---

### `hooks/useTokenBalance.ts`

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'
import { getUsdtContract, USDT_TOKEN_ADDRESS, CONTRACT_ADDRESS, getReadProvider } from '@/lib/contract'
import { formatUsdt } from '@/lib/utils'
import { useWeb3 } from '@/hooks/useWeb3'
import { useTransactionStore } from '@/store/transactionStore'

export function useTokenBalance() {
  const { address, isConnected } = useWeb3()
  const [balance, setBalance] = useState(0n)
  const [allowance, setAllowance] = useState(0n)
  const hasToken = !!USDT_TOKEN_ADDRESS

  const fetchBalances = useCallback(async () => {
    if (!isConnected || !address || !hasToken) return
    try {
      const contract = getUsdtContract(getReadProvider())
      const [bal, allow] = await Promise.all([
        contract.balanceOf(address),
        contract.allowance(address, CONTRACT_ADDRESS),
      ])
      setBalance(bal as bigint)
      setAllowance(allow as bigint)
    } catch (e) {
      console.error('useTokenBalance:', e)
    }
  }, [address, isConnected, hasToken])

  const refreshTrigger = useTransactionStore((state) => state.refreshTrigger)
  useEffect(() => { fetchBalances() }, [fetchBalances, refreshTrigger])

  return { balance, allowance, formatted: hasToken ? formatUsdt(balance) : '—', refetch: fetchBalances }
}
```

---

### `hooks/useContribute.ts`

> Key pattern: ERC-20 requires approve + contribute (2 txns on first use).
> After `approveTx.wait(1)` (15-30s), re-authorize wallet to prevent error 4100 on Opera/MetaMask.

```typescript
'use client'
import { parseUnits } from 'ethers'
import { getCrowdFundingContract, getUsdtContract, CONTRACT_ADDRESS, getTxUrl } from '@/lib/contract'
import { useWeb3 } from '@/hooks/useWeb3'
import { toast } from 'sonner'
import { getAuthorizedSigner } from '@/lib/authorizedSigner'
import { useTransactionStore } from '@/store/transactionStore'

export function useContribute() {
  const { walletProvider, address, isConnected } = useWeb3()
  const setPending = useTransactionStore((state) => state.setPending)
  const triggerRefresh = useTransactionStore((state) => state.triggerRefresh)

  const contribute = async (campaignId: bigint, amountUsdt: string): Promise<boolean> => {
    try {
      if (!walletProvider || !address || !isConnected) return false
      setPending(true, 'Waiting for signature in wallet...')

      const { signer } = await getAuthorizedSigner(walletProvider, address)
      const amount = parseUnits(amountUsdt, 6)

      const usdtContract = getUsdtContract(signer)
      let crowdContract = getCrowdFundingContract(signer)

      // Step 1: approve if current allowance is insufficient
      const allowance = await usdtContract.allowance(address, CONTRACT_ADDRESS)
      if ((allowance as bigint) < amount) {
        setPending(true, 'Approving USDT spend allowance...')
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, amount)
        setPending(true, 'Processing USDT approval on blockchain...', approveTx.hash)
        await approveTx.wait(1)

        // Re-authorize after long wait — Opera/MetaMask returns 4100 without this
        const { signer: freshSigner } = await getAuthorizedSigner(walletProvider, address)
        crowdContract = getCrowdFundingContract(freshSigner)
        setPending(true, 'Waiting for contribution signature in wallet...')
      }

      // Step 2: contribute
      const tx = await crowdContract.contribute(campaignId, amount)
      setPending(true, 'Processing contribution on blockchain...', tx.hash)
      await tx.wait(1)

      setPending(false)
      triggerRefresh()
      toast.success('Contribution successful!', {
        description: `${amountUsdt} USDT contributed`,
        action: { label: 'View Tx', onClick: () => window.open(getTxUrl(tx.hash), '_blank') },
      })
      return true
    } catch (error: unknown) {
      setPending(false)
      const code = (error as { code?: number | string })?.code
      if (code === 4001 || code === 'ACTION_REJECTED') toast.error('Transaction cancelled')
      else if (code === 4100) toast.error('Wallet authorization lost. Reconnect and try again.')
      return false
    }
  }

  const loading = useTransactionStore((state) => state.isPending)
  return { contribute, loading }
}
```

---

### `hooks/useCreateCampaign.ts`

```typescript
'use client'
import { useState } from 'react'
import { parseUnits } from 'ethers'
import { getCrowdFundingContract, getTxUrl } from '@/lib/contract'
import { useWeb3 } from '@/hooks/useWeb3'
import { toast } from 'sonner'
import { useTransactionStore } from '@/store/transactionStore'
import type { CreateCampaignFormData } from '@/lib/validations'
import { getAuthorizedSigner } from '@/lib/authorizedSigner'

export function useCreateCampaign() {
  const { walletProvider, address, isConnected } = useWeb3()
  const [isSuccess, setIsSuccess] = useState(false)
  const setPending = useTransactionStore((state) => state.setPending)
  const triggerRefresh = useTransactionStore((state) => state.triggerRefresh)

  const createCampaign = async (data: CreateCampaignFormData): Promise<boolean> => {
    try {
      if (!walletProvider || !address || !isConnected) return false
      setPending(true, 'Waiting for signature in wallet...')

      const { signer } = await getAuthorizedSigner(walletProvider, address)
      const contract = getCrowdFundingContract(signer)

      const tx = await contract.createCampaign(
        data.title, data.description,
        parseUnits(data.goalUsdt, 6),
        BigInt(data.durationDays),
      )
      setPending(true, 'Transaction processing on blockchain...', tx.hash)
      await tx.wait(1)

      setIsSuccess(true)
      setPending(false)
      triggerRefresh()
      toast.success('Campaign created!', {
        description: 'Your campaign is now live on-chain',
        action: { label: 'View Tx', onClick: () => window.open(getTxUrl(tx.hash), '_blank') },
      })
      return true
    } catch (error: unknown) {
      setPending(false)
      const code = (error as { code?: number | string })?.code
      if (code === 4001 || code === 'ACTION_REJECTED') toast.error('Transaction cancelled')
      else if (code === 4100) toast.error('Wallet authorization lost. Reconnect and try again.')
      return false
    }
  }

  const loading = useTransactionStore((state) => state.isPending)
  return { createCampaign, loading, isSuccess }
}
```

---

### `hooks/useWithdraw.ts`

```typescript
'use client'
import { useState } from 'react'
import { getCrowdFundingContract, getTxUrl } from '@/lib/contract'
import { useWeb3 } from '@/hooks/useWeb3'
import { toast } from 'sonner'
import { useTransactionStore } from '@/store/transactionStore'
import { getAuthorizedSigner } from '@/lib/authorizedSigner'

export function useWithdraw() {
  const { walletProvider, address, isConnected } = useWeb3()
  const [isSuccess, setIsSuccess] = useState(false)
  const setPending = useTransactionStore((state) => state.setPending)
  const triggerRefresh = useTransactionStore((state) => state.triggerRefresh)

  const withdraw = async (campaignId: bigint): Promise<boolean> => {
    try {
      if (!walletProvider || !address || !isConnected) return false
      setPending(true, 'Waiting for signature in wallet...')

      const { signer } = await getAuthorizedSigner(walletProvider, address)
      const contract = getCrowdFundingContract(signer)

      const tx = await contract.withdraw(campaignId)
      setPending(true, 'Processing withdrawal on blockchain...', tx.hash)
      await tx.wait(1)

      setIsSuccess(true)
      setPending(false)
      triggerRefresh()
      toast.success('Funds withdrawn!', {
        description: 'USDT has been transferred to your wallet',
        action: { label: 'View Tx', onClick: () => window.open(getTxUrl(tx.hash), '_blank') },
      })
      return true
    } catch (error: unknown) {
      setPending(false)
      const code = (error as { code?: number | string })?.code
      if (code === 4001 || code === 'ACTION_REJECTED') toast.error('Transaction cancelled')
      else if (code === 4100) toast.error('Wallet authorization lost. Reconnect and try again.')
      return false
    }
  }

  const loading = useTransactionStore((state) => state.isPending)
  return { withdraw, loading, isSuccess }
}
```

---

### `components/TransactionLoadingScreen.tsx`

Full-screen overlay. Shows:
- Step 1: "Waiting for wallet signature" (spinner while no txHash, checkmark once hash arrives)
- Step 2: "Confirming on blockchain" (clock icon before hash, spinner after)
- Tx hash row with Etherscan link (animates in once tx is submitted)

```typescript
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useTransactionStore } from '@/store/transactionStore'
import { Loader2, ExternalLink, CheckCircle2, Clock } from 'lucide-react'
import { getTxUrl } from '@/lib/contract'
import { truncateAddress } from '@/lib/utils'

export function TransactionLoadingScreen() {
  const { isPending, message, txHash } = useTransactionStore()
  const isWaitingForSignature = !txHash
  const isConfirming = !!txHash

  return (
    <AnimatePresence>
      {isPending && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border/50 shadow-2xl max-w-sm w-full mx-4 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-50 pointer-events-none" />
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-4 text-foreground font-sans">Transaction in Progress</h3>

            <div className="w-full space-y-2 mb-5">
              <div className="flex items-center gap-3 text-sm">
                {isWaitingForSignature
                  ? <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  : <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                <span className={isWaitingForSignature ? 'text-foreground' : 'text-muted-foreground line-through'}>
                  Waiting for wallet signature
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {isConfirming
                  ? <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  : <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className={isConfirming ? 'text-foreground' : 'text-muted-foreground'}>
                  Confirming on blockchain
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4 font-mono">
              {message || 'Please wait...'}
            </p>

            <AnimatePresence>
              {txHash && (
                <motion.a
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  href={getTxUrl(txHash)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-mono text-accent hover:text-accent/80 transition-colors bg-muted/50 px-3 py-2 rounded-lg border border-border/40 w-full justify-center"
                >
                  <span>{truncateAddress(txHash, 10, 8)}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </motion.a>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

### `components/Providers.tsx`

```typescript
'use client'
import '@/lib/appkit'   // initialises AppKit once on the client
import { Toaster } from 'sonner'
import { TransactionLoadingScreen } from '@/components/TransactionLoadingScreen'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TransactionLoadingScreen />
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </>
  )
}
```

---

### `app/layout.tsx`

> IMPORTANT: Providers must use `dynamic(() => ..., { ssr: false })` to prevent AppKit from
> accessing `indexedDB` / `localStorage` during server render.

```typescript
import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

const Providers = dynamic(
  () => import('@/components/Providers').then((mod) => mod.Providers),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'ChainFund — Decentralized Crowdfunding',
  description: 'Transparent crowdfunding on the blockchain. No middlemen.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans bg-background text-foreground antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

### `components/PageWrapper.tsx`

```typescript
'use client'
import { motion } from 'framer-motion'

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```

---

## Key Patterns & Rules

### Data Fetching (read-only)
- Always use `getReadProvider()` (public RPC, no wallet needed)
- All fetch hooks subscribe to `refreshTrigger` from Zustand — call `triggerRefresh()` after every write tx
- If `CONTRACT_ADDRESS` is empty string, fall back to `MOCK_CAMPAIGNS` automatically

### Write Transactions
- Always use `getAuthorizedSigner(walletProvider, address)` — never bare `new BrowserProvider().getSigner()`
- Flow: `setPending(true, msg)` → sign tx → `setPending(true, msg, tx.hash)` → `tx.wait(1)` → `setPending(false)` → `triggerRefresh()`
- After `approveTx.wait(1)`, call `getAuthorizedSigner` again to get a fresh signer before the next tx

### Transaction Loading Screen
- Driven entirely by `useTransactionStore` — no prop drilling needed
- Appears globally because `TransactionLoadingScreen` lives in `Providers.tsx`

### ERC-20 Contribute Flow (2 transactions)
1. Check `usdtContract.allowance(address, CONTRACT_ADDRESS)`
2. If allowance < amount → `approve()` → wait → re-authorize → then `contribute()`
3. If allowance >= amount → `contribute()` directly (1 tx only)

### Error Codes to Handle
```typescript
code === 4001 || code === 'ACTION_REJECTED'  // User rejected in wallet
code === 4100                                 // Wallet not authorized (re-connect)
```

### Amount Units
- All on-chain amounts are USDT with 6 decimals
- Use `parseUnits(amount, 6)` for input → contract
- Use `formatUnits(amount, 6)` for contract → display
- `formatUsdt(bigint)` in utils wraps this for display

### Mock Mode
- Set `NEXT_PUBLIC_CONTRACT_ADDRESS=` (empty) in `.env.local`
- All hooks auto-detect `!CONTRACT_ADDRESS` and return mock data
- No code changes needed to switch between mock and live

---

## Smart Contract Reference

The Solidity contract exposes:

```solidity
getCampaignCount() → uint256
getCampaign(uint256 id) → (id, creator, title, description, goal, raised, deadline, withdrawn, contributorsCount)
createCampaign(string title, string description, uint256 goal, uint256 durationDays)
contribute(uint256 campaignId, uint256 amount)   // requires prior USDT approve
withdraw(uint256 campaignId)                      // only creator, only if raised >= goal
getContributions(uint256 campaignId) → tuple[]   // returns (contributor, amount, txHash, timestamp)
```

- Deploy on Sepolia via Remix IDE
- After deploy: set `NEXT_PUBLIC_CONTRACT_ADDRESS` and `NEXT_PUBLIC_USDT_ADDRESS` in `.env.local`
