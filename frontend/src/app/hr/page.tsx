"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NeonCard from "@/components/NeonCard";
import NeonButton from "@/components/NeonButton";

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

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

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

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`${API_URL}/api/payroll/config`);
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch {
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
    <main className="min-h-[calc(100vh-4rem)] p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span>🏢</span>
          <span className="bg-gradient-to-r from-neon-indigo to-neon-cyan bg-clip-text text-transparent">
            HR Dashboard
          </span>
        </h1>
        <p className="text-gray-400 mt-1">
          Run payroll to stealth addresses on Base
        </p>
      </motion.div>

      {/* Payroll Mode Indicator */}
      {!configLoading && (
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <NeonCard
            glowColor={isBitGoMode ? "indigo" : isDirectMode ? "amber" : "rose"}
            hoverable={false}
            delay={0.1}
            className="mb-6 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Payroll Engine:</span>
                {isBitGoMode && (
                  <span className="px-3 py-1 bg-neon-indigo/10 border border-neon-indigo/30 rounded-full text-sm text-neon-indigo flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-neon-indigo rounded-full animate-pulse" />
                    BitGo Enterprise
                  </span>
                )}
                {isDirectMode && (
                  <span className="px-3 py-1 bg-neon-amber/10 border border-neon-amber/30 rounded-full text-sm text-neon-amber flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-neon-amber rounded-full" />
                    Direct Signing (ethers.js)
                  </span>
                )}
                {!isConfigured && (
                  <span className="px-3 py-1 bg-neon-rose/10 border border-neon-rose/30 rounded-full text-sm text-neon-rose flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-neon-rose rounded-full" />
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
              <p className="text-xs text-neon-rose mt-2">
                ❌ No payroll method configured. Set BITGO_ACCESS_TOKEN +
                BITGO_WALLET_ID or PAYROLL_PRIVATE_KEY in .env
              </p>
            )}
          </NeonCard>
        </motion.div>
      )}

      {/* BitGo Wallet Passphrase */}
      <AnimatePresence>
        {isBitGoMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <NeonCard glowColor="indigo" hoverable={false} className="mb-6 p-4">
              <label className="block text-sm font-medium text-neon-indigo mb-2">
                🔐 BitGo Wallet Passphrase
              </label>
              <input
                type="password"
                value={walletPassphrase}
                onChange={(e) => setWalletPassphrase(e.target.value)}
                placeholder="Enter your BitGo wallet passphrase to authorize the batch..."
                className="w-full px-4 py-2 bg-black/30 border border-neon-indigo/20 rounded-lg text-white placeholder-gray-600 focus:border-neon-indigo/50 transition-colors"
              />
              <p className="text-xs text-gray-600 mt-1">
                This passphrase unlocks your BitGo multi-sig wallet for signing
                the batch transaction.
              </p>
            </NeonCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employee List */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Employees</h2>
          <NeonButton variant="secondary" size="sm" onClick={addEmployee}>
            + Add Employee
          </NeonButton>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {employees.map((emp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <NeonCard
                  glowColor="indigo"
                  hoverable={false}
                  delay={0}
                  className="p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">
                      Employee #{i + 1}
                    </span>
                    {employees.length > 1 && (
                      <button
                        onClick={() => removeEmployee(i)}
                        className="text-neon-rose hover:text-neon-rose/80 text-sm transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={emp.ensName}
                      onChange={(e) =>
                        updateEmployee(i, "ensName", e.target.value)
                      }
                      placeholder="ENS name (e.g., alice.eth)"
                      className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:border-neon-indigo/50 text-sm transition-colors"
                    />
                    <input
                      type="text"
                      value={emp.metaPublicKey}
                      onChange={(e) =>
                        updateEmployee(i, "metaPublicKey", e.target.value)
                      }
                      placeholder="Stealth meta public key (hex)"
                      className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:border-neon-indigo/50 text-sm font-mono transition-colors"
                    />
                    <input
                      type="text"
                      value={emp.amountETH}
                      onChange={(e) =>
                        updateEmployee(i, "amountETH", e.target.value)
                      }
                      placeholder="ETH amount (in wei)"
                      className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:border-neon-indigo/50 text-sm transition-colors"
                    />
                  </div>
                </NeonCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Run Payroll Button */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <NeonButton
          onClick={runPayroll}
          disabled={!canRun}
          fullWidth
          size="lg"
          glowing={canRun}
        >
          {isRunning
            ? "⏳ Processing Payroll..."
            : isBitGoMode
              ? "🏦 Run BitGo Stealth Payroll"
              : "🚀 Run Stealth Payroll"}
        </NeonButton>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <NeonCard
              glowColor="rose"
              hoverable={false}
              className="mt-6 p-4"
            >
              <p className="text-neon-rose">❌ {error}</p>
            </NeonCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <NeonCard
              glowColor="emerald"
              hoverable={false}
              className="mt-6 p-6"
            >
              <h3 className="text-lg font-semibold text-neon-emerald mb-3">
                ✅ Payroll Executed Successfully
              </h3>
              <div className="space-y-2 text-sm">
                {/* Mode Badge */}
                <p className="text-gray-300 flex items-center gap-2">
                  <span className="text-gray-500">Mode:</span>
                  {result.mode === "bitgo" ? (
                    <span className="px-2 py-0.5 bg-neon-indigo/10 border border-neon-indigo/30 rounded text-xs text-neon-indigo">
                      BitGo Enterprise
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-neon-amber/10 border border-neon-amber/30 rounded text-xs text-neon-amber">
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
                    className="font-mono text-neon-cyan hover:underline"
                  >
                    {result.txHash}
                  </a>
                </p>

                {/* Additional TX Hashes */}
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
                            className="text-neon-cyan hover:underline"
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
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 bg-black/30 rounded-lg text-xs font-mono border border-white/5"
                    >
                      {key.ensName && (
                        <p className="text-gray-400 mb-1">
                          Employee:{" "}
                          <span className="text-white">{key.ensName}</span>
                        </p>
                      )}
                      <p className="text-gray-400">
                        Stealth:{" "}
                        <span className="text-white">
                          {key.stealthAddress}
                        </span>
                      </p>
                      <p className="text-gray-400 truncate">
                        Ephemeral:{" "}
                        <span className="text-white">
                          {key.ephemeralPublicKey}
                        </span>
                      </p>
                    </motion.div>
                  ))}
                </div>

                <NeonButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(result.ephemeralKeys, null, 2),
                    );
                  }}
                  className="mt-3"
                >
                  📋 Copy Ephemeral Keys as JSON
                </NeonButton>
              </div>
            </NeonCard>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
