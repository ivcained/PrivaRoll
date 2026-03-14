import { NextRequest, NextResponse } from "next/server";
import * as secp from "@noble/secp256k1";
import { ethers } from "ethers";

/**
 * POST /api/payroll/run
 *
 * Executes a stealth payroll run on Base Sepolia:
 * 1. Generates stealth addresses for each employee using their meta public keys
 * 2. Sends ETH/native transfers directly to stealth addresses using ethers.js
 *
 * Required env vars:
 *   PAYROLL_PRIVATE_KEY  - Private key of the HR payroll wallet (for signing)
 *   BASE_SEPOLIA_RPC_URL - Base Sepolia RPC endpoint (default: https://sepolia.base.org)
 */
export async function POST(req: NextRequest) {
  try {
    const { employees } = await req.json();

    if (!employees || !Array.isArray(employees)) {
      return NextResponse.json(
        { error: "Missing required field: employees[]" },
        { status: 400 },
      );
    }

    return await handleDirectSigning(employees);
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
