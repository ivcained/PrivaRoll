"use client";

import Link from "next/link";
import { useState } from "react";

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_STEALTH_REGISTRY_ADDRESS || "";

interface GeneratedKeys {
  privateKey: string;
  publicKey: string;
  ensTextKey: string;
  instructions: string;
}

export default function SetupPage() {
  const [keys, setKeys] = useState<GeneratedKeys | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generateKeys = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/stealth/generate-meta-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Key generation failed");
      }

      setKeys(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
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
          <span>⚙️</span>
          <span className="bg-gradient-to-r from-privaroll-accent to-privaroll-primary bg-clip-text text-transparent">
            Setup & Keys
          </span>
        </h1>
        <p className="text-gray-400 mt-1">
          Generate stealth meta-keys and configure your identity
        </p>
      </div>

      {/* Contract Info */}
      <div className="mb-8 p-4 border border-gray-800 rounded-xl bg-gray-900/30">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">
          📋 Contract Information
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">StealthKeyRegistry:</span>
            <a
              href={`https://sepolia.basescan.org/address/${REGISTRY_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-privaroll-secondary hover:underline text-xs"
            >
              {REGISTRY_ADDRESS || "Not configured"}
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Network:</span>
            <span className="text-gray-300">Base Sepolia (84532)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">ENS Text Key:</span>
            <span className="font-mono text-gray-300 text-xs">
              privaroll.stealth.metakey
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: Generate Keys */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-7 h-7 flex items-center justify-center bg-privaroll-primary/20 rounded-full text-sm text-privaroll-primary">
            1
          </span>
          Generate Stealth Meta-Keys
        </h2>

        <div className="p-4 border border-gray-800 rounded-xl bg-gray-900/50">
          <p className="text-sm text-gray-400 mb-4">
            Generate a new stealth key pair. Your <strong>public key</strong>{" "}
            will be shared (via ENS or on-chain registry) so HR can create
            stealth addresses for your payroll. Your{" "}
            <strong>private key</strong> must be kept secret — it&apos;s needed
            to claim your payments.
          </p>

          <button
            onClick={generateKeys}
            disabled={isGenerating}
            className="px-6 py-2 bg-privaroll-accent/20 border border-privaroll-accent/50 rounded-lg text-privaroll-accent hover:bg-privaroll-accent/30 transition-colors disabled:opacity-50"
          >
            {isGenerating ? "⏳ Generating..." : "🔑 Generate New Key Pair"}
          </button>

          {error && (
            <div className="mt-4 p-3 border border-red-500/50 rounded-lg bg-red-900/20">
              <p className="text-red-400 text-sm">❌ {error}</p>
            </div>
          )}

          {keys && (
            <div className="mt-4 space-y-4">
              {/* Public Key */}
              <div className="p-4 bg-gray-800 rounded-lg border border-green-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-green-400">
                    Public Key (safe to share)
                  </span>
                  <button
                    onClick={() => copyToClipboard(keys.publicKey, "publicKey")}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    {copied === "publicKey" ? "✅ Copied!" : "📋 Copy"}
                  </button>
                </div>
                <p className="font-mono text-xs text-gray-300 break-all">
                  {keys.publicKey}
                </p>
              </div>

              {/* Private Key */}
              <div className="p-4 bg-gray-800 rounded-lg border border-red-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-red-400">
                    Private Key (KEEP SECRET!)
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(keys.privateKey, "privateKey")
                    }
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    {copied === "privateKey" ? "✅ Copied!" : "📋 Copy"}
                  </button>
                </div>
                <p className="font-mono text-xs text-gray-300 break-all">
                  {keys.privateKey}
                </p>
                <p className="text-xs text-red-400 mt-2">
                  ⚠️ Save this securely. You need it to scan and claim your
                  stealth payments. It cannot be recovered.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Register on ENS */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-7 h-7 flex items-center justify-center bg-privaroll-primary/20 rounded-full text-sm text-privaroll-primary">
            2
          </span>
          Register via ENS Text Record
        </h2>

        <div className="p-4 border border-gray-800 rounded-xl bg-gray-900/50">
          <p className="text-sm text-gray-400 mb-3">
            Set your public key as an ENS text record so HR can automatically
            look it up:
          </p>
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">ENS Text Record Key:</p>
            <p className="font-mono text-sm text-privaroll-accent">
              privaroll.stealth.metakey
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Go to{" "}
            <a
              href="https://app.ens.domains"
              target="_blank"
              rel="noopener noreferrer"
              className="text-privaroll-secondary hover:underline"
            >
              app.ens.domains
            </a>{" "}
            → Your Name → Records → Add Text Record → Paste your public key.
          </p>
        </div>
      </div>

      {/* Step 3: On-chain Registry */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-7 h-7 flex items-center justify-center bg-privaroll-primary/20 rounded-full text-sm text-privaroll-primary">
            3
          </span>
          Register On-Chain (Alternative)
        </h2>

        <div className="p-4 border border-gray-800 rounded-xl bg-gray-900/50">
          <p className="text-sm text-gray-400 mb-3">
            If you don&apos;t have an ENS name, you can register your stealth
            public key directly on the StealthKeyRegistry contract on Base
            Sepolia.
          </p>
          <div className="p-3 bg-gray-800 rounded-lg text-xs font-mono text-gray-400">
            <p className="text-gray-500 mb-1">
              // Call registerStealthMetaKey() on:
            </p>
            <p className="text-privaroll-secondary break-all">
              {REGISTRY_ADDRESS || "Contract not deployed yet"}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            You can interact with the contract directly on{" "}
            <a
              href={`https://sepolia.basescan.org/address/${REGISTRY_ADDRESS}#writeContract`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-privaroll-secondary hover:underline"
            >
              BaseScan
            </a>
            .
          </p>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="p-4 border border-gray-800 rounded-xl bg-gray-900/30">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">
          🔐 Security Architecture
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">What HR sees:</p>
            <ul className="text-gray-400 space-y-1 list-disc list-inside">
              <li>Your ENS name or wallet address</li>
              <li>Your stealth meta public key</li>
              <li>One-time stealth addresses (unlinkable)</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-500 mb-1">What stays private:</p>
            <ul className="text-gray-400 space-y-1 list-disc list-inside">
              <li>Your stealth private key</li>
              <li>The link between you and stealth addresses</li>
              <li>Your salary amount to outside observers</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
