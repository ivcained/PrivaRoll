import { NextRequest, NextResponse } from "next/server";
import * as secp from "@noble/secp256k1";
import { ethers } from "ethers";

/**
 * POST /api/payroll/run
 *
 * Executes a stealth payroll run on Base Sepolia.
 * Supports two modes:
 *
 * 1. BitGo Mode (preferred): Proxies to the backend Express server which
 *    uses BitGo's sendMany API for enterprise batch transactions.
 *
 * 2. Direct Mode (fallback): Uses ethers.js to send transactions directly
 *    from a server-side private key.
 *
 * The mode is auto-detected based on environment variables:
 *   - BITGO_ACCESS_TOKEN + BITGO_WALLET_ID → BitGo mode
 *   - PAYROLL_PRIVATE_KEY → Direct mode
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employees, walletPassphrase } = body;

    if (!employees || !Array.isArray(employees)) {
      return NextResponse.json(
        { error: "Missing required field: employees[]" },
        { status: 400 },
      );
    }

    // Determine execution mode
    const hasBitGo =
      process.env.BITGO_ACCESS_TOKEN && process.env.BITGO_WALLET_ID;
    const hasDirectKey =
      process.env.PAYROLL_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

    if (hasBitGo) {
      return await handleBitGoMode(employees, walletPassphrase);
    } else if (hasDirectKey) {
      return await handleDirectSigning(employees);
    } else {
      return NextResponse.json(
        {
          error:
            "No payroll method configured. Set BITGO_ACCESS_TOKEN + BITGO_WALLET_ID for BitGo mode, or PAYROLL_PRIVATE_KEY for direct signing.",
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Payroll run failed:", error);
    return NextResponse.json(
      {
        error: `Payroll execution failed: ${error.message || String(error)}`,
      },
      { status: 500 },
    );
  }
}

// ──────────────────────────────────────────────
// BitGo Enterprise Mode
// ──────────────────────────────────────────────

/**
 * BitGo mode: Proxy the payroll request to the backend Express server
 * which handles the BitGo SDK integration.
 *
 * If the backend is not available, fall back to a direct BitGo SDK call
 * from the Next.js API route.
 */
async function handleBitGoMode(
  employees: Array<{
    ensName?: string;
    metaPublicKey: string;
    amountETH: string;
  }>,
  walletPassphrase?: string,
) {
  if (!walletPassphrase) {
    return NextResponse.json(
      { error: "Missing walletPassphrase (required for BitGo mode)" },
      { status: 400 },
    );
  }

  // Try to proxy to the backend server first
  const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";

  try {
    console.log(
      `🏦 Proxying payroll to backend: ${backendUrl}/api/payroll/run`,
    );
    const backendRes = await fetch(`${backendUrl}/api/payroll/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employees, walletPassphrase }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      throw new Error(data.error || "Backend payroll request failed");
    }

    return NextResponse.json({
      ...data,
      mode: "bitgo",
    });
  } catch (backendError: any) {
    console.warn(
      `⚠️ Backend proxy failed: ${backendError.message}. Falling back to direct BitGo call...`,
    );

    // Fall back to direct BitGo SDK call from Next.js
    return await handleBitGoDirectCall(employees, walletPassphrase);
  }
}

/**
 * Direct BitGo SDK call from the Next.js API route (fallback when backend is unavailable).
 */
async function handleBitGoDirectCall(
  employees: Array<{
    ensName?: string;
    metaPublicKey: string;
    amountETH: string;
  }>,
  walletPassphrase: string,
) {
  // Dynamically import BitGo to avoid bundling issues
  const { BitGo } = await import("bitgo");

  const accessToken = process.env.BITGO_ACCESS_TOKEN!;
  const walletId = process.env.BITGO_WALLET_ID!;
  const coin = process.env.BITGO_COIN || "tbaseeth";
  const env = (process.env.BITGO_ENV as "test" | "prod") || "test";

  const bitgo = new BitGo({ env });
  bitgo.authenticateWithAccessToken({ accessToken });

  // 1. Generate stealth addresses
  const ephemeralKeys: Array<{
    ensName?: string;
    ephemeralPublicKey: string;
    stealthAddress: string;
  }> = [];

  const recipients: Array<{ address: string; amount: string }> = [];

  for (const emp of employees) {
    if (!emp.metaPublicKey) {
      return NextResponse.json(
        {
          error: `Employee ${emp.ensName || "unknown"} is missing a stealth meta public key`,
        },
        { status: 400 },
      );
    }

    const result = generateStealthPayment(emp.metaPublicKey);
    ephemeralKeys.push({
      ensName: emp.ensName,
      ephemeralPublicKey: result.ephemeralPublicKey,
      stealthAddress: result.stealthAddress,
    });
    recipients.push({
      address: result.stealthAddress,
      amount: emp.amountETH,
    });
  }

  // 2. Execute batch transaction via BitGo
  console.log(`🏦 BitGo direct call: Loading wallet on ${coin}...`);
  const ethWallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  console.log(`🚀 Broadcasting ${recipients.length} stealth payments...`);
  const transaction = await ethWallet.sendMany({
    recipients,
    walletPassphrase,
    message: `PrivaRoll Batch Run - ${new Date().toISOString()}`,
  });

  const txHash = transaction.txid || transaction.hash || "pending";

  return NextResponse.json({
    success: true,
    mode: "bitgo",
    txHash,
    ephemeralKeys,
    recipientCount: employees.length,
    timestamp: new Date().toISOString(),
  });
}

// ──────────────────────────────────────────────
// Direct Signing Mode (Fallback)
// ──────────────────────────────────────────────

/**
 * Direct signing mode: Use ethers.js to send transactions directly.
 * Uses PAYROLL_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY to sign transactions.
 */
async function handleDirectSigning(
  employees: Array<{
    ensName?: string;
    metaPublicKey: string;
    amountETH: string;
  }>,
) {
  const privateKey =
    process.env.PAYROLL_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

  if (!privateKey) {
    return NextResponse.json(
      {
        error:
          "Server misconfiguration: PAYROLL_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY must be set.",
      },
      { status: 500 },
    );
  }

  // Validate all employees have meta public keys
  for (let i = 0; i < employees.length; i++) {
    if (!employees[i].metaPublicKey) {
      return NextResponse.json(
        { error: `Employee #${i + 1} is missing a stealth meta public key` },
        { status: 400 },
      );
    }
  }

  // 1. Generate stealth addresses for each employee
  const ephemeralKeys: Array<{
    ensName?: string;
    ephemeralPublicKey: string;
    stealthAddress: string;
  }> = [];

  const payments: Array<{ address: string; amount: string }> = [];

  for (const emp of employees) {
    try {
      const result = generateStealthPayment(emp.metaPublicKey);
      ephemeralKeys.push({
        ensName: emp.ensName,
        ephemeralPublicKey: result.ephemeralPublicKey,
        stealthAddress: result.stealthAddress,
      });
      payments.push({
        address: result.stealthAddress,
        amount: emp.amountETH,
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          error: `Failed to derive stealth address for ${emp.ensName || "employee"}: ${err.message}`,
        },
        { status: 400 },
      );
    }
  }

  // 2. Connect to Base Sepolia and send transactions
  console.log(`🏦 Connecting to Base Sepolia: ${rpcUrl}`);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(
    privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
    provider,
  );

  console.log(`📦 Payroll wallet: ${wallet.address}`);
  console.log(`🚀 Sending to ${payments.length} stealth addresses...`);

  const txHashes: string[] = [];

  for (const payment of payments) {
    try {
      const tx = await wallet.sendTransaction({
        to: payment.address,
        value: ethers.parseUnits(payment.amount, "wei"),
      });
      console.log(
        `   ✅ Sent ${payment.amount} wei to ${payment.address}: ${tx.hash}`,
      );
      txHashes.push(tx.hash);
    } catch (err: any) {
      console.error(`   ❌ Failed to send to ${payment.address}:`, err.message);
      return NextResponse.json(
        {
          error: `Transaction failed for ${payment.address}: ${err.message}`,
          partialTxHashes: txHashes,
        },
        { status: 500 },
      );
    }
  }

  const primaryTxHash = txHashes[0] || "none";
  console.log(`🎉 All ${txHashes.length} payroll transactions sent!`);

  return NextResponse.json({
    success: true,
    mode: "direct",
    txHash: primaryTxHash,
    allTxHashes: txHashes,
    ephemeralKeys,
    recipientCount: employees.length,
    timestamp: new Date().toISOString(),
  });
}

// ──────────────────────────────────────────────
// Stealth Address Generation
// ──────────────────────────────────────────────

function generateStealthPayment(employeePublicKeyHex: string): {
  stealthAddress: string;
  ephemeralPublicKey: string;
} {
  const ephemeralPrivateKey = secp.utils.randomPrivateKey();
  const ephemeralPublicKey = secp.getPublicKey(ephemeralPrivateKey, true);

  const sharedSecret = secp.getSharedSecret(
    ephemeralPrivateKey,
    employeePublicKeyHex,
    true,
  );

  const modifierHex = ethers.keccak256(sharedSecret);
  const modifierBytes = hexToBytes(modifierHex.slice(2));

  const stealthPublicKeyPoint = secp.ProjectivePoint.fromHex(
    employeePublicKeyHex,
  ).add(secp.ProjectivePoint.fromPrivateKey(modifierBytes));

  const stealthPublicKeyHex = stealthPublicKeyPoint.toHex(false);
  const pubKeyHash = ethers.keccak256("0x" + stealthPublicKeyHex.slice(2));
  const stealthAddress = ethers.getAddress("0x" + pubKeyHash.slice(-40));

  return {
    stealthAddress,
    ephemeralPublicKey: secp.etc.bytesToHex(ephemeralPublicKey),
  };
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
