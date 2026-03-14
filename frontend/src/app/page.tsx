import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="mb-6">
          <span className="text-6xl">🛡️</span>
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-privaroll-primary to-privaroll-secondary bg-clip-text text-transparent">
          PrivaRoll
        </h1>
        <p className="text-xl text-gray-400 mb-2">
          Public Solvency. Unlinkable Distributions.
        </p>
        <p className="text-lg text-gray-500 mb-8">
          Enterprise Web3 Payroll on Base
        </p>

        {/* Network Badge */}
        <div className="flex items-center justify-center gap-3 mb-12 flex-wrap">
          <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-sm text-blue-400">
            Deployed on Base EVM
          </span>
          <span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm text-purple-400">
            ENS Integrated
          </span>
          <span className="px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-full text-sm text-green-400">
            BitGo Enterprise
          </span>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link
            href="/hr"
            className="group p-6 border border-gray-800 rounded-xl hover:border-privaroll-primary/50 hover:bg-gray-900/50 transition-all"
          >
            <div className="text-3xl mb-3">🏢</div>
            <h2 className="text-lg font-semibold mb-2 group-hover:text-privaroll-primary transition-colors">
              HR Dashboard
            </h2>
            <p className="text-sm text-gray-500">
              Run payroll via BitGo multi-sig, batch ETH transfers to stealth
              addresses
            </p>
          </Link>

          <Link
            href="/employee"
            className="group p-6 border border-gray-800 rounded-xl hover:border-privaroll-secondary/50 hover:bg-gray-900/50 transition-all"
          >
            <div className="text-3xl mb-3">👤</div>
            <h2 className="text-lg font-semibold mb-2 group-hover:text-privaroll-secondary transition-colors">
              Employee Portal
            </h2>
            <p className="text-sm text-gray-500">
              Scan for paychecks, derive spending keys, sweep ETH to your wallet
            </p>
          </Link>

          <Link
            href="/setup"
            className="group p-6 border border-gray-800 rounded-xl hover:border-privaroll-accent/50 hover:bg-gray-900/50 transition-all"
          >
            <div className="text-3xl mb-3">⚙️</div>
            <h2 className="text-lg font-semibold mb-2 group-hover:text-privaroll-accent transition-colors">
              Setup & Keys
            </h2>
            <p className="text-sm text-gray-500">
              Generate stealth meta-keys, configure ENS text records, manage
              identity
            </p>
          </Link>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="mt-16 max-w-2xl mx-auto text-center">
        <h3 className="text-lg font-semibold text-gray-400 mb-4">
          How It Works
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 flex-wrap">
          <span className="px-3 py-1 bg-gray-800 rounded">ENS Meta-Key</span>
          <span>→</span>
          <span className="px-3 py-1 bg-gray-800 rounded">
            Stealth Derivation
          </span>
          <span>→</span>
          <span className="px-3 py-1 bg-blue-900/30 border border-blue-500/20 rounded text-blue-400">
            BitGo Batch TX
          </span>
          <span>→</span>
          <span className="px-3 py-1 bg-gray-800 rounded">
            Private Retrieval
          </span>
        </div>
      </div>

      {/* BitGo Integration Note */}
      <div className="mt-8 max-w-xl mx-auto text-center">
        <div className="p-4 border border-gray-800 rounded-xl bg-gray-900/30">
          <p className="text-xs text-gray-500">
            🏦 <strong className="text-gray-400">BitGo Enterprise Integration:</strong>{" "}
            HR multi-sig sends ETH to stealth addresses via BitGo&apos;s{" "}
            <code className="text-blue-400">sendMany</code> API. All transfers
            are batched, policy-enforced, and auditable — but recipients remain
            unlinkable on Base L2.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center text-gray-600 text-sm">
        <p>Built for ETHMumbai 2026 — Stealth Address Payroll on Base L2</p>
      </footer>
    </main>
  );
}
