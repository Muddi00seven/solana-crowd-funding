# ChainFund — Demo Script (Roman Urdu)

> ⚠️ **OUTDATED — describes the retired Ethereum/Sepolia/ethers.js version of this app.**
> The project has since been fully migrated to Solana (Anchor program on devnet, SPL token
> contributions, wallet-adapter wallet connect). See `README.md` for the current architecture,
> program details, and flow. This script has not been rewritten for the Solana version — kept
> here only as historical reference for anyone giving the old-style demo. MetaMask/Sepolia/USDT
> approve-step references below are all from the pre-migration app.

> Teen alag alag script options hain. Apni audience aur time ke hisaab se choose karo.

---

## Option 1 — Short & Punchy (3-4 minute demo)

---

**[SCREEN: Landing Page]**

"Yeh hai ChainFund — ek decentralized crowdfunding platform jo blockchain pe chalti hai."

"Aaj main aapko dikhata hoon ke yeh platform kya problem solve karti hai aur kaise kaam karti hai."

---

**[PROBLEM]**

"Socho — aap ek NGO ke liye donate karna chahte ho. Aap paise bhejte ho. Lekin kya aapko pata hai ke paise actually wahan pohonche jahan pohonchne chahiye the?"

"Traditional crowdfunding mein teen bari problems hain:"

- "Pehli — **transparency nahi hoti**. Aapko nahi pata paisa kahan gaya."
- "Doosri — **middleman hota hai**. Platform apna cut leta hai, charity companies apna cut leti hain."
- "Teesri — **trust ka masla** — aap donation karte ho aur bas umeed karte ho ke sahi jagah pohoncha."

"ChainFund in teeno problems ko blockchain se solve karta hai."

---

**[SOLUTION]**

"Yahan har campaign ek **smart contract** pe hoti hai. Smart contract ek automatic system hai — koi banda beech mein nahi hota."

"Rules already code mein likhe hote hain:"
- "Agar goal reach ho gaya — creator withdraw kar sakta hai"
- "Agar goal reach nahi hua — funds locked rehte hain"
- "Har transaction blockchain pe visible hai — koi hide nahi kar sakta"

---

**[LIVE DEMO]**

**[SCREEN: Campaign Grid]**

"Yeh hain live campaigns jo abhi blockchain pe chal rahi hain."

"Har campaign ka progress real time mein dikh raha hai — raised amount, contributors, aur deadline."

**[SCREEN: Campaign Detail]**

"Is campaign pe click karte hain. Yahan aap dekh sakte ho:"
- "Kitna paisa raise hua"
- "Kitne logon ne contribute kiya"
- "Har transaction ka hash — jo Etherscan pe verify kiya ja sakta hai"

"Yeh table neeche — yeh blockchain ki transactions hain. Yeh data koi change nahi kar sakta."

**[SCREEN: Contribute]**

"Ab main contribute karta hoon. Wallet connect karta hoon — MetaMask se."

"Amount enter karta hoon — 10 USDT."

"Transaction sign karta hoon. Dekho — pehle USDT approve hoti hai, phir contribute transaction jaati hai. Dono blockchain pe record hoti hain."

"Transaction confirm hone ke baad — balance automatically update ho gaya. No refresh needed."

**[SCREEN: Creator Withdraw]**

"Agar main is campaign ka creator hoon aur goal reach ho gaya hai — toh mujhe withdraw button milta hai."

"Confirm karta hoon — aur USDT seedha mere wallet mein aa jaate hain. Koi platform fee nahi. Koi waiting nahi."

---

**[CLOSE]**

"Yahi hai ChainFund ka mission — donations mein se middleman hatao, transparency lao, aur blockchain se trust build karo."

"Har rupee jahan jana chahiye — wahan pohonche."

---
---

## Option 2 — Story-Based (5-6 minute demo)

---

**[OPENING — PROBLEM STORY]**

"Ek real scenario se shuru karte hain."

"Ali ek IT professional hai Karachi mein. Usne ek online campaign dekhi — flood victims ke liye. 50,000 rupees donate kiye. Kuch hafte baad usne news mein dekha ke woh organization ke funds ka misuse hua."

"Ali ke paas koi proof nahi tha. Koi transparency nahi thi. Paisa gaya — kahan gaya — koi nahi jaanta."

"Yeh sirf Ali ki kahani nahi hai. Yeh millions of donors ki kahani hai."

---

**[THE REAL PROBLEMS]**

"Traditional donation aur crowdfunding systems mein 4 bari problems hain:"

**Problem 1 — No Transparency**
"Aap donate karte ho — phir faith pe rehte ho. Koi ledger nahi, koi proof nahi."

**Problem 2 — Middlemen**
"JazzCash leta hai cut. Platform leta hai cut. NGO admin leta hai cut. Actual beneficiary tak original amount ka 60-70% bhi nahi pohonchta sometimes."

**Problem 3 — No Accountability**
"Agar campaign ka goal reach nahi hua — funds kahan gaye? Koi jawab nahi."

**Problem 4 — Fraud**
"Fake campaigns easily ban sakti hain. Koi verification nahi, koi immutable record nahi."

---

**[CHAINFUND — THE SOLUTION]**

"ChainFund ne yeh soch ke build kiya ke blockchain in chaar problems ko permanently solve kar sakti hai."

"Yahan koi company nahi hai beech mein. Koi bank nahi. Sirf ek smart contract hai — jo Ethereum blockchain pe deploy hai — aur jo automatically sab kuch handle karta hai."

"Smart contract ke rules simple hain:"

"**Rule 1** — Contributor ka paisa smart contract mein lock hota hai — directly creator ke paas nahi jaata."

"**Rule 2** — Sirf jab goal reach ho — creator withdraw kar sakta hai. Goal nahi hua — paisa locked."

"**Rule 3** — Har transaction public hai. Koi bhi Etherscan pe jaake verify kar sakta hai."

"**Rule 4** — Koi bhi in rules ko change nahi kar sakta. Na creator, na platform, na hum."

---

**[LIVE DEMO]**

**[SCREEN: Homepage]**

"Yeh hai ChainFund. Abhi yeh Sepolia testnet pe chal rahi hai — jo Ethereum ka test network hai."

"Teen categories hain campaigns ki:"
- "**All Campaigns** — sab campaigns"
- "**Still Going** — jo abhi active hain, goal nahi hua"
- "**Goal Reached** — jin ka goal complete ho gaya"

**[SCREEN: Active Campaign]**

"Is active campaign pe click karte hain — Blankets for Street Sleepers."

"Yahan sab kuch transparent hai:"
- "Goal: 200 USDT"
- "Raised: 45 USDT — yeh real blockchain data hai"
- "Contributors: 5 log"
- "Deadline: 7 din baaki"

"Neeche dekho — Contributions table. Har contribution ka:"
- "Contributor wallet address"
- "Amount"
- "Transaction hash — jo blockchain pe verify ho sakta hai"

"Yeh data immutable hai — koi delete nahi kar sakta, koi change nahi kar sakta."

**[SCREEN: Wallet Connect]**

"Ab main contribute karta hoon. Pehle wallet connect karta hoon."

"MetaMask open hota hai — yeh mere wallet ka control hai. Platform ke paas mere wallet ki keys nahi hain — sirf main sign kar sakta hoon."

**[SCREEN: Contribute Form]**

"10 USDT contribute karta hoon."

"Submit karta hoon — dekho kya hota hai:"

"Pehle ek USDT Approve transaction — yeh ERC-20 standard hai — iska matlab main smart contract ko permission de raha hoon mere USDT spend karne ki."

"Phir Contribute transaction — yeh actual contribution hai jo smart contract mein lock hoti hai."

"Dono transactions blockchain pe record ho gayi. Koi undo nahi ho sakta."

**[SCREEN: Transaction Updated]**

"Dekho — table mein meri transaction aa gayi. Balance update ho gaya. Yeh sab automatic hai — koi manual update nahi."

**[SCREEN: Create Campaign]**

"Agar main ek campaign creator hoon — yahan se campaign bana sakta hoon."

"Title, description, goal amount USDT mein, aur duration. Submit karne pe smart contract pe deploy hoti hai."

---

**[IMPACT]**

"ChainFund se kya change hota hai:"

- "**Ali jaise donors** — ab har transaction track kar sakte hain. Proof hai ke paisa kahan gaya."
- "**NGOs aur creators** — transparent record rakhna easy hai. Donors ka trust build hota hai."
- "**Middlemen khatam** — 100% funds directly smart contract mein. Platform ka koi cut nahi."
- "**Global reach** — koi bhi duniya mein kahin se bhi USDT se contribute kar sakta hai."

---

**[CLOSE]**

"Blockchain ke baare mein aksar suna hota hai — lekin yahan iska ek real, practical use case hai."

"Charity aur crowdfunding mein transparency laana — yeh ek real problem hai. Aur ChainFund iska ek real solution hai."

"Thank you."

---
---

## Option 3 — Technical Audience (7-8 minute demo)

---

**[OPENING]**

"Aaj main ChainFund present karna chahta hoon — ek on-chain crowdfunding protocol jo Ethereum Sepolia pe deploy hai."

"Yeh ek Web3 dApp hai jo Next.js 14, ethers.js, aur Reown AppKit se bana hai — aur ek Solidity smart contract pe based hai."

"Pehle problem statement, phir architecture, phir live demo."

---

**[PROBLEM STATEMENT]**

"Traditional crowdfunding platforms — GoFundMe, JazzCash campaigns, local NGO portals — yeh sab centralized systems hain."

"Centralized matlab:"
- "Ek single point of failure — company band ho gayi, data gaya"
- "Ek single point of trust — aap platform pe trust karte ho, platform campaign pe trust karta hai"
- "Ek single point of corruption — funds intercept ho sakte hain"

"Blockchain yeh trust problem cryptographically solve karti hai."

---

**[ARCHITECTURE]**

"ChainFund ka architecture simple hai:"

**Smart Contract — Solidity**
"Ek CrowdFunding.sol contract hai jo yeh functions expose karta hai:"
- "`createCampaign()` — naya campaign on-chain register karo"
- "`contribute()` — USDT send karo campaign mein, ERC-20 approve + transfer"
- "`withdraw()` — sirf creator, sirf agar raised >= goal"
- "`getContributions()` — full transaction history on-chain"

"Funds creator ke paas directly nahi jaate — smart contract hold karta hai jab tak goal reach na ho."

**Frontend — Next.js 14**
"App Router use kar rahe hain. Wallet integration Reown AppKit se hai jo EIP-1193 injected provider expose karta hai."

"ethers.js BrowserProvider use karta hai wallet se sign transactions ke liye."

"Ek important implementation detail — Opera aur Chromium-based browsers mein MetaMask error 4100 aata tha second transaction pe approve ke baad. Humne `getAuthorizedSigner()` utility banayi jo `eth_requestAccounts` re-call karta hai after long-running `tx.wait()` — yeh issue fix karta hai."

**State Management**
"Zustand store hai transaction pending state ke liye — `isPending`, `txHash`, `message`. Yeh global loading screen drive karta hai jo `tx.hash` available hone ke baad live Etherscan link bhi show karta hai."

---

**[LIVE DEMO]**

**[SCREEN: Homepage — Tabs]**

"Teen tabs hain — All, Still Going, Goal Reached. Filtering client-side hai, useCampaigns hook se data aata hai jo read-only JsonRpcProvider use karta hai — wallet ki zaroorat nahi read ke liye."

**[SCREEN: Campaign Detail]**

"Campaign detail page pe `useCampaign` aur `useTransactions` dono calls hoti hain — public RPC se. Latest transactions upar show hoti hain — array reverse kar diya contract response ka."

"Contributor address check karta hai `useTransactions` data mein — agar already contributed hai toh form disable hoti hai."

**[SCREEN: Contribute Flow]**

"Contribution flow:"

"1. `usdtContract.allowance()` check — agar allowance < amount toh pehle approve"
"2. `approveTx.wait(1)` — 1 block confirmation"
"3. Re-authorize via `getAuthorizedSigner()` — fresh signer"
"4. `crowdContract.contribute()` — actual transaction"
"5. `tx.wait(1)` — confirmation"
"6. `triggerRefresh()` — Zustand store counter increment karta hai jo sab hooks ke useEffect ko re-trigger karta hai"

"Transaction loading screen real-time mein `txHash` dikhata hai — step 1 wallet signature, step 2 blockchain confirmation — dono visually indicated hain."

**[SCREEN: Create Campaign]**

"Campaign creation simple hai — ek transaction, `createCampaign()` call, goal USDT 6 decimals mein `parseUnits` se."

---

**[WHAT'S NEXT]**

"Possible extensions:"
- "Multi-token support — ETH, DAI"
- "Refund mechanism — agar deadline pass ho aur goal na reach ho"
- "On-chain voting for fund release"
- "IPFS for campaign images aur documents"
- "Mainnet deployment"

---

**[CLOSE]**

"Yeh project demonstrate karta hai ke blockchain ka real-world use case kya ho sakta hai — beyond speculation aur trading."

"Transparent, trustless, permissionless fundraising — yahi hai ChainFund."

"Questions?"

---

> **Note:** Option 1 general audience ke liye best hai. Option 2 storytelling format mein hai jo non-technical log easily samjhein. Option 3 developers aur technical judges ke liye hai.
