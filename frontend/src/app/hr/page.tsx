"use client";

import Link from "next/link";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Employee {
  ensName: string;
  metaPublicKey: string;
  amountUSDC: string;
}

interface PayrollResult {
  success: boolean;
  txHash: string;
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
    { ensName: "", metaPublicKey: "", amountUSDC: "" },
  ]);
  const [walletPassphrase, setWalletPassphrase] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PayrollResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addEmployee = () => {
    setEmployees([
      ...employees,
      { ensName: "", metaPublicKey: "", amountUSDC: "" },
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
        body: JSON.stringify({ walletPassphrase, employees }),
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
            Run payroll to stealth addresses via BitGo on Base
          </p>
        </div>
      </div>

      {/* Wallet Passphrase */}
      <div className="mb-6 p-4 border border-gray-800 rounded-xl bg-gray-900/50">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          BitGo Wallet Passphrase
        </label>
        <input
          type="password"
          value={walletPassphrase}
          onChange={(e) => setWalletPassphrase(e.target.value)}
          placeholder="Enter wallet passphrase..."
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-privaroll-primary"
        />
      </div>

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
                  value={emp.amountUSDC}
                  onChange={(e) =>
                    updateEmployee(i, "amountUSDC", e.target.value)
                  }
                  placeholder="USDC amount (base units)"
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
        disabled={isRunning || !walletPassphrase || employees.length === 0}
        className="w-full py-3 bg-gradient-to-r from-privaroll-primary to-privaroll-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? "⏳ Processing Payroll..." : "🚀 Run Stealth Payroll"}
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
          </div>
        </div>
      )}
    </main>
  );
}
