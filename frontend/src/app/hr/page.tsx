"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Employee {
  ensName: string;
  metaPublicKey: string;
  amountETH: string;
}

interface PayrollConfig {
  mode: "bitgo" | "direct" | "none";
  configured: boolean;
  bitgoEnabled: boolean;
  directEnabled: boolean;
  coin: string;
}

interface PayrollResult {
  success: boolean;
  mode: string;
  txHash: string;
  allTxHashes?: string[];
  ephemeralKeys: Array<{
    ensName?: string;
    ephemeralPublicKey: string;
    stealthAddress: string;
  }>;
  recipientCount: number;
  timestamp: string;
}

export default function HRDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([
    { ensName: "", metaPublicKey: "", amountETH: "" },
  ]);
  const [walletPassphrase, setWalletPassphrase] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PayrollResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<PayrollConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Fetch payroll config on mount to determine mode
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`${API_URL}/api/payroll/config`);
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch {
        // Config endpoint not available; default to unknown
        setConfig({
          mode: "none",
          configured: false,
          bitgoEnabled: false,
          directEnabled: false,
          coin: "tbaseeth",
        });
      } finally {
        setConfigLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const addEmployee = () => {
    setEmployees([
      ...employees,
      { ensName: "", metaPublicKey: "", amountETH: "" },
    ]);
  };

  const removeEmployee = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const updateEmployee = (
    index: number,
    field: keyof Employee,
    value: string,
  ) => {
    const updated = [...employees];
    updated[index][field] = value;
    setEmployees(updated);
  };

  const runPayroll = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/api/payroll/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletPassphrase:
            config?.mode === "bitgo" ? walletPassphrase : undefined,
          employees,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payroll run failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const isBitGoMode = config?.mode === "bitgo";
  const isDirectMode = config?.mode === "direct";
  const isConfigured = config?.configured ?? false;

  const canRun =
    !isRunning &&
    employees.length > 0 &&
    employees.some((e) => e.metaPublicKey.trim()) &&
    (isBitGoMode ? walletPassphrase.trim().length > 0 : true);

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 mb-2 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span>🏢</span>
            <span className="bg-gradient-to-r from-privaroll-primary to-privaroll-secondary bg-clip-text text-transparent">
              HR Dashboard
            </span>
          </h1>
          <p className="text-gray-400 mt-1">
            Run payroll to stealth addresses on Base
          </p>
        </div>
      </div>

      {/* Payroll Mode Indicator */}
      {!configLoading && (
        <div className="mb-6 p-4 border border-gray-800 rounded-xl bg-gray-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Payroll Engine:</span>
              {isBitGoMode && (
                <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-sm text-blue-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  BitGo Enterprise
                </span>
              )}
              {isDirectMode && (
                <span className="px-3 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded-full text-sm text-yellow-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                  Direct Signing (ethers.js)
                </span>
              )}
              {!isConfigured && (
                <span className="px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-full text-sm text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  Not Configured
                </span>
              )}
            </div>
            {isBitGoMode && config?.coin && (
              <span className="text-xs text-gray-500 font-mono">
                {config.coin}
              </span>
            )}
          </div>
          {isBitGoMode && (
            <p className="text-xs text-gray-600 mt-2">
              💡 Using BitGo multi-sig wallet for batch transactions. Requires
              wallet passphrase to sign.
            </p>
          )}
          {isDirectMode && (
            <p className="text-xs text-gray-600 mt-2">
              ⚠️ Using server-side private key for direct signing. Configure
              BITGO_ACCESS_TOKEN for enterprise mode.
            </p>
          )}
          {!isConfigured && (
            <p className="text-xs text-red-400 mt-2">
              ❌ No payroll method configured. Set BITGO_ACCESS_TOKEN +
              BITGO_WALLET_ID or PAYROLL_PRIVATE_KEY in .env
            </p>
          )}
        </div>
      )}

      {/* BitGo Wallet Passphrase (only shown in BitGo mode) */}
      {isBitGoMode && (
        <div className="mb-6 p-4 border border-blue-500/20 rounded-xl bg-blue-900/10">
          <label className="block text-sm font-medium text-blue-400 mb-2">
            🔐 BitGo Wallet Passphrase
          </label>
          <input
            type="password"
            value={walletPassphrase}
            onChange={(e) => setWalletPassphrase(e.target.value)}
            placeholder="Enter your BitGo wallet passphrase to authorize the batch..."
            className="w-full px-4 py-2 bg-gray-800 border border-blue-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-600 mt-1">
            This passphrase unlocks your BitGo multi-sig wallet for signing the
            batch transaction.
          </p>
        </div>
      )}

      {/* Employee List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Employees</h2>
          <button
            onClick={addEmployee}
            className="px-4 py-2 bg-privaroll-primary/20 border border-privaroll-primary/50 rounded-lg text-privaroll-primary hover:bg-privaroll-primary/30 transition-colors text-sm"
          >
            + Add Employee
          </button>
        </div>

        <div className="space-y-4">
          {employees.map((emp, i) => (
            <div
              key={i}
              className="p-4 border border-gray-800 rounded-xl bg-gray-900/50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Employee #{i + 1}</span>
                {employees.length > 1 && (
                  <button
                    onClick={() => removeEmployee(i)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={emp.ensName}
                  onChange={(e) => updateEmployee(i, "ensName", e.target.value)}
                  placeholder="ENS name (e.g., alice.eth)"
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-privaroll-primary text-sm"
                />
                <input
                  type="text"
                  value={emp.metaPublicKey}
                  onChange={(e) =>
                    updateEmployee(i, "metaPublicKey", e.target.value)
                  }
                  placeholder="Stealth meta public key (hex)"
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-privaroll-primary text-sm font-mono"
                />
                <input
                  type="text"
                  value={emp.amountETH}
                  onChange={(e) =>
                    updateEmployee(i, "amountETH", e.target.value)
                  }
                  placeholder="ETH amount (in wei)"
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-privaroll-primary text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Run Payroll Button */}
      <button
        onClick={runPayroll}
        disabled={!canRun}
        className="w-full py-3 bg-gradient-to-r from-privaroll-primary to-privaroll-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning
          ? "⏳ Processing Payroll..."
          : isBitGoMode
            ? "🏦 Run BitGo Stealth Payroll"
            : "🚀 Run Stealth Payroll"}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 border border-red-500/50 rounded-xl bg-red-900/20">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 p-6 border border-green-500/50 rounded-xl bg-green-900/20">
          <h3 className="text-lg font-semibold text-green-400 mb-3">
            ✅ Payroll Executed Successfully
          </h3>
          <div className="space-y-2 text-sm">
            {/* Mode Badge */}
            <p className="text-gray-300 flex items-center gap-2">
              <span className="text-gray-500">Mode:</span>
              {result.mode === "bitgo" ? (
                <span className="px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 rounded text-xs text-blue-400">
                  BitGo Enterprise
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-yellow-600/20 border border-yellow-500/30 rounded text-xs text-yellow-400">
                  Direct Signing
                </span>
              )}
            </p>

            {/* TX Hash */}
            <p className="text-gray-300">
              <span className="text-gray-500">TX Hash:</span>{" "}
              <a
                href={`https://sepolia.basescan.org/tx/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-privaroll-secondary hover:underline"
              >
                {result.txHash}
              </a>
            </p>

            {/* Additional TX Hashes (direct mode) */}
            {result.allTxHashes && result.allTxHashes.length > 1 && (
              <div className="text-gray-300">
                <span className="text-gray-500">All TX Hashes:</span>
                <div className="mt-1 space-y-1">
                  {result.allTxHashes.map((hash, i) => (
                    <p key={i} className="font-mono text-xs">
                      <a
                        href={`https://sepolia.basescan.org/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-privaroll-secondary hover:underline"
                      >
                        {hash}
                      </a>
                    </p>
                  ))}
                </div>
              </div>
            )}

            <p className="text-gray-300">
              <span className="text-gray-500">Recipients:</span>{" "}
              {result.recipientCount}
            </p>
            <p className="text-gray-300">
              <span className="text-gray-500">Timestamp:</span>{" "}
              {result.timestamp}
            </p>
          </div>

          {/* Ephemeral Keys */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Ephemeral Keys (for on-chain publishing)
            </h4>
            <div className="space-y-2">
              {result.ephemeralKeys.map((key, i) => (
                <div
                  key={i}
                  className="p-3 bg-gray-800 rounded-lg text-xs font-mono"
                >
                  {key.ensName && (
                    <p className="text-gray-400 mb-1">
                      Employee:{" "}
                      <span className="text-white">{key.ensName}</span>
                    </p>
                  )}
                  <p className="text-gray-400">
                    Stealth:{" "}
                    <span className="text-white">{key.stealthAddress}</span>
                  </p>
                  <p className="text-gray-400 truncate">
                    Ephemeral:{" "}
                    <span className="text-white">{key.ephemeralPublicKey}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Copy JSON button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(result.ephemeralKeys, null, 2),
                );
              }}
              className="mt-3 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-xs"
            >
              📋 Copy Ephemeral Keys as JSON
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
