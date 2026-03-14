import { NextRequest, NextResponse } from "next/server";
import * as secp from "@noble/secp256k1";
import { ethers } from "ethers";

/**
 * BitGo REST API base URLs
 * Test: https://app.bitgo-test.com
 * Prod: https://app.bitgo.com
 */
const BITGO_BASE_URL =
  process.env.BITGO_ENV === "prod"
    ? "https://app.bitgo.com"
    : "https://app.bitgo-test.com";

const BITGO_COIN = process.env.BITGO_COIN || "tbaseeth";

/**
 * POST /api/payroll/run
 *
 * Executes a stealth payroll run:
 * 1. Generates stealth addresses for each employee using their meta public keys
 * 2. Sends batch USDC transfers via BitGo REST API to stealth addresses on Base L2
 *
 * Required env vars on Vercel:
 *   BITGO_ACCESS_TOKEN - BitGo API access token
 *   BITGO_HR_WALLET_ID - BitGo wallet ID for the HR issuer wallet
 *   BITGO_ENV          - "test" (default) or "prod"
 *   BITGO_COIN         - "tbaseeth" (default) for Base Sepolia testnet
 *
 * Body: {
 *   walletPassphrase: string,
 *   employees: Array<{
 *     ensName?: string,
 *     metaPublicKey: string,
 *     amountUSDC: string
 *   }>
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { walletPassphrase, employees } = await req.json();

    if (!walletPassphrase || !employees || !Array.isArray(employees)) {
      return NextResponse.json(
        { error: "Missing required fields: walletPassphrase, employees[]" },
        { status: 400 },
      );
    }

    const accessToken = process.env.BITGO_ACCESS_TOKEN;
    const walletId = process.env.BITGO_HR_WALLET_ID;

    if (!accessToken || !walletId) {
      return NextResponse.json(
        {
          error:
            "Server misconfiguration: BITGO_ACCESS_TOKEN and BITGO_HR_WALLET_ID must be set as environment variables",
        },
        { status: 500 },
      );
    }

    // Validate all employees have meta public keys
    for (let i = 0; i < employees.length; i++) {
      if (!employees[i].metaPublicKey) {
        return NextResponse.json(
          {
            error: `Employee #${i + 1} is missing a stealth meta public key`,
          },
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

    const recipients: Array<{ address: string; amount: string }> = [];

    for (const emp of employees) {
      try {
        const result = generateStealthPayment(emp.metaPublicKey);
        ephemeralKeys.push({
          ensName: emp.ensName,
          ephemeralPublicKey: result.ephemeralPublicKey,
          stealthAddress: result.stealthAddress,
        });
        recipients.push({
          address: result.stealthAddress,
          amount: emp.amountUSDC,
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

    // 2. Execute batch transaction via BitGo REST API
    console.log(
      `🏦 Sending batch payroll to ${recipients.length} stealth addresses via BitGo...`,
    );

    const bitgoResponse = await fetch(
      `${BITGO_BASE_URL}/api/v2/${BITGO_COIN}/wallet/${walletId}/sendmany`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipients,
          walletPassphrase,
          message: `PrivaRoll Batch Run - ${new Date().toISOString()}`,
        }),
      },
    );

    const bitgoData = await bitgoResponse.json();

    if (!bitgoResponse.ok) {
      console.error("BitGo API error:", bitgoData);
      return NextResponse.json(
        {
          error: "BitGo transaction failed",
          message:
            bitgoData.message || bitgoData.error || "Unknown BitGo error",
          details: bitgoData,
        },
        { status: bitgoResponse.status },
      );
    }

    console.log(`🎉 Payroll broadcasted! TX: ${bitgoData.txid}`);

    // 3. Return ephemeral keys for on-chain publishing
    return NextResponse.json({
      success: true,
      txHash: bitgoData.txid || bitgoData.hash,
      ephemeralKeys,
      recipientCount: employees.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Payroll run failed:", error);
    return NextResponse.json(
      {
        error: "Payroll execution failed",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

// ──────────────────────────────────────────────
// Stealth Address Generation (same crypto as backend)
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
