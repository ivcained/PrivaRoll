"use client";

import Link from "next/link";
import { useState } from "react";
import { deriveStealthPrivateKey } from "@/lib/stealth";

interface EphemeralKeyEntry {
  ephemeralPublicKey: string;
  stealthAddress: string;
}

interface ScanMatch {
  stealthAddress: string;
  ephemeralPublicKey: string;
  derivedAddress: string;
}

interface SweepResult {
  success: boolean;
  txHash: string;
  from: string;
  to: string;
  amount: string;
}

export default function EmployeePortal() {
  const [stealthPrivateKey, setStealthPrivateKey] = useState("");
  const [ephemeralEntries, setEphemeralEntries] = useState<EphemeralKeyEntry[]>(
    [{ ephemeralPublicKey: "", stealthAddress: "" }],
  );
  const [inputMode, setInputMode] = useState<"form" | "json">("form");
  const [ephemeralKeysJson, setEphemeralKeysJson] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [matches, setMatches] = useState<ScanMatch[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive & Sweep state
  const [destinationAddress, setDestinationAddress] = useState("");
  const [derivedKeys, setDerivedKeys] = useState<
    Map<string, { privateKey: string; address: string }>
  >(new Map());
  const [isSweeping, setIsSweeping] = useState<string | null>(null);
  const [sweepResults, setSweepResults] = useState<Map<string, SweepResult>>(
    new Map(),
  );
  const [sweepError, setSweepError] = useState<string | null>(null);

  const addEphemeralEntry = () => {
    setEphemeralEntries([
      ...ephemeralEntries,
      { ephemeralPublicKey: "", stealthAddress: "" },
    ]);
  };

  const removeEphemeralEntry = (index: number) => {
    setEphemeralEntries(ephemeralEntries.filter((_, i) => i !== index));
  };

  const updateEphemeralEntry = (
    index: number,
    field: keyof EphemeralKeyEntry,
    value: string,
  ) => {
    const updated = [...ephemeralEntries];
    updated[index][field] = value;
    setEphemeralEntries(updated);
  };

  const hasValidEphemeralKeys = () => {
    if (inputMode === "json") {
      return ephemeralKeysJson.trim().length > 0;
    }
    return ephemeralEntries.some(
      (e) => e.ephemeralPublicKey.trim() && e.stealthAddress.trim(),
    );
  };

  const scanForPayments = async () => {
    setIsScanning(true);
    setError(null);
    setMatches([]);
    setScanComplete(false);
    setDerivedKeys(new Map());
    setSweepResults(new Map());

    try {
      let ephemeralKeys: EphemeralKeyEntry[];

      if (inputMode === "json") {
        try {
          ephemeralKeys = JSON.parse(ephemeralKeysJson);
        } catch {
          throw new Error(
            "Invalid JSON format. Expected an array of { ephemeralPublicKey, stealthAddress }",
          );
        }
      } else {
        ephemeralKeys = ephemeralEntries.filter(
          (e) => e.ephemeralPublicKey.trim() && e.stealthAddress.trim(),
        );
        if (ephemeralKeys.length === 0) {
          throw new Error(
            "Please enter at least one ephemeral key entry with both fields filled in.",
          );
        }
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

      // Auto-derive spending keys for all matches
      if (data.matches.length > 0) {
        const keys = new Map<string, { privateKey: string; address: string }>();
        for (const match of data.matches) {
          try {
            const wallet = deriveStealthPrivateKey(
              stealthPrivateKey,
              match.ephemeralPublicKey,
            );
            keys.set(match.stealthAddress, {
              privateKey: wallet.privateKey,
              address: wallet.address,
            });
          } catch (err: any) {
            console.error(
              `Failed to derive key for ${match.stealthAddress}:`,
              err,
            );
          }
        }
        setDerivedKeys(keys);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const sweepETH = async (
    stealthAddress: string,
    ephemeralPublicKey: string,
  ) => {
    if (!destinationAddress) {
      setSweepError("Please enter a destination address first");
      return;
    }

    const derivedKey = derivedKeys.get(stealthAddress);
    if (!derivedKey) {
      setSweepError("Spending key not derived for this address");
      return;
    }

    setIsSweeping(stealthAddress);
    setSweepError(null);

    try {
      const res = await fetch(`/api/stealth/sweep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stealthPrivateKey: derivedKey.privateKey,
          destinationAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sweep failed");
      }

      setSweepResults(
        new Map(sweepResults.set(stealthAddress, data as SweepResult)),
      );
    } catch (err: any) {
      setSweepError(err.message);
    } finally {
      setIsSweeping(null);
    }
  };

  const sweepAll = async () => {
    if (!destinationAddress) {
      setSweepError("Please enter a destination address first");
      return;
    }

    for (const match of matches) {
      if (!sweepResults.has(match.stealthAddress)) {
        await sweepETH(match.stealthAddress, match.ephemeralPublicKey);
      }
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
          Scan for stealth paychecks, derive spending keys, and sweep ETH
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
          <li>Spending keys are automatically derived for your payments</li>
          <li>Enter your destination wallet and sweep ETH with one click</li>
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
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-400">
            Ephemeral Keys from Payroll Run
          </label>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setInputMode("form")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                inputMode === "form"
                  ? "bg-privaroll-secondary/20 text-privaroll-secondary border border-privaroll-secondary/30"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              📝 Form
            </button>
            <button
              onClick={() => setInputMode("json")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                inputMode === "json"
                  ? "bg-privaroll-secondary/20 text-privaroll-secondary border border-privaroll-secondary/30"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {"{ }"} JSON
            </button>
          </div>
        </div>

        {inputMode === "form" ? (
          <div className="space-y-3">
            {ephemeralEntries.map((entry, i) => (
              <div
                key={i}
                className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Entry #{i + 1}</span>
                  {ephemeralEntries.length > 1 && (
                    <button
                      onClick={() => removeEphemeralEntry(i)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Ephemeral Public Key
                    </label>
                    <input
                      type="text"
                      value={entry.ephemeralPublicKey}
                      onChange={(e) =>
                        updateEphemeralEntry(
                          i,
                          "ephemeralPublicKey",
                          e.target.value,
                        )
                      }
                      placeholder="02abc... or 03def..."
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-privaroll-secondary font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Stealth Address
                    </label>
                    <input
                      type="text"
                      value={entry.stealthAddress}
                      onChange={(e) =>
                        updateEphemeralEntry(
                          i,
                          "stealthAddress",
                          e.target.value,
                        )
                      }
                      placeholder="0x..."
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-privaroll-secondary font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addEphemeralEntry}
              className="w-full py-2 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors text-sm"
            >
              + Add Another Entry
            </button>
          </div>
        ) : (
          <textarea
            value={ephemeralKeysJson}
            onChange={(e) => setEphemeralKeysJson(e.target.value)}
            placeholder={`Paste JSON array, e.g.:\n[\n  { "ephemeralPublicKey": "02abc...", "stealthAddress": "0x..." },\n  { "ephemeralPublicKey": "03def...", "stealthAddress": "0x..." }\n]`}
            rows={6}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-privaroll-secondary font-mono text-sm"
          />
        )}

        <p className="text-xs text-gray-600 mt-2">
          💡 Get these values from the HR dashboard after a payroll run is
          executed.
        </p>
      </div>

      {/* Scan Button */}
      <button
        onClick={scanForPayments}
        disabled={isScanning || !stealthPrivateKey || !hasValidEphemeralKeys()}
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
            <div className="space-y-6">
              {/* Payment Found Header */}
              <div className="p-6 border border-green-500/50 rounded-xl bg-green-900/20">
                <h3 className="text-lg font-semibold text-green-400 mb-3">
                  ✅ Found {matches.length} Payment
                  {matches.length > 1 ? "s" : ""}!
                </h3>

                {/* Payments List */}
                <div className="space-y-3">
                  {matches.map((match, i) => {
                    const derived = derivedKeys.get(match.stealthAddress);
                    const swept = sweepResults.get(match.stealthAddress);

                    return (
                      <div
                        key={i}
                        className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                      >
                        <p className="text-sm text-gray-400 mb-2">
                          Payment #{i + 1}
                        </p>
                        <p className="text-xs font-mono text-gray-300 mb-1">
                          <span className="text-gray-500">
                            Stealth Address:{" "}
                          </span>
                          <a
                            href={`https://sepolia.basescan.org/address/${match.stealthAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-privaroll-secondary hover:underline"
                          >
                            {match.stealthAddress}
                          </a>
                        </p>
                        <p className="text-xs font-mono text-gray-300 truncate mb-1">
                          <span className="text-gray-500">
                            Ephemeral Public Key:{" "}
                          </span>
                          {match.ephemeralPublicKey}
                        </p>

                        {/* Derived Key Status */}
                        {derived && (
                          <div className="mt-2 p-2 bg-gray-900 rounded border border-green-500/20">
                            <p className="text-xs text-green-400">
                              🔑 Spending key derived successfully
                            </p>
                            <p className="text-xs font-mono text-gray-400 mt-1">
                              Derived Address: {derived.address}
                            </p>
                          </div>
                        )}

                        {/* Sweep Status */}
                        {swept && (
                          <div className="mt-2 p-2 bg-gray-900 rounded border border-blue-500/20">
                            <p className="text-xs text-blue-400">
                              ✅ Swept {swept.amount} ETH
                            </p>
                            <p className="text-xs font-mono text-gray-400 mt-1">
                              TX:{" "}
                              <a
                                href={`https://sepolia.basescan.org/tx/${swept.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-privaroll-secondary hover:underline"
                              >
                                {swept.txHash}
                              </a>
                            </p>
                          </div>
                        )}

                        {/* Individual Sweep Button */}
                        {derived && !swept && destinationAddress && (
                          <button
                            onClick={() =>
                              sweepETH(
                                match.stealthAddress,
                                match.ephemeralPublicKey,
                              )
                            }
                            disabled={isSweeping === match.stealthAddress}
                            className="mt-2 px-4 py-1.5 bg-blue-600/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-600/30 transition-colors text-xs disabled:opacity-50"
                          >
                            {isSweeping === match.stealthAddress
                              ? "⏳ Sweeping..."
                              : "💸 Sweep ETH"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sweep Section */}
              <div className="p-6 border border-blue-500/50 rounded-xl bg-blue-900/10">
                <h3 className="text-lg font-semibold text-blue-400 mb-3">
                  💸 Sweep ETH to Your Wallet
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Enter your destination wallet address and sweep all ETH from
                  your stealth addresses in one go.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Destination Wallet Address
                  </label>
                  <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder="0x... your main wallet address"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  />
                </div>

                <button
                  onClick={sweepAll}
                  disabled={
                    !destinationAddress ||
                    isSweeping !== null ||
                    matches.every((m) => sweepResults.has(m.stealthAddress))
                  }
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSweeping
                    ? "⏳ Sweeping..."
                    : matches.every((m) => sweepResults.has(m.stealthAddress))
                      ? "✅ All Payments Swept!"
                      : `💸 Sweep All (${matches.length - sweepResults.size} remaining)`}
                </button>

                {sweepError && (
                  <div className="mt-3 p-3 border border-red-500/50 rounded-lg bg-red-900/20">
                    <p className="text-red-400 text-sm">❌ {sweepError}</p>
                  </div>
                )}
              </div>
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
