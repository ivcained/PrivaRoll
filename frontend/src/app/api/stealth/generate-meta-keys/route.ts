import { NextResponse } from "next/server";
import * as secp from "@noble/secp256k1";

/**
 * POST /api/stealth/generate-meta-keys
 *
 * Generate a new set of stealth meta-keys for an employee.
 * Runs as a Next.js API route (serverless function on Vercel)
 * so there's no need for a separate backend server.
 */
export async function POST() {
  try {
    const stealthPrivateKey = secp.utils.randomPrivateKey();
    const stealthPublicKey = secp.getPublicKey(stealthPrivateKey, true);

    return NextResponse.json({
      privateKey: secp.etc.bytesToHex(stealthPrivateKey),
      publicKey: secp.etc.bytesToHex(stealthPublicKey),
      ensTextKey: "privaroll.stealth.metakey",
      instructions:
        "Save the publicKey to your ENS text record under the key 'privaroll.stealth.metakey'. Keep your privateKey safe and secret.",
    });
  } catch (error: any) {
    console.error("Meta key generation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate meta keys",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
