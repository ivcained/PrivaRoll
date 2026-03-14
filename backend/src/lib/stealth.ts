import { ethers } from "ethers";
import * as secp from "@noble/secp256k1";

/**
 * Stealth Address Cryptography Library
 *
 * Implements Elliptic Curve Diffie-Hellman (ECDH) based stealth addresses
 * following ERC-5564 concepts for unlinkable payment addresses on Base EVM.
 *
 * Math:
 *   P_stealth = P_meta + hash(S) * G
 *   p_stealth = p_meta + hash(S) mod n
 *
 * Where S = shared secret from ECDH between ephemeral key and meta key.
 */

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface StealthMetaKeys {
  privateKey: string; // Hex-encoded private key
  publicKey: string; // Hex-encoded compressed public key (33 bytes)
}

export interface StealthPaymentResult {
  stealthAddress: string; // The one-time Ethereum address for this payment
  ephemeralPublicKey: string; // Must be published so the employee can find the payment
}

// ──────────────────────────────────────────────
// 1. FOR THE EMPLOYEE: Generate Stealth Meta-Keys
// ──────────────────────────────────────────────

/**
 * Generate a new set of stealth meta-keys for an employee.
 * The employee saves the publicKey to their ENS text records
 * under the key 'privaroll.stealth.metakey'.
 *
 * In production, derive this deterministically from the employee's
 * main wallet signature for recoverability.
 *
 * @returns StealthMetaKeys with privateKey and publicKey
 */
export function generateEmployeeMetaKeys(): StealthMetaKeys {
  const stealthPrivateKey = secp.utils.randomPrivateKey();
  const stealthPublicKey = secp.getPublicKey(stealthPrivateKey, true); // Compressed

  return {
    privateKey: secp.etc.bytesToHex(stealthPrivateKey),
    publicKey: secp.etc.bytesToHex(stealthPublicKey),
  };
}

// ──────────────────────────────────────────────
// 2. FOR HR: Generate the One-Time Stealth Address
// ──────────────────────────────────────────────

/**
 * Generate a one-time stealth address for a specific paycheck.
 * HR's server runs this using the Employee's public key retrieved from ENS.
 *
 * Steps:
 * 1. Generate random ephemeral key pair
 * 2. Compute shared secret via ECDH: S = ephemeral_priv * employee_pub
 * 3. Hash the shared secret to create a spending modifier
 * 4. Calculate stealth public key: P_stealth = P_meta + hash(S) * G
 * 5. Derive the Ethereum address from the stealth public key
 *
 * @param employeePublicKeyHex - The employee's compressed stealth meta public key (hex)
 * @returns StealthPaymentResult with stealthAddress and ephemeralPublicKey
 */
export function generateStealthPayment(
  employeePublicKeyHex: string,
): StealthPaymentResult {
  // 1. Generate a random ephemeral private key for this specific paycheck
  const ephemeralPrivateKey = secp.utils.randomPrivateKey();
  const ephemeralPublicKey = secp.getPublicKey(ephemeralPrivateKey, true);

  // 2. Compute the Shared Secret using ECDH
  const sharedSecret = secp.getSharedSecret(
    ephemeralPrivateKey,
    employeePublicKeyHex,
    true,
  );

  // 3. Hash the shared secret to create a spending modifier
  const modifierHex = ethers.keccak256(sharedSecret);
  const modifierBytes = hexToBytes(modifierHex.slice(2));

  // 4. Calculate the final Stealth Public Key
  // P_stealth = P_meta + (modifier * G)
  const stealthPublicKeyPoint = secp.ProjectivePoint.fromHex(
    employeePublicKeyHex,
  ).add(secp.ProjectivePoint.fromPrivateKey(modifierBytes));

  // Uncompressed for Ethereum address derivation
  const stealthPublicKeyHex = stealthPublicKeyPoint.toHex(false);

  // 5. Derive the standard Ethereum address
  // Last 20 bytes of keccak256(uncompressed_pub_key_without_04_prefix)
  const pubKeyHash = ethers.keccak256("0x" + stealthPublicKeyHex.slice(2));
  const stealthAddress = ethers.getAddress("0x" + pubKeyHash.slice(-40));

  return {
    stealthAddress,
    ephemeralPublicKey: secp.etc.bytesToHex(ephemeralPublicKey),
  };
}

// ──────────────────────────────────────────────
// 3. FOR THE EMPLOYEE: Derive the Spending Key
// ──────────────────────────────────────────────

/**
 * Derive the stealth private key so the employee can spend funds.
 * The employee's browser runs this to find and unlock their money.
 *
 * Math: p_stealth = (p_meta + hash(S)) mod n
 *
 * @param stealthPrivateKeyHex - The employee's stealth meta private key (hex)
 * @param ephemeralPublicKeyHex - The ephemeral public key published by HR
 * @returns An ethers.Wallet instance with the derived stealth spending key
 */
export function deriveStealthPrivateKey(
  stealthPrivateKeyHex: string,
  ephemeralPublicKeyHex: string,
): ethers.Wallet {
  // 1. Convert hex inputs
  const privKeyBytes = hexToBytes(stealthPrivateKeyHex.replace("0x", ""));
  const privKeyBigInt = bytesToBigInt(privKeyBytes);

  // 2. Reconstruct the Shared Secret
  // Employee Private Key * HR Ephemeral Public Key = Shared Secret
  const sharedSecret = secp.getSharedSecret(
    privKeyBytes,
    ephemeralPublicKeyHex,
    true,
  );

  // 3. Hash the shared secret to recreate the spending modifier
  const modifierHex = ethers.keccak256(sharedSecret);
  const modifierBytes = hexToBytes(modifierHex.slice(2));
  const modifierBigInt = bytesToBigInt(modifierBytes);

  // 4. Derive the final Stealth Private Key
  // p_stealth = (p_meta + modifier) mod n
  const CURVE_ORDER = BigInt(
    "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
  );
  const stealthPrivBigInt =
    (((privKeyBigInt + modifierBigInt) % CURVE_ORDER) + CURVE_ORDER) %
    CURVE_ORDER;

  const stealthPrivateKeyStr =
    "0x" + stealthPrivBigInt.toString(16).padStart(64, "0");

  // 5. Create an ethers wallet instance from the derived key
  return new ethers.Wallet(stealthPrivateKeyStr);
}

// ──────────────────────────────────────────────
// 4. SCANNING: Check if a stealth address belongs to an employee
// ──────────────────────────────────────────────

/**
 * For a given ephemeral public key, derive what the stealth address would be
 * for this employee and check if it matches the on-chain address.
 *
 * @param stealthPrivateKeyHex - Employee's stealth meta private key
 * @param ephemeralPublicKeyHex - Published ephemeral key from payroll run
 * @returns The derived stealth address (can be compared against on-chain data)
 */
export function computeExpectedStealthAddress(
  stealthPrivateKeyHex: string,
  ephemeralPublicKeyHex: string,
): string {
  const wallet = deriveStealthPrivateKey(
    stealthPrivateKeyHex,
    ephemeralPublicKeyHex,
  );
  return wallet.address;
}

// ──────────────────────────────────────────────
// Utility Functions
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
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, "0");
  }
  return BigInt("0x" + hex);
}
