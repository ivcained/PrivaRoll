import { NextRequest, NextResponse } from "next/server";
import * as secp from "@noble/secp256k1";
import { ethers } from "ethers";

/**
 * POST /api/stealth/derive-address
 *
 * Derive a one-time stealth address for a given employee public key.
 * Used by HR to preview stealth addresses before running payroll.
 */
export async function POST(req: NextRequest) {
  try {
    const { employeePublicKey } = await req.json();

    if (!employeePublicKey) {
      return NextResponse.json(
        { error: "Missing required field: employeePublicKey" },
        { status: 400 },
      );
    }

    // 1. Generate a random ephemeral private key for this specific paycheck
    const ephemeralPrivateKey = secp.utils.randomPrivateKey();
    const ephemeralPublicKey = secp.getPublicKey(ephemeralPrivateKey, true);

    // 2. Compute the Shared Secret using ECDH
    const sharedSecret = secp.getSharedSecret(
      ephemeralPrivateKey,
      employeePublicKey,
      true,
    );

    // 3. Hash the shared secret to create a spending modifier
    const modifierHex = ethers.keccak256(sharedSecret);
    const modifierBytes = hexToBytes(modifierHex.slice(2));

    // 4. Calculate the final Stealth Public Key
    const stealthPublicKeyPoint = secp.ProjectivePoint.fromHex(
      employeePublicKey,
    ).add(secp.ProjectivePoint.fromPrivateKey(modifierBytes));

    // 5. Derive the standard Ethereum address
    const stealthPublicKeyHex = stealthPublicKeyPoint.toHex(false);
    const pubKeyHash = ethers.keccak256("0x" + stealthPublicKeyHex.slice(2));
    const stealthAddress = ethers.getAddress("0x" + pubKeyHash.slice(-40));

    return NextResponse.json({
      stealthAddress,
      ephemeralPublicKey: secp.etc.bytesToHex(ephemeralPublicKey),
    });
  } catch (error: any) {
    console.error("Stealth address derivation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to derive stealth address",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
