import { NextRequest, NextResponse } from "next/server";
import * as secp from "@noble/secp256k1";
import { ethers } from "ethers";

/**
 * POST /api/stealth/scan
 *
 * Employee endpoint: Given their private meta key and a list of ephemeral keys,
 * compute which stealth addresses belong to them.
 */
export async function POST(req: NextRequest) {
  try {
    const { stealthPrivateKey, ephemeralKeys } = await req.json();

    if (!stealthPrivateKey || !ephemeralKeys || !Array.isArray(ephemeralKeys)) {
      return NextResponse.json(
        {
          error: "Missing required fields: stealthPrivateKey, ephemeralKeys[]",
        },
        { status: 400 },
      );
    }

    const matches: Array<{
      stealthAddress: string;
      ephemeralPublicKey: string;
      derivedAddress: string;
    }> = [];

    for (const entry of ephemeralKeys) {
      try {
        const derivedAddress = computeExpectedStealthAddress(
          stealthPrivateKey,
          entry.ephemeralPublicKey,
        );

        if (
          derivedAddress.toLowerCase() === entry.stealthAddress.toLowerCase()
        ) {
          matches.push({
            stealthAddress: entry.stealthAddress,
            ephemeralPublicKey: entry.ephemeralPublicKey,
            derivedAddress,
          });
        }
      } catch {
        // If the math fails for a specific key, skip it
        continue;
      }
    }

    return NextResponse.json({
      found: matches.length,
      matches,
    });
  } catch (error: any) {
    console.error("Stealth scan failed:", error);
    return NextResponse.json(
      {
        error: "Failed to scan for stealth payments",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

function computeExpectedStealthAddress(
  stealthPrivateKeyHex: string,
  ephemeralPublicKeyHex: string,
): string {
  const privKeyBytes = hexToBytes(stealthPrivateKeyHex.replace("0x", ""));
  const privKeyBigInt = bytesToBigInt(privKeyBytes);

  const sharedSecret = secp.getSharedSecret(
    privKeyBytes,
    ephemeralPublicKeyHex,
    true,
  );

  const modifierHex = ethers.keccak256(sharedSecret);
  const modifierBytes = hexToBytes(modifierHex.slice(2));
  const modifierBigInt = bytesToBigInt(modifierBytes);

  const CURVE_ORDER = BigInt(
    "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
  );
  const stealthPrivBigInt =
    (((privKeyBigInt + modifierBigInt) % CURVE_ORDER) + CURVE_ORDER) %
    CURVE_ORDER;

  const stealthPrivateKeyStr =
    "0x" + stealthPrivBigInt.toString(16).padStart(64, "0");

  const wallet = new ethers.Wallet(stealthPrivateKeyStr);
  return wallet.address;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return BigInt("0x" + hex);
}
