# 🛡️ PrivaRoll (Base Edition)
**Public Solvency. Unlinkable Distributions. Enterprise Web3 Payroll on Base.**

[![Deployed on Base](https://img.shields.io/badge/Deployed_on-Base_EVM-blue?style=for-the-badge)](https://base.org)
[![ENS Integrated](https://img.shields.io/badge/Integrated-ENS-blueviolet?style=for-the-badge)](https://ens.domains)

## 🛑 The Problem: Web3 Payroll is a Privacy Disaster
In traditional blockchain transactions, amounts and recipients are completely public. For payroll, this is catastrophic. Anyone—competitors, colleagues, or malicious actors—can analyze a company's burn rate, compare salaries, and target high-earning employees. 

**PrivaRoll** solves this by combining the speed and scale of **Base EVM** with **Stealth Addresses**. We enable companies to disburse payroll on-chain without ever linking a specific salary to a specific employee's main identity.

---

## 🏆 Hackathon Tracks & Bounties Addressed

We purposely built PrivaRoll's architecture to push the boundaries of Web3 privacy and enterprise composability:

* **🛡️ Privacy (Private Transaction Rails):** By implementing stealth address architecture (ERC-5564 concepts) on Base, we break the link between the sender (Company) and the receiver (Employee identity). The public sees ETH moving, but cannot map salaries to individuals.
* **🌐 ENS Integration (Creative Application):** We integrated ENS so employees can register their Stealth Meta-Addresses to their public `.eth` names. HR simply enters `alice.eth`, and the protocol derives the one-time stealth address for that specific pay period automatically.
* **🌟 BEST Project:** A massive TradFi/Web3 friction point solved with a beautiful, production-ready demo on Base L2.

---

## 🧠 Core Architecture

PrivaRoll operates using an Off-Chain Calculation / On-Chain Obfuscation model:

1. **ENS Registry:** Employees publish their Stealth Meta-Keys to their ENS text records.
2. **Payroll Computation:** HR calculates the net pay (base + bonus - deductions) in their local, secure dashboard.
3. **Stealth Derivation:** For a payroll run, PrivaRoll's backend reads the ENS Meta-Keys and generates a unique, single-use Base EVM address for every employee.
4. **Batch Execution:** HR submits the batch payroll request. The system broadcasts ETH transfers to the generated stealth addresses on the Base network.
5. **Private Retrieval:** The employee's local client scans the Base network, detects the stealth payment using their private viewing key, and grants them access to their funds.

---

## 🛠️ Tech Stack

* **Blockchain:** Base EVM (L2) — [docs.base.org](https://docs.base.org/get-started/base)
* **Privacy Layer:** Stealth Address Cryptography (Diffie-Hellman key exchange, ERC-5564)
* **Frontend Identity:** ENS (wagmi, viem)
* **Web App:** Next.js 14 (App Router), Tailwind CSS
* **Cryptography:** @noble/secp256k1, ethers.js v6

---

## 📁 Project Structure

```
PrivaRoll/
├── .env                    # Environment variables (DO NOT COMMIT)
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
├── backend/                # Backend Server (Express)
│   ├── src/
│   │   ├── index.ts                # Express server entry point
│   │   ├── lib/
│   │   │   └── stealth.ts          # Stealth address cryptography (ECDH)
│   │   └── routes/
│   │       ├── health.ts           # Health check endpoint
│   │       ├── payroll.ts          # POST /api/payroll/run
│   │       └── stealth.ts          # Stealth key generation & scanning endpoints
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/               # Frontend (Next.js 14 + Tailwind CSS)
    ├── src/
    │   ├── app/
    │   │   ├── globals.css          # Tailwind global styles
    │   │   ├── layout.tsx           # Root layout with providers
    │   │   ├── page.tsx             # Home page (dashboard selector)
    │   │   ├── providers.tsx        # Wagmi + React Query providers
    │   │   ├── hr/
    │   │   │   └── page.tsx         # HR Dashboard (run payroll)
    │   │   ├── employee/
    │   │   │   └── page.tsx         # Employee Portal (scan & claim)
    │   │   └── setup/
    │   │       └── page.tsx         # Setup & Keys (generate meta-keys)
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
- Base Sepolia ETH for gas (from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

### 1. Clone & Configure Environment

```bash
git clone https://github.com/your-org/PrivaRoll.git
cd PrivaRoll

# Copy the environment template
cp .env.example .env

# Edit .env and fill in your values:
#   - DEPLOYER_PRIVATE_KEY (your testnet wallet)
#   - PAYROLL_PRIVATE_KEY (HR payroll signing wallet)
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
| POST | `/api/payroll/run` | Execute batch payroll to stealth addresses |
| POST | `/api/stealth/generate-meta-keys` | Generate new stealth meta-keys |
| POST | `/api/stealth/derive-address` | Derive a one-time stealth address |
| POST | `/api/stealth/scan` | Scan for payments matching your key |

---

## 🔒 Security Notes

- **Never commit `.env` files** — they contain private keys and API tokens
- **Stealth private keys** are generated and stored locally by employees
- **24-hour timelock** on compliance data exports prevents unauthorized access
- All stealth address math uses **@noble/secp256k1** (audited, zero-dependency)

---

## 📜 License

MIT — See [LICENSE](./LICENSE) for details.
