# 🛡️ PrivaRoll (Base Edition)
**Public Solvency. Unlinkable Distributions. Enterprise Web3 Payroll on Base.**

[![Deployed on Base](https://img.shields.io/badge/Deployed_on-Base_EVM-blue?style=for-the-badge)](https://base.org)
[![Powered by BitGo](https://img.shields.io/badge/Powered_by-BitGo_SDK-orange?style=for-the-badge)](https://bitgo.com)
[![ENS Integrated](https://img.shields.io/badge/Integrated-ENS-blueviolet?style=for-the-badge)](https://ens.domains)

## 🛑 The Problem: Web3 Payroll is a Privacy Disaster
In traditional blockchain transactions, amounts and recipients are completely public. For payroll, this is catastrophic. Anyone—competitors, colleagues, or malicious actors—can analyze a company's burn rate, compare salaries, and target high-earning employees. 

**PrivaRoll** solves this by combining the speed and scale of **Base EVM** with **Stealth Addresses** and **BitGo's Enterprise Policies**. We enable companies to disburse payroll on-chain without ever linking a specific salary to a specific employee's main identity.

---

## 🏆 Hackathon Tracks & Bounties Addressed

We purposely built PrivaRoll's architecture to push the boundaries of Web3 privacy and enterprise composability:

* **🏦 BitGo DeFi Composability & Privacy:** PrivaRoll utilizes BitGo's SDK to programmatically generate fresh, one-time stealth addresses per transaction. We disburse funds from a BitGo multisig to these unlinkable recipient addresses on Base EVM, fulfilling the exact prompt for the BitGo privacy track.
* **🛡️ Privacy (Private Transaction Rails):** By implementing stealth address architecture (ERC-5564 concepts) on Base, we break the link between the sender (Company) and the receiver (Employee identity). The public sees USDC moving, but cannot map salaries to individuals.
* **🌐 ENS Integration (Creative Application):** We integrated ENS so employees can register their Stealth Meta-Addresses to their public `.eth` names. HR simply enters `alice.eth`, and the protocol derives the one-time stealth address for that specific pay period automatically.
* **🌟 BEST Project:** A massive TradFi/Web3 friction point solved with a beautiful, production-ready demo on Base L2.

---

## 🧠 Core Architecture

PrivaRoll operates using an Off-Chain Calculation / On-Chain Obfuscation model:

1. **ENS Registry:** Employees publish their Stealth Meta-Keys to their ENS text records.
2. **Payroll Computation:** HR calculates the net pay (base + bonus - deductions) in their local, secure dashboard.
3. **Stealth Derivation:** For a payroll run, PrivaRoll's backend reads the ENS Meta-Keys and generates a unique, single-use Base EVM address for every employee.
4. **Institutional Execution:** HR submits the batch payroll request to the `IssuerMultisig` (managed by BitGo). Once approved by the CFO, the BitGo SDK broadcasts the batch USDC transfers on the Base network.
5. **Private Retrieval:** The employee's local client scans the Base network, detects the stealth payment using their private viewing key, and grants them access to their USDC.

### The "Break-Glass" Compliance Engine
If an auditor requires access to payroll records:
1. Auditor submits a request via `GovMultisig` (BitGo).
2. Company approves via `IssuerMultisig`.
3. **BitGo SDK Policy triggers a 24-hour time-delay lock.**
4. Post-timelock, the system exports the cryptographic link between the stealth addresses and the employee's main identity for that specific pay period only.

---

## 🛠️ Tech Stack

* **Blockchain:** Base EVM (L2) — [docs.base.org](https://docs.base.org/get-started/base)
* **Institutional Governance:** BitGo JS SDK — [developers.bitgo.com](https://developers.bitgo.com/docs/get-started-quick-start)
* **Privacy Layer:** Stealth Address Cryptography (Diffie-Hellman key exchange, ERC-5564)
* **Frontend Identity:** ENS (wagmi, viem)
* **Web App:** Next.js 14 (App Router), Tailwind CSS
* **Cryptography:** @noble/secp256k1, ethers.js v6

---

## 📁 Project Structure

```
PrivaRoll/
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules
├── README.md               # This file
│
├── contracts/              # Smart Contracts (Hardhat + Solidity)
│   ├── contracts/
│   │   └── StealthKeyRegistry.sol   # On-chain stealth key & ephemeral key registry
│   ├── scripts/
│   │   └── deploy.ts               # Deployment script for Base Sepolia
│   ├── test/
│   │   └── StealthKeyRegistry.test.ts
│   ├── hardhat.config.ts           # Hardhat config (Base Sepolia/Mainnet)
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                # Backend Server (Express + BitGo SDK)
│   ├── src/
│   │   ├── index.ts                # Express server entry point
│   │   ├── lib/
│   │   │   └── stealth.ts          # Stealth address cryptography (ECDH)
│   │   ├── routes/
│   │   │   ├── health.ts           # Health check endpoint
│   │   │   ├── payroll.ts          # POST /api/payroll/run, GET /api/payroll/balance
│   │   │   └── stealth.ts          # Stealth key generation & scanning endpoints
│   │   └── services/
│   │       └── bitgoPayroll.ts     # BitGo SDK integration (sendMany batch TX)
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/               # Frontend (Next.js 14 + Tailwind CSS)
    ├── src/
    │   ├── app/
    │   │   ├── globals.css          # Tailwind global styles
    │   │   ├── layout.tsx           # Root layout with providers
    │   │   ├── page.tsx             # Home page (dashboard selector)
    │   │   └── providers.tsx        # Wagmi + React Query providers
    │   ├── components/
    │   │   └── EmployeeInput.tsx    # ENS-integrated employee lookup
    │   └── lib/
    │       └── stealth.ts           # Client-side stealth crypto library
    ├── next.config.js
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── package.json
    └── tsconfig.json
```

---

## 💻 Quick Start (Local Development)

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- A [BitGo Test Account](https://app.bitgo-test.com/signup) with an access token
- Base Sepolia ETH for gas (from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

### 1. Clone & Configure Environment

```bash
git clone https://github.com/your-org/PrivaRoll.git
cd PrivaRoll

# Copy the environment template
cp .env.example .env

# Edit .env and fill in your values:
#   - BITGO_ACCESS_TOKEN (from https://app.bitgo-test.com)
#   - DEPLOYER_PRIVATE_KEY (your testnet wallet)
#   - BITGO_HR_WALLET_ID (after creating a wallet in BitGo)
```

### 2. Smart Contracts (Base Sepolia Deploy)

```bash
cd contracts
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.ts --network base_sepolia

# After deployment, copy the StealthKeyRegistry address to your .env:
#   STEALTH_REGISTRY_ADDRESS=0x...
#   NEXT_PUBLIC_STEALTH_REGISTRY_ADDRESS=0x...
```

### 3. Backend Server

```bash
cd ../backend
npm install

# Start development server (with hot-reload)
npm run dev

# Server runs on http://localhost:4000
# Health check: GET http://localhost:4000/api/health
```

### 4. Frontend (Next.js)

```bash
cd ../frontend
npm install

# Start development server
npm run dev

# App runs on http://localhost:3000
```

---

## 🔑 BitGo Setup Guide

Follow the [BitGo Quick Start](https://developers.bitgo.com/docs/get-started-quick-start):

1. **Create a Test Account:** Go to [app.bitgo-test.com/signup](https://app.bitgo-test.com/signup)
2. **Create an Access Token:** In account settings, generate a long-lived token
3. **Create a Wallet:** Using the SDK or dashboard, create a `tbase:usdc` wallet
4. **Fund the Wallet:** Transfer testnet USDC to your BitGo wallet
5. **Set the Token:** Add `BITGO_ACCESS_TOKEN` to your `.env` file

```javascript
// Quick test to verify your BitGo connection:
const { BitGo } = require('bitgo');
const bitgo = new BitGo({ env: 'test' });
bitgo.authenticateWithAccessToken({ accessToken: 'YOUR_TOKEN' });
```

---

## 🌐 Base Network Reference

| Property | Base Sepolia (Testnet) | Base Mainnet |
|----------|----------------------|--------------|
| Chain ID | 84532 | 8453 |
| RPC URL | https://sepolia.base.org | https://mainnet.base.org |
| Explorer | https://sepolia.basescan.org | https://basescan.org |
| Docs | [docs.base.org](https://docs.base.org/get-started/base) | [docs.base.org](https://docs.base.org) |

---

## 📡 API Endpoints

### Backend (Express — port 4000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/payroll/run` | Execute batch payroll via BitGo |
| GET | `/api/payroll/balance` | Get HR wallet balance |
| POST | `/api/stealth/generate-meta-keys` | Generate new stealth meta-keys |
| POST | `/api/stealth/derive-address` | Derive a one-time stealth address |
| POST | `/api/stealth/scan` | Scan for payments matching your key |

---

## 🔒 Security Notes

- **Never commit `.env` files** — they contain private keys and API tokens
- **Stealth private keys** are generated and stored locally by employees
- **BitGo policies** enforce multi-sig approval for all payroll transactions
- **24-hour timelock** on compliance data exports prevents unauthorized access
- All stealth address math uses **@noble/secp256k1** (audited, zero-dependency)

---

## 📜 License

MIT — See [LICENSE](./LICENSE) for details.