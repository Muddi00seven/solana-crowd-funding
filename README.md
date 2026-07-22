# ChainFund (Solana Edition)

A decentralized, non-custodial crowdfunding dApp — campaigns are funded in an SPL token, held by a program-owned vault, and released only when on-chain rules are satisfied. No middleman ever touches the money.

This project began as an Ethereum/Solidity app (`ethers.js` + Reown AppKit + a `CrowdFunding.sol` contract on Sepolia). It has since been **fully migrated to Solana**: the frontend now talks to a live Anchor program on **devnet**, and every EVM-specific piece (ethers, AppKit, WalletConnect, the approve→transferFrom flow) has been replaced with its Solana equivalent. On top of that migration, the UI was rebuilt from a single raw instruction panel into a proper multi-screen app — a card grid with status tabs, a guided create-campaign form, a full campaign detail page, and a "my campaigns" view — while the original raw panel is kept at `/debug` for direct testing. This README documents the app **as it exists today**.

> Looking for the old Ethereum version's docs? See the "What Changed / Legacy Docs" section near the bottom — `readme2.md` and `WORKFLOW.md` still describe the retired EVM build and have not been rewritten line-by-line, only flagged.

---

## 1. Live Deployment

| | |
|---|---|
| **Cluster** | Solana **devnet** |
| **Program ID** | `6hafcYNa34it4syjPPy8yuQW5LfCmcxhm3D78h2qBA5r` |
| **Program source** | `../solana-rust/02-crowdfunding-spl/programs/crowdfunding/src/lib.rs` (sibling project — see [Section 4](#4-the-solana-program-rustanchor)) |
| **Default SPL token mint** | `Chtf3dLtuCaBP8mNcC5FcSwA1fvBTZbnPY4xbsuriHMb` (minted in `../solana-rust/01-spl-token-deploy`) |
| **Explorer** | https://explorer.solana.com/address/6hafcYNa34it4syjPPy8yuQW5LfCmcxhm3D78h2qBA5r?cluster=devnet |

Any wallet can point at a different program/mint by overriding `NEXT_PUBLIC_PROGRAM_ID` / `NEXT_PUBLIC_TOKEN_MINT` in `.env.local` — see [Section 3](#3-environment-variables).

---

## 2. Tech Stack

```
Framework:     Next.js 14 — App Router
Language:      TypeScript (strict)
Styling:       Tailwind CSS + shadcn/ui
Chain:         Solana (devnet)
Program:       Anchor 0.30.1 (Rust) — "crowdfunding"
Client SDK:    @coral-xyz/anchor 0.30.1 (Program, AnchorProvider, BN)
Wallets:       @solana/wallet-adapter-react + wallet-adapter-react-ui
               (Wallet Standard auto-detection — Phantom, Solflare, Backpack, etc.)
Token:         SPL Token (@solana/spl-token) — Associated Token Accounts
Forms:         React Hook Form + Zod
Animations:    Framer Motion
Toasts:        Sonner
State:         Zustand
```

Nothing in the current `app/`, `components/`, or `lib/` folders depends on `ethers`, `@reown/*`, or WalletConnect anymore — those packages have been removed from `package.json` entirely.

---

## 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in as needed (sensible devnet defaults are already baked into `lib/solana.ts`, so an empty `.env.local` still works):

```env
# devnet's public RPC rate-limits aggressively under load — swap in a
# private RPC (Helius, Ankr, Alchemy, QuickNode...) if you hit 429s.
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# The deployed crowdfunding program id (devnet).
NEXT_PUBLIC_PROGRAM_ID=6hafcYNa34it4syjPPy8yuQW5LfCmcxhm3D78h2qBA5r

# SPL token campaigns are denominated in.
NEXT_PUBLIC_TOKEN_MINT=Chtf3dLtuCaBP8mNcC5FcSwA1fvBTZbnPY4xbsuriHMb
NEXT_PUBLIC_TOKEN_DECIMALS=6

# Used only to build Solana Explorer links. One of: devnet | testnet | mainnet-beta
NEXT_PUBLIC_EXPLORER_CLUSTER=devnet
```

Getting Started:

```bash
npm install --ignore-engines   # some @solana/* packages want Node >=20.18; --ignore-engines is safe here
cp .env.local.example .env.local
npm run dev
```

You'll need a browser wallet extension (Phantom, Solflare, Backpack, ...) set to **devnet**, funded with a little devnet SOL (for transaction fees / rent) and holding some of the SPL token above (for contributing). Devnet SOL is free from `solana airdrop 1 <address> --url devnet` or a public faucet.

---

## 4. The Solana Program (Rust/Anchor)

The on-chain logic lives outside this repo, in a sibling project: `../solana-rust/02-crowdfunding-spl`. It's an Anchor program that **ports the logic of a reference Solidity crowdfunding contract onto Solana**, with two deliberate departures explained below (no approve step, and a bonus `claim_refund` instruction).

### 4.1 Why the account model looks different from Solidity

The original Solidity contract kept one global `Campaign[] campaigns` array in contract storage, with `createCampaign()` pushing a new entry and returning its index. Solana has no shared mutable array like that — a program's "storage" is a set of independent accounts it owns, and every account needs a fixed, pre-declared size. So instead:

- Every campaign is its **own account**, a Program Derived Address (PDA) seeded by `("campaign", creator_pubkey, campaign_id)`.
- `campaign_id` is a number the **client picks** (this frontend uses `Date.now()`) purely so one wallet can run multiple campaigns — Solana has no auto-incrementing counter the program could hand out.
- There is no `getCampaignCount()` — instead, "list my campaigns" is done client-side via `getProgramAccounts` with a filter (see [Section 6.3](#63-listmycampaigns)).
- Every contribution is *also* its own account (a `Contribution` PDA), seeded by `("contribution", campaign_pubkey, contributor_pubkey)` — one per (campaign, contributor) pair. Contributing again just adds to the same account instead of creating a new row.

### 4.2 Accounts (on-chain data)

**`Campaign`** — one per campaign, holds everything the old Solidity struct held plus PDA bookkeeping:

| Field | Type | Notes |
|---|---|---|
| `creator` | `Pubkey` | Wallet that created the campaign |
| `campaign_id` | `u64` | Client-chosen id, part of the PDA seed |
| `title` | `String` | 5–64 characters |
| `description` | `String` | ≤ 200 characters |
| `image_url` | `String` | ≤ 200 characters |
| `token_mint` | `Pubkey` | Which SPL token this campaign accepts |
| `goal` | `u64` | Raw token units (respects the mint's decimals) |
| `raised` | `u64` | Running total, raw token units |
| `deadline` | `i64` | Unix timestamp — `now + duration_days` at creation |
| `withdrawn` | `bool` | Set once the creator has withdrawn |
| `contributors_count` | `u64` | Unique contributor count |
| `bump` / `vault_bump` | `u8` | PDA bump seeds, cached so later instructions don't have to re-derive them |

**`Contribution`** — one per (campaign, contributor) pair:

| Field | Type | Notes |
|---|---|---|
| `campaign` | `Pubkey` | Which campaign this belongs to |
| `contributor` | `Pubkey` | Who contributed |
| `amount` | `u64` | Cumulative amount contributed (raw units) |
| `last_contributed_at` | `i64` | Unix timestamp of the most recent contribution |
| `refunded` | `bool` | Set once `claim_refund` has paid this contributor back |
| `bump` | `u8` | PDA bump |

### 4.3 PDA seed reference

These three derivations are mirrored exactly in `lib/solana.ts` (`deriveCampaignPda`, `deriveVaultPda`, `deriveContributionPda`) — the frontend must compute the *same* addresses the program does, since PDAs aren't stored anywhere central.

```
campaign     = PDA(["campaign", creator, campaign_id_as_u64_le_bytes], programId)
vault        = PDA(["vault", campaign], programId)                      // an SPL TokenAccount, owned by the program
contribution = PDA(["contribution", campaign, contributor], programId)
```

The `vault` is itself an SPL token account, but its *authority* (who can move its tokens) is the `campaign` PDA — not a human key. That's what makes withdrawals and refunds trustless: only the program, executing the exact rules below, can ever move vault funds, by signing with the campaign's own derived seeds (`CpiContext::new_with_signer`).

### 4.4 Instructions

#### `create_campaign(campaign_id, title, description, image_url, goal, duration_days)`

Creates the `Campaign` PDA and its `vault` token account in one instruction (both use Anchor's `init`).

Validation (all enforced on-chain, will abort the transaction otherwise):
- `title`: 5–64 characters
- `description`: ≤ 200 characters
- `image_url`: ≤ 200 characters
- `goal`: must be > 0
- `duration_days`: 1–365

Accounts required: `creator` (signer, payer), `token_mint`, `campaign` (init), `vault` (init, token account owned by the program), `token_program`, `system_program`, `rent`.

Emits `CampaignCreated { campaign, creator, title, goal, deadline }`.

#### `contribute(amount)`

Transfers `amount` of the campaign's token straight from the contributor's own associated token account into the vault via a single SPL `transfer` CPI, signed directly by the contributor.

**This is the biggest behavioral difference from the ERC-20/Solidity version**: there is no `approve()` step. An SPL token transfer is authorized by the *owner's own signature* on the instruction — there's no allowance to grant first, so contributing is always exactly one signature, one transaction (see [Section 8](#8-the-approve-step-that-no-longer-exists) for the full comparison).

Validation: `amount > 0`; campaign's `deadline` has not passed.

On success: creates the contributor's `Contribution` account if it's their first time (`init_if_needed`), or adds to it if they've contributed before; increments `campaign.raised`; increments `campaign.contributors_count` only the first time a given wallet contributes.

Emits `ContributionMade { campaign, contributor, amount, total_raised }`.

#### `withdraw()`

Creator pulls the entire raised balance out of the vault, once. Signed by the `campaign` PDA itself (program-derived signature via stored seeds/bump) — no human ever holds a key that can move vault funds directly.

Validation: `raised >= goal`; `withdrawn` must currently be `false`; the calling wallet must match `campaign.creator` (enforced via Anchor's `has_one = creator`).

Emits `FundsWithdrawn { campaign, creator, amount }`.

#### `claim_refund()`

**Bonus instruction — has no equivalent in the original Solidity contract.** If a campaign's deadline passes without reaching its goal, funds would otherwise be stuck in the vault forever; this lets each contributor pull back exactly what they put in.

Validation: `now >= deadline`; `raised < goal`; this contributor's `Contribution.refunded` must still be `false`; their contributed `amount` must be `> 0`.

Emits `RefundClaimed { campaign, contributor, amount }`.

### 4.5 Errors

| Code | Name | Message |
|---|---|---|
| 6000 | `InvalidTitle` | Title must be between 5 and 64 characters |
| 6001 | `DescriptionTooLong` | Description must be at most 200 characters |
| 6002 | `ImageUrlTooLong` | Image URL must be at most 200 characters |
| 6003 | `InvalidGoal` | Goal must be greater than zero |
| 6004 | `InvalidDuration` | Duration must be between 1 and 365 days |
| 6005 | `ZeroAmount` | Amount must be greater than zero |
| 6006 | `CampaignExpired` | This campaign's deadline has passed |
| 6007 | `NotCreator` | Only the campaign creator can withdraw |
| 6008 | `GoalNotReached` | The funding goal has not been reached yet |
| 6009 | `AlreadyWithdrawn` | Funds have already been withdrawn |
| 6010 | `CampaignStillActive` | Campaign is still active — wait for the deadline to claim a refund |
| 6011 | `GoalWasReached` | The funding goal was reached — ask the creator to withdraw instead |
| 6012 | `AlreadyRefunded` | This contribution has already been refunded |
| 6013 | `NothingToRefund` | Nothing to refund for this contributor |
| 6014 | `MathOverflow` | Math overflow |

If a transaction fails, the wallet-signed error surfaces in `WriteFunctions.tsx`'s result box (`❌ ...`) with whatever message Anchor decodes from the program logs — these are the messages you'll see there.

---

## 5. Frontend Architecture

The app has two layers on top of the program: a set of **screens** (the card grid, create form, detail page, "my campaigns") that a normal visitor uses, and a raw **`/debug` console** (the original bare-bones panel) kept around for testing instructions directly. Both talk to the same `lib/solana.ts` client.

```
app/
  layout.tsx                  ← metadata/fonts; <Providers ssr:false> wraps <Navbar/> + {children}
  page.tsx                    ← "/" — <CampaignGrid /> (the home screen)
  campaigns/
    create/page.tsx           ← "/campaigns/create" — <CreateCampaignForm />
    mine/page.tsx              ← "/campaigns/mine" — <CampaignGrid onlyCreator={wallet} />
    [address]/page.tsx         ← "/campaigns/:address" — <CampaignDetail address />
  debug/page.tsx               ← "/debug" — the original raw instruction console

components/
  Providers.tsx                ← ConnectionProvider + WalletProvider + WalletModalProvider,
                                  renders <TransactionOverlay/> + <Toaster/> for the whole app
  Navbar.tsx                   ← top nav (Campaigns / Create / My Campaigns) + <WalletButton/>
  WalletButton.tsx              ← compact balance+address chip → dialog (Explorer link, disconnect)
  TransactionOverlay.tsx        ← full-screen "signing/confirming" overlay, driven by store/transactionStore.ts
  WalletConnect.tsx              ← legacy full-page wallet gate + raw Read/Write panels — now only
                                    rendered by app/debug/page.tsx, not part of the main flow
  campaigns/
    CampaignGrid.tsx            ← tab bar (All / Still Going / Goal Reached / Expired) + card grid
    CampaignCard.tsx             ← one campaign summary card
    CampaignCardSkeleton.tsx     ← loading placeholder for CampaignGrid
    CampaignDetail.tsx            ← full detail screen: stats, contribute box, conditional
                                     withdraw/claim-refund actions, contributions list
    CreateCampaignForm.tsx        ← react-hook-form + zod campaign creation form
    ContributionsList.tsx          ← contribution rows for CampaignDetail
    StatusBadge.tsx                ← "Still Going" / "Goal Reached" / "Expired" pill
  contract/
    ReadFunctions.tsx            ← raw getCampaign / getContributions / listMyCampaigns (debug console)
    WriteFunctions.tsx            ← raw createCampaign / contribute / withdraw / claimRefund (debug console)
  ui/                             ← shadcn/ui primitives (button, card, dialog, input, progress, ...)

hooks/
  useCampaigns.ts                ← every Campaign account (read-only, no wallet needed) — CampaignGrid
  useCampaign.ts                  ← one Campaign by address (read-only) — CampaignDetail
  useContributions.ts              ← every Contribution for a campaign (read-only) — CampaignDetail
  useCreateCampaign.ts              ← wraps createCampaign() with toasts + refresh
  useContribute.ts                   ← wraps contribute() with toasts + refresh
  useWithdraw.ts                      ← wraps withdraw() with toasts + refresh
  useClaimRefund.ts                    ← wraps claimRefund() with toasts + refresh

store/
  transactionStore.ts             ← zustand: isPending/message/txSignature (drives TransactionOverlay)
                                     + refreshTrigger (every read hook refetches when a write succeeds)

lib/
  solana.ts                       ← Program client factories (signing + read-only), constants, PDA helpers,
                                     fetchAllCampaigns/fetchCampaign/fetchContributionsForCampaign, getCampaignStatus
  format.ts                       ← BN ⇄ human-readable token amount + date formatting
  utils.ts                        ← cn(), truncateAddress, getProgress, getDaysLeft, timeAgo (all BN-aware),
                                     isValidTokenAmount
  validations.ts                  ← zod schemas mirroring the program's on-chain constraints
  idl/
    crowdfunding.ts               ← hand-authored Anchor IDL (see 5.1)

.env.local.example                ← template for the env vars in Section 3
next.config.mjs                   ← webpack fallback tweak for the buffer polyfill
```

### 5.1 Why the IDL is hand-written

Normally `anchor build` generates `target/idl/crowdfunding.json` (and a matching `.ts` type) automatically from the Rust source. In this environment, `anchor build` hit an internal `proc-macro2`/Anchor 0.30.1 incompatibility during IDL generation specifically (`no method named 'source_file'...`) — the program itself still compiled and deployed fine via `anchor build --no-idl`, but no IDL file was produced.

`lib/idl/crowdfunding.ts` is a **hand-authored replacement**, written directly from the Rust source and verified byte-for-byte:

- All 8-byte instruction/account discriminators (`sha256("global:<name>")[:8]` / `sha256("account:<Name>")[:8]`) were computed independently and checked against what a real `anchor.Program` produces at runtime.
- Field names are written in **camelCase** (`campaignId`, `contributorTokenAccount`, `tokenMint`, ...) even though the Rust source uses snake_case (`campaign_id`, ...) — Anchor's JS client auto-converts to camelCase *at runtime*, but TypeScript's static types don't apply that conversion themselves, so the IDL has to already say `camelCase` for `tsc` to accept the code that calls `program.methods.createCampaign(...)`.
- It follows the **modern/unified IDL spec** used by `@coral-xyz/anchor@0.30.1`'s runtime (explicit `discriminator: number[]` per instruction/account, `writable`/`signer` flags, a separate `types[]` array holding the actual struct layouts) — not the older "legacy" IDL shape, which this version of the library rejects at `Program` construction time.

If you ever regenerate a real IDL from a working `anchor build`, it should be a drop-in replacement for this file as long as the field names stay consistent (or you rename them to camelCase the same way).

### 5.2 `lib/solana.ts` — two Program clients

```ts
export function getProgram(wallet: AnchorWallet, connection: Connection): CrowdfundingProgram {
  const provider = new AnchorProvider(connection, wallet as unknown as Wallet, { commitment: 'confirmed' })
  return new Program<Crowdfunding>(IDL, provider)
}
```

`useAnchorWallet()` (from wallet-adapter-react) gives you `{publicKey, signTransaction, signAllTransactions}` — real wallets never expose a raw private key, so there's no `payer` field the way Anchor's own `Wallet` type expects. The cast above is safe because `AnchorProvider` never actually touches `.payer` for any call this app makes (`.rpc()` / `.instruction()` / `.fetch()` only need `signTransaction`).

Every write hook (`useCreateCampaign`, `useContribute`, `useWithdraw`, `useClaimRefund`) uses `getProgram()`, so a wallet must be connected before any of them can be called.

```ts
export function getReadOnlyProgram(connection?: Connection): CrowdfundingProgram {
  const provider = new AnchorProvider(connection ?? getReadConnection(), READ_ONLY_WALLET, { commitment: 'confirmed' })
  return new Program<Crowdfunding>(IDL, provider)
}
```

Browsing shouldn't require a wallet — `.fetch()`/`.all()` never touch `provider.wallet`, so `getReadOnlyProgram()` uses a stub wallet that only throws if something ever tries to sign with it. This is what makes the home grid, a campaign's detail page, and "my campaigns" all load before you've connected anything. Built on top of it:

```ts
fetchAllCampaigns(connection?): Promise<ProgramAccountEntry<CampaignAccount>[]>
fetchCampaign(campaignPda, connection?): Promise<CampaignAccount>
fetchContributionsForCampaign(campaignPda, connection?): Promise<ProgramAccountEntry<ContributionAccount>[]>
getCampaignStatus(campaign): 'active' | 'goalReached' | 'expired'
```

This same file also exports `PROGRAM_ID`, `TOKEN_MINT`, `TOKEN_DECIMALS`, `RPC_URL`, `getAddressUrl()` / `getTxUrl()` (Explorer link builders), and the three PDA-derivation helpers described in [4.3](#43-pda-seed-reference).

### 5.3 Screens

| Route | Component | Needs a wallet? |
|---|---|---|
| `/` | `CampaignGrid` | No — browse-only |
| `/campaigns/create` | `CreateCampaignForm` | Yes, to submit (shows a connect prompt otherwise) |
| `/campaigns/:address` | `CampaignDetail` | No to view; yes to contribute/withdraw/claim refund |
| `/campaigns/mine` | `CampaignGrid` filtered by `creator` | Yes (shows a connect prompt otherwise) |
| `/debug` | `WalletConnect` (raw console) | Yes, for everything — same as before this update |

`CampaignGrid`'s tabs (All / Still Going / Goal Reached / Expired) and the "my campaigns" filter are both plain client-side filtering over one `fetchAllCampaigns()` call — there's no on-chain query language to filter server-side, so this is fine at devnet-demo scale but would need pagination/indexing (e.g. a real indexer or `getProgramAccounts` `dataSlice`) at real scale.

---

## 6. Read Functions

Solana has no "free view call" concept quite like Solidity's `view` functions, but reads here still cost nothing and need no signature — they're either a single account fetch or a filtered account scan, both served straight by the RPC node, all wrapped by `getReadOnlyProgram()` (5.2) so no wallet needs to be connected.

The main app consumes these through hooks (`hooks/useCampaigns.ts`, `useCampaign.ts`, `useContributions.ts`) that also subscribe to `store/transactionStore.ts`'s `refreshTrigger`, so `CampaignGrid`/`CampaignDetail` refetch automatically right after any write succeeds — no manual reload button anywhere. `components/contract/ReadFunctions.tsx` (rendered at `/debug`) calls the exact same underlying logic directly, with raw address inputs, for quick manual testing.

### 6.1 `getCampaign(address)` — `useCampaign(address)`

```ts
const c = await program.account.campaign.fetch(pda)
```
Fetches and decodes one `Campaign` account by its PDA address (you get this address back from `createCampaign()`, or from `listMyCampaigns()` below).

### 6.2 `getContributions(campaignAddress)` — `useContributions(address)`

```ts
const discFilter = program.coder.accounts.memcmp('contribution')
const accounts = await connection.getProgramAccounts(program.programId, {
  filters: [
    { memcmp: { offset: 0, bytes: discFilter.bytes } },              // is a Contribution account
    { memcmp: { offset: 8, bytes: campaignPda.toBase58() } },        // whose `campaign` field matches
  ],
})
```
There's no array to index into (unlike the old `getContributions(uint256) → tuple[]`), so this scans every account owned by the program whose first 8 bytes match the `Contribution` discriminator and whose `campaign` field (the 32 bytes right after that discriminator) matches the campaign you asked about.

### 6.3 `listMyCampaigns()` / "My Campaigns" (`/campaigns/mine`)

`components/contract/ReadFunctions.tsx` (the `/debug` console) implements this with its own `getProgramAccounts` + `memcmp` call, filtered on the `Campaign` discriminator and the connected wallet's pubkey in the `creator` field.

The main app's `/campaigns/mine` screen takes a simpler path: it calls `program.account.campaign.all()` via `fetchAllCampaigns()` (the exact same one-shot fetch that powers the home grid) and filters the result client-side by `account.creator.equals(wallet.publicKey)` — see `CampaignGrid`'s `onlyCreator` prop. Same end result, no separate on-chain query needed, since the full campaign list is already being fetched for the grid anyway. Either approach is the closest Solana equivalent to the old EVM `getCampaignCount()` + iterating every id — there's no on-chain counter, so "list mine" replaces "count all".

---

## 7. Write Functions

Every write follows the same shape: user clicks → wallet prompts a signature → `.rpc()` sends the transaction and waits for confirmation. In the main app this is wrapped by a hook per instruction (`hooks/useCreateCampaign.ts`, `useContribute.ts`, `useWithdraw.ts`, `useClaimRefund.ts`), each of which:

1. calls `setPending(true, '...')` on `store/transactionStore.ts` — this is what makes `TransactionOverlay` appear over whichever screen triggered it;
2. builds and sends the instruction via `getProgram()`;
3. on success, calls `setPending(false)`, `triggerRefresh()` (so every visible list/detail view refetches), and shows a Sonner toast with a "View tx" action linking to Explorer;
4. on failure, shows an error toast with Anchor's decoded message instead of throwing silently.

`components/contract/WriteFunctions.tsx` (rendered at `/debug`) calls the same instructions directly with raw address/amount inputs and prints the signature (or `❌ ...` error) into an inline result box instead of a toast — useful for testing an instruction call in isolation.

### 7.1 `createCampaign(title, description, imageUrl, goal, durationDays)` — `useCreateCampaign()`

```ts
const campaignId = new BN(Date.now())
const [campaignPda] = deriveCampaignPda(wallet.publicKey, campaignId)
const [vaultPda] = deriveVaultPda(campaignPda)

await program.methods
  .createCampaign(campaignId, title, description, imageUrl, toRawToken(goal), new BN(durationDays))
  .accounts({ creator: wallet.publicKey, tokenMint: TOKEN_MINT, campaign: campaignPda, vault: vaultPda,
              tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId, rent: SYSVAR_RENT_PUBKEY })
  .rpc()
```
`campaign_id` is generated client-side (`Date.now()`) since nothing on-chain can hand one out. `useCreateCampaign()` returns the new `campaignPda.toBase58()`, and `CreateCampaignForm` immediately `router.push()`s to `/campaigns/:address` with it — no manual copy-pasting of the address needed in the main app (the `/debug` console still shows it as raw text, since it has no page to redirect to).

### 7.2 `contribute(campaignAddress, amount)` — `useContribute()`

```ts
const campaign = await program.account.campaign.fetch(campaignPda)   // read its token_mint first
const contributorTokenAccount = getContributorTokenAccount(campaign.tokenMint, wallet.publicKey)

await program.methods
  .contribute(toRawToken(amount))
  .accounts({ contributor: wallet.publicKey, campaign: campaignPda, vault: vaultPda,
              contribution: contributionPda, contributorTokenAccount,
              tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId })
  .rpc()
```
One click, one signature, one transaction — **no approve() step** (see [Section 8](#8-the-approve-step-that-no-longer-exists)).

### 7.3 `withdraw(campaignAddress)` — `useWithdraw()`

Creator-only, only after the goal is reached; transfers the whole vault balance to the creator's associated token account (created on the fly if it doesn't exist yet). On `CampaignDetail`, the "Withdraw Funds" button only renders when `getCampaignStatus(campaign) === 'goalReached'`, `!campaign.withdrawn`, and the connected wallet equals `campaign.creator` — the on-chain checks are still the real gate, this just avoids showing a button that would only fail.

### 7.4 `claimRefund(campaignAddress)` — `useClaimRefund()`

Any contributor, only after the deadline passes on a campaign that missed its goal; returns exactly what that wallet put in. `CampaignDetail` shows "Claim Refund" only when the connected wallet has a `Contribution` for this campaign, the campaign's status is `'expired'`, and that contribution isn't already refunded.

---

## 8. The Approve Step That No Longer Exists

This is the single biggest UX/architecture change from the old app, so it's worth calling out on its own. The Solidity version required **two transactions** for a first-time contribution:

```
1. usdtContract.approve(CONTRACT_ADDRESS, amount)   ← grants the contract permission to move your USDT
   → wait for confirmation
2. crowdContract.contribute(campaignId, amount)      ← the contract then calls transferFrom() itself
```

SPL tokens don't have an ERC-20-style allowance/`transferFrom` model. A transfer is authorized the moment its owner signs the instruction that moves it — so the Solana `contribute()` instruction does the SPL `transfer` CPI directly, authorized by the contributor's own signature, in the **same transaction** the user already signed to call `contribute()`. Net effect: what used to be a 2-transaction, ~30–60 second flow (approve → wait → contribute) is now a single transaction.

---

## 9. Wallet Connect

`components/Providers.tsx` + `components/Navbar.tsx` + `components/WalletButton.tsx` replace the old Reown AppKit + `ethers.BrowserProvider` setup. (`components/WalletConnect.tsx` is the original full-page version of this, kept only for `/debug`.)

- **Provider setup**: `ConnectionProvider` (holds the RPC `Connection`) → `WalletProvider` (holds the connected wallet, `wallets={[]}` because modern wallets self-register via the Wallet Standard — Phantom/Solflare/Backpack/etc. all show up automatically without listing individual adapter packages) → `WalletModalProvider` (the connect-wallet UI modal), which also renders `<TransactionOverlay/>` and the Sonner `<Toaster/>` for the whole app. All of this is rendered via `dynamic(..., { ssr: false })` in `app/layout.tsx`, same SSR-avoidance pattern the old AppKit setup used, because wallet adapters touch `window`/`indexedDB`. `<Navbar/>` is rendered as a sibling of `{children}` inside that same `Providers` tree, so `WalletButton` can use `useWallet()`/`useConnection()` directly.
- **Connecting**: `useWalletModal().setVisible(true)` opens the wallet picker; once connected, `useWallet()` gives you `publicKey`, `connected`, `disconnect()` directly — there's no separate "raw EIP-1193 provider" concept to plumb through props the way `useAppKitProvider('eip155')` was needed before. Every hook and component calls the wallet-adapter hooks itself instead of receiving a `walletProvider` prop.
- **Buffer polyfill**: `@solana/web3.js` expects a global `Buffer`; Next.js doesn't polyfill Node globals in the browser, so `Providers.tsx` sets `window.Buffer = require('buffer').Buffer` once on mount.
- **Wallet chip vs. old click-to-disconnect**: `WalletButton` shows `{balance} SOL · {truncated address}` in the Navbar; clicking it opens a small dialog (Explorer link + a separate "Disconnect" button) instead of disconnecting on the first click the way the old single chip did — harder to disconnect by accident. `WalletConnect.tsx` (still used at `/debug`) keeps the original single-click-to-disconnect chip.

---

## 10. Complete End-to-End Flow

```
 1. User opens the app at "/"
       → CampaignGrid loads immediately via fetchAllCampaigns() — no wallet needed to browse
       → tabs: All Campaigns / Still Going / Goal Reached / Expired
       → empty state points at "/campaigns/create" if there's nothing yet

 2. Connect a wallet (top-right WalletButton, any screen)
       → useWalletModal().setVisible(true) opens the wallet picker
       → user picks Phantom/Solflare/etc., approves the connection in their extension
       → useWallet() now returns publicKey + connected=true
       → SOL balance is fetched and shown in the Navbar chip

 3. Create a campaign — "/campaigns/create" (CreateCampaignForm → useCreateCampaign)
       → zod validates title/description/imageUrl/goal/duration client-side first
       → campaign_id = Date.now() picked client-side
       → campaign + vault PDAs derived
       → single signed transaction: creates both PDAs, sets goal/deadline
       → TransactionOverlay shows while signing; on success, a toast fires and the
         page redirects straight to "/campaigns/:address" — no address to copy by hand

 4. Contribute — on a campaign's detail page (CampaignDetail → useContribute)
       → only shown while the campaign's status is "active"
       → program fetches the campaign to find its token_mint
       → contributor's associated token account is derived
       → single signed transaction moves tokens contributor → vault directly (no approve)
       → campaign.raised / contributorsCount update on screen immediately — every open
         screen refetches automatically via the shared refreshTrigger, no manual reload

 5a. Once raised >= goal: the creator sees a "Withdraw Funds" button on the detail page
       → only rendered for the connected wallet that matches campaign.creator
       → vault's entire balance moves to the creator's token account
       → withdrawn flips to true — can only happen once, button disappears after

 5b. If the deadline passes with raised < goal: any contributor with an unrefunded
     contribution sees a "Claim Refund" button on the same detail page
       → refunds exactly what that wallet put in, marks their Contribution.refunded

 Throughout: "/" and "/campaigns/mine" (filtered to the connected wallet) let anyone
 browse campaign state at any time — no wallet signature or fee required to look.
 The "/debug" console still exposes every instruction as a raw address/amount form,
 for testing outside the guided screens.
```

---

## 11. Running the Project

```bash
npm install --ignore-engines
cp .env.local.example .env.local        # defaults already point at the live devnet deployment
npm run dev                              # http://localhost:3000
```

```bash
npm run build     # production build — verified clean (0 tsc errors, successful static export)
npm run start      # serve the production build
npm run lint       # eslint
```

To point this frontend at a **freshly redeployed** program (new program id / new mint), just update `NEXT_PUBLIC_PROGRAM_ID` / `NEXT_PUBLIC_TOKEN_MINT` in `.env.local` — no code changes needed unless the account layouts in the Rust program itself change (in which case `lib/idl/crowdfunding.ts` needs matching updates, see [5.1](#51-why-the-idl-is-hand-written)).

---

## 12. Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| `Wallet not connected` thrown from a Read/Write call | No wallet connected yet | Click "Connect Wallet" first |
| `429 Connection rate limits exceeded` on reads/writes | devnet's public RPC throttles under load | Set `NEXT_PUBLIC_SOLANA_RPC_URL` to a private RPC (Helius/Ankr/Alchemy/QuickNode) |
| Transaction fails with an `AnchorError` / one of the codes in [4.5](#45-errors) | An on-chain validation rule was violated (e.g. contributing after the deadline, withdrawing twice) | Read the decoded message in the result box — it names the exact rule that failed |
| `Attempt to debit an account but found no record of a prior credit` / insufficient funds | Wallet has no devnet SOL | `solana airdrop 1 <address> --url devnet`, or a public devnet faucet |
| Contribute fails because the token account doesn't exist | Wallet has never held the campaign's SPL token | Acquire some of the token first (e.g. via the mint's own faucet/mint-to script in `../solana-rust/01-spl-token-deploy`) |
| `ConnectionProvider cannot be used as a JSX component` (build-time only) | A transitive dependency (`@solana-mobile/wallet-adapter-mobile` → `react-native`) pulls in a conflicting `@types/react` | Already fixed via the `overrides` + exact-pinned `devDependencies` in `package.json` — don't remove those if you touch deps |
| `no method named 'source_file'`... during `anchor build` (only relevant if rebuilding the Rust program) | `anchor-lang@0.30.1` vs a newer `proc-macro2` | Use `anchor build --no-idl` — the `.so` build is unaffected, only IDL generation is skipped |
| `bigint: Failed to load bindings, pure JS will be used (try npm run rebuild?)` in the dev/build console | `@solana/web3.js`'s `bigint-buffer` dependency has no prebuilt native binary for your platform | Harmless — it falls back to a pure-JS implementation automatically. No action needed. |
| A wall of `404`s / "Fast Refresh had to perform a full reload" right after deleting `.next` or switching branches | Next.js's dev server cache was invalidated and is recompiling from scratch | Wait for the next request to finish (`GET / 200` in the terminal) and refresh the browser — self-resolves, not a real bug |

---

## 13. Quick Reference

**`lib/solana.ts`**
```ts
PROGRAM_ID, TOKEN_MINT, TOKEN_DECIMALS, RPC_URL, EXPLORER_CLUSTER
getReadConnection(): Connection
getProgram(wallet, connection): Program<Crowdfunding>              // signing client
getReadOnlyProgram(connection?): Program<Crowdfunding>              // no wallet needed
fetchAllCampaigns(connection?): Promise<ProgramAccountEntry<CampaignAccount>[]>
fetchCampaign(campaignPda, connection?): Promise<CampaignAccount>
fetchContributionsForCampaign(campaignPda, connection?): Promise<ProgramAccountEntry<ContributionAccount>[]>
getCampaignStatus(campaign): 'active' | 'goalReached' | 'expired'
getContributorTokenAccount(mint, owner): PublicKey
deriveCampaignPda(creator, campaignId): [PublicKey, number]
deriveVaultPda(campaign): [PublicKey, number]
deriveContributionPda(campaign, contributor): [PublicKey, number]
getAddressUrl(address) / getTxUrl(signature): string
```

**`lib/format.ts`**
```ts
formatToken(raw: BN|bigint|number|string): string     // "10.000000 tokens"
toRawToken(human: string): BN                          // "10" → raw units
formatDate(unixSeconds): string
display(value): string                                  // JSON.stringify with BN support, for result boxes
```

**`lib/utils.ts`** (all BN-aware — accept `BN | bigint | number`)
```ts
cn(...inputs): string
truncateAddress(address, start?, end?): string
getProgress(raised, goal): number          // 0-100
getDaysLeft(deadline): number
timeAgo(timestamp): string
isValidTokenAmount(amount: string): boolean
```

**`lib/validations.ts`**
```ts
createCampaignSchema: ZodSchema<CreateCampaignFormData>   // title/description/imageUrl/goal/durationDays
contributeSchema: ZodSchema<ContributeFormData>            // amount
```

**Program instructions (via `program.methods.*`)**
```ts
createCampaign(campaignId: BN, title: string, description: string, imageUrl: string, goal: BN, durationDays: BN)
contribute(amount: BN)
withdraw()
claimRefund()
```

**Read hooks** (no wallet required, all subscribe to `refreshTrigger`)
```ts
useCampaigns(): { campaigns, isLoading, isError, error, refetch }
useCampaign(address): { campaign, publicKey, isLoading, isError, error, refetch }
useContributions(campaignAddress): { contributions, isLoading, isError, refetch }
```

**Write hooks** (wallet required — each shows the TransactionOverlay + a toast)
```ts
useCreateCampaign(): { createCampaign(input): Promise<string|null>, isSubmitting }  // returns new campaign address
useContribute(): { contribute(campaignAddress, amount): Promise<boolean>, isSubmitting }
useWithdraw(): { withdraw(campaignAddress): Promise<boolean>, isSubmitting }
useClaimRefund(): { claimRefund(campaignAddress): Promise<boolean>, isSubmitting }
```

**`store/transactionStore.ts`** (zustand)
```ts
useTransactionStore(): {
  isPending, message, txSignature,
  refreshTrigger,                 // bump via triggerRefresh() → every read hook refetches
  setPending(isPending, message?, txSignature?),
  triggerRefresh(),
}
```

**Wallet-adapter hooks used**
```ts
useConnection()      → { connection }
useWallet()          → { publicKey, connected, disconnect }
useAnchorWallet()    → AnchorWallet (for building the Program client)
useWalletModal()     → { setVisible }
```

---

## 14. What Changed / Legacy Docs

This project was rebuilt on Solana; the table below is a quick map from the old EVM concepts to their Solana replacements, for anyone who worked with the previous version:

| EVM / Solidity version | Solana version |
|---|---|
| `ethers.js` + Reown AppKit | `@coral-xyz/anchor` + `@solana/wallet-adapter-react` |
| MetaMask / WalletConnect | Phantom / Solflare / Backpack / any Wallet-Standard wallet |
| `CrowdFunding.sol` on Sepolia | `crowdfunding` Anchor program on Solana devnet |
| Global `Campaign[] campaigns` array + `campaignId` index | One PDA per campaign, seeded by `(creator, campaign_id)` |
| `getCampaignCount()` | `listMyCampaigns()` (`getProgramAccounts` filtered by creator) |
| USDT `approve()` then `contribute()` (2 txs) | Direct SPL `transfer` inside `contribute()` (1 tx) — see [Section 8](#8-the-approve-step-that-no-longer-exists) |
| No refund mechanism | `claimRefund()` — new, contributor-initiated refund after a missed deadline |
| Etherscan | Solana Explorer (`getAddressUrl`/`getTxUrl` in `lib/solana.ts`) |

Two other docs in this repo, `readme2.md` (a demo script) and `WORKFLOW.md` (a from-scratch rebuild reference), **still describe the retired Ethereum version in full** — they have not been rewritten instruction-by-instruction as part of this update, only flagged with a notice at the top pointing back here. Treat their content as historical/reference material for the old build, not as documentation of the current app.

---

## 15. Known Repo Cleanup Items (not yet actioned)

A completeness pass over the whole project turned up a few leftover artifacts from the EVM version that are no longer used by any code path but are still sitting in the repo:

- `contracts/CrowdFunding.sol` and `contracts/MockUSDT.sol` — the retired Solidity source. Nothing in the app reads these anymore; the live contract is the Rust program referenced in [Section 4](#4-the-solana-program-rustanchor).
- `command` (repo root) — a scratch text file of the original `create-next-app` / `npm install ethers ...` setup commands. Stale, not referenced anywhere.
- Empty `app/nft`, `app/swap`, `components/nft`, `components/swap` folders — no files in them, not linked from any route.
- `.gitignore` only excludes `node_modules/` and `.next/` — it does **not** exclude `.env.local`, so a real `.env.local` (with your RPC/program overrides) could get committed by accident if you're not careful with `git add`.

None of these break the running app, so nothing above was deleted or changed automatically — flagging them here rather than silently leaving them out of this review.
