import { Router, Request, Response } from "express";
import {
  generateEmployeeMetaKeys,
  generateStealthPayment,
  computeExpectedStealthAddress,
} from "../lib/stealth";

export const stealthRouter = Router();

/**
 * POST /api/stealth/generate-meta-keys
 *
 * Generate a new set of stealth meta-keys for an employee.
 * The employee saves the publicKey to their ENS text records.
 *
 * Returns: { privateKey, publicKey }
 */
stealthRouter.post("/generate-meta-keys", (_req: Request, res: Response) => {
  try {
    const keys = generateEmployeeMetaKeys();
    return res.json({
      privateKey: keys.privateKey,
      publicKey: keys.publicKey,
      ensTextKey: "privaroll.stealth.metakey",
      instructions:
        "Save the publicKey to your ENS text record under the key 'privaroll.stealth.metakey'. Keep your privateKey safe and secret.",
    });
  } catch (error: any) {
    console.error("Meta key generation failed:", error);
    return res.status(500).json({
      error: "Failed to generate meta keys",
      message: error.message,
    });
  }
});

/**
 * POST /api/stealth/derive-address
 *
 * Derive a one-time stealth address for a given employee public key.
 * Used by HR to preview stealth addresses before running payroll.
 *
 * Body: { employeePublicKey: string }
 * Returns: { stealthAddress, ephemeralPublicKey }
 */
stealthRouter.post("/derive-address", (req: Request, res: Response) => {
  try {
    const { employeePublicKey } = req.body;

    if (!employeePublicKey) {
      return res.status(400).json({
        error: "Missing required field: employeePublicKey",
      });
    }

    const result = generateStealthPayment(employeePublicKey);
    return res.json({
      stealthAddress: result.stealthAddress,
      ephemeralPublicKey: result.ephemeralPublicKey,
    });
  } catch (error: any) {
    console.error("Stealth address derivation failed:", error);
    return res.status(500).json({
      error: "Failed to derive stealth address",
      message: error.message,
    });
  }
});

/**
 * POST /api/stealth/scan
 *
 * Employee endpoint: Given their private meta key and a list of ephemeral keys,
 * compute which stealth addresses belong to them.
 *
 * Body: {
 *   stealthPrivateKey: string,
 *   ephemeralKeys: Array<{ ephemeralPublicKey: string, stealthAddress: string }>
 * }
 * Returns: Array of matched stealth addresses
 */
stealthRouter.post("/scan", (req: Request, res: Response) => {
  try {
    const { stealthPrivateKey, ephemeralKeys } = req.body;

    if (!stealthPrivateKey || !ephemeralKeys || !Array.isArray(ephemeralKeys)) {
      return res.status(400).json({
        error: "Missing required fields: stealthPrivateKey, ephemeralKeys[]",
      });
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

    return res.json({
      found: matches.length,
      matches,
    });
  } catch (error: any) {
    console.error("Stealth scan failed:", error);
    return res.status(500).json({
      error: "Failed to scan for stealth payments",
      message: error.message,
    });
  }
});
