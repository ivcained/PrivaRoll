"use client";

import Link from "next/link";
import { useState } from "react";

interface ScanMatch {
  stealthAddress: string;
  ephemeralPublicKey: string;
  derivedAddress: string;
}

export default function EmployeePortal() {
  const [stealthPrivateKey, setStealthPrivateKey] = useState("");
  const [ephemeralKeysJson, setEphemeralKeysJson] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [matches, setMatches] = useState<ScanMatch[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanForPayments = async () => {
    setIsScanning(true);
    setError(null);
    setMatches([]);
    setScanComplete(false);

    try {
      let ephemeralKeys;
      try {
        ephemeralKeys = JSON.parse(ephemeralKeysJson);
      } catch {
        throw new Error(
          "Invalid JSON format for ephemeral keys. Expected an array of { ephemeralPublicKey, stealthAddress }",
        );
      }

      const res = await fetch(`/api/stealth/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stealthPrivateKey, ephemeralKeys }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Scan failed");
      }

      setMatches(data.matches);
      setScanComplete(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-300 mb-2 inline-block"
        >
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span>👤</span>
          <span className="bg-gradient-to-r from-privaroll-secondary to-privaroll-primary bg-clip-text text-transparent">
            Employee Portal
          </span>
        </h1>
        <p className="text-gray-400 mt-1">
          Scan for stealth paychecks and derive spending keys
        </p>
      </div>

      {/* How it works */}
      <div className="mb-8 p-4 border border-gray-800 rounded-xl bg-gray-900/30">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">
          How It Works
        </h3>
        <ol className="text-sm text-gray-500 space-y-1 list-decimal list-inside">
          <li>Enter your stealth private key (generated during Setup)</li>
          <li>Paste the ephemeral keys from the latest payroll run</li>
          <li>The scanner checks which stealth addresses belong to you</li>
          <li>
            Use the derived spending key to sweep USDC to your main wallet
          </li>
        </ol>
      </div>

      {/* Private Key Input */}
      <div className="mb-6 p-4 border border-gray-800 rounded-xl bg-gray-900/50">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Your Stealth Private Key
        </label>
        <input
          type="password"
          value={stealthPrivateKey}
          onChange={(e) => setStealthPrivateKey(e.target.value)}
          placeholder="Enter your stealth meta private key (hex)..."
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-privaroll-secondary font-mono text-sm"
        />
        <p className="text-xs text-gray-600 mt-1">
          ⚠️ This key never leaves your browser. It&apos;s only used for local
          computation.
        </p>
      </div>

      {/* Ephemeral Keys Input */}
      <div className="mb-6 p-4 border border-gray-800 rounded-xl bg-gray-900/50">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Ephemeral Keys from Payroll Run
        </label>
        <textarea
          value={ephemeralKeysJson}
          onChange={(e) => setEphemeralKeysJson(e.target.value)}
          placeholder={`Paste JSON array, e.g.:\n[\n  { "ephemeralPublicKey": "02abc...", "stealthAddress": "0x..." },\n  { "ephemeralPublicKey": "03def...", "stealthAddress": "0x..." }\n]`}
          rows={6}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-privaroll-secondary font-mono text-sm"
        />
      </div>

      {/* Scan Button */}
      <button
        onClick={scanForPayments}
        disabled={isScanning || !stealthPrivateKey || !ephemeralKeysJson}
        className="w-full py-3 bg-gradient-to-r from-privaroll-secondary to-privaroll-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isScanning
          ? "🔍 Scanning for Payments..."
          : "🔍 Scan for My Paychecks"}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 border border-red-500/50 rounded-xl bg-red-900/20">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {/* Results */}
      {scanComplete && (
        <div className="mt-6">
          {matches.length > 0 ? (
            <div className="p-6 border border-green-500/50 rounded-xl bg-green-900/20">
              <h3 className="text-lg font-semibold text-green-400 mb-3">
                ✅ Found {matches.length} Payment
                {matches.length > 1 ? "s" : ""}!
              </h3>
              <div className="space-y-3">
                {matches.map((match, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <p className="text-sm text-gray-400 mb-1">
                      Payment #{i + 1}
                    </p>
                    <p className="text-xs font-mono text-gray-300 mb-1">
                      <span className="text-gray-500">Stealth Address: </span>
                      <a
                        href={`https://sepolia.basescan.org/address/${match.stealthAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-privaroll-secondary hover:underline"
                      >
                        {match.stealthAddress}
                      </a>
                    </p>
                    <p className="text-xs font-mono text-gray-300 truncate">
                      <span className="text-gray-500">
                        Ephemeral Public Key:{" "}
                      </span>
                      {match.ephemeralPublicKey}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-4">
                💡 Use your stealth private key + the ephemeral public key to
                derive the spending key and sweep the USDC.
              </p>
            </div>
          ) : (
            <div className="p-6 border border-yellow-500/50 rounded-xl bg-yellow-900/20">
              <h3 className="text-lg font-semibold text-yellow-400">
                🔍 No Payments Found
              </h3>
              <p className="text-sm text-gray-400 mt-2">
                No stealth addresses in this payroll run match your key. This
                could mean:
              </p>
              <ul className="text-sm text-gray-500 mt-2 list-disc list-inside">
                <li>You were not included in this payroll run</li>
                <li>The ephemeral keys are from a different run</li>
                <li>Your private key may be incorrect</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
