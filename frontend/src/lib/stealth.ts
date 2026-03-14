import { ethers } from "ethers";
import * as secp from "@noble/secp256k1";

/**
 * Client-side Stealth Address Cryptography Library
 *
 * This is the browser-side implementation of the stealth address math.
 * Used by both HR (to generate stealth addresses) and employees (to scan & derive keys).
 */

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface StealthMetaKeys {
  privateKey: string;
  publicKey: string;
}

export interface StealthPaymentResult {
  stealthAddress: string;
  ephemeralPublicKey: string;
}

// ──────────────────────────────────────────────
// 1. FOR THE EMPLOYEE: Generate Stealth Meta-Keys
// ──────────────────────────────────────────────

export function generateEmployeeMetaKeys(): StealthMetaKeys {
  const stealthPrivateKey = secp.utils.randomPrivateKey();
  const stealthPublicKey = secp.getPublicKey(stealthPrivateKey, true);

  return {
    privateKey: secp.etc.bytesToHex(stealthPrivateKey),
    publicKey: secp.etc.bytesToHex(stealthPublicKey),
  };
}

// ──────────────────────────────────────────────
// 2. FOR HR: Generate the One-Time Stealth Address
// ──────────────────────────────────────────────

export function generateStealthPayment(
  employeePublicKeyHex: string,
): StealthPaymentResult {
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

// ──────────────────────────────────────────────
// 3. FOR THE EMPLOYEE: Derive the Spending Key
// ─────────��────────────────────────────────────

export function deriveStealthPrivateKey(
  stealthPrivateKeyHex: string,
  ephemeralPublicKeyHex: string,
): ethers.Wallet {
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

  return new ethers.Wallet(stealthPrivateKeyStr);
}

// ──────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────

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
