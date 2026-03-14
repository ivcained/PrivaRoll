import { Router, Request, Response } from "express";
import { generateStealthPayment } from "../lib/stealth";
import {
  executeStealthPayrollBatch,
  validateBitGoConfig,
  getWalletInfo,
  BitGoPayrollPayment,
} from "../services/bitgoPayroll";

export const payrollRouter = Router();

export interface PayrollPayment {
  stealthAddress: string;
  amountInBaseUnits: string;
}

/**
 * GET /api/payroll/config
 *
 * Returns the current payroll execution mode (bitgo vs direct).
 * Useful for the frontend to display the correct UI.
 */
payrollRouter.get("/config", (_req: Request, res: Response) => {
  const config = validateBitGoConfig();
  return res.json({
    mode: config.mode,
    configured: config.configured,
    bitgoEnabled: config.mode === "bitgo",
    directEnabled: config.mode === "direct",
    coin: process.env.BITGO_COIN || "tbaseeth",
  });
});

/**
 * GET /api/payroll/wallet
 *
 * Returns BitGo wallet info (balance, label, etc.).
 * Only available when BitGo mode is active.
 */
payrollRouter.get("/wallet", async (_req: Request, res: Response) => {
  try {
    const accessToken = process.env.BITGO_ACCESS_TOKEN;
    const walletId = process.env.BITGO_WALLET_ID;

    if (!accessToken || !walletId) {
      return res.status(400).json({
        error: "BitGo not configured. Set BITGO_ACCESS_TOKEN and BITGO_WALLET_ID.",
      });
    }

    const info = await getWalletInfo(accessToken, walletId);
    return res.json(info);
  } catch (error: any) {
    console.error("Failed to get wallet info:", error);
    return res.status(500).json({
      error: "Failed to retrieve wallet information",
      message: error.message,
    });
  }
});

/**
 * POST /api/payroll/run
 *
 * Execute a batch payroll run. Generates stealth addresses for each employee
 * and broadcasts the ETH transfers via BitGo (preferred) or direct ethers.js.
 *
 * Body:
 * {
 *   walletPassphrase?: string,  // Required for BitGo mode
 *   employees: Array<{
 *     ensName?: string,
 *     metaPublicKey: string,
 *     amountETH: string  // in base units (wei)
 *   }>
 * }
 */
payrollRouter.post("/run", async (req: Request, res: Response) => {
  try {
    const { employees, walletPassphrase } = req.body;

    if (!employees || !Array.isArray(employees)) {
      return res.status(400).json({
        error: "Missing required fields: employees[]",
      });
    }

    // 1. Generate stealth addresses for each employee
    const payrollBatch: PayrollPayment[] = [];
    const ephemeralKeys: Array<{
      ensName?: string;
      ephemeralPublicKey: string;
      stealthAddress: string;
    }> = [];

    for (const emp of employees) {
      if (!emp.metaPublicKey) {
        return res.status(400).json({
          error: `Employee ${emp.ensName || "unknown"} is missing a stealth meta public key`,
        });
      }

      const { stealthAddress, ephemeralPublicKey } = generateStealthPayment(
        emp.metaPublicKey,
      );

      payrollBatch.push({
        stealthAddress,
        amountInBaseUnits: emp.amountETH,
      });

      ephemeralKeys.push({
        ensName: emp.ensName,
        ephemeralPublicKey,
        stealthAddress,
      });
    }

    // 2. Determine execution mode and broadcast
    const config = validateBitGoConfig();

    if (config.mode === "bitgo") {
      // ── BitGo Enterprise Mode ──
      // Uses BitGo's sendMany for batch transactions via multi-sig
      const accessToken = process.env.BITGO_ACCESS_TOKEN!;
      const walletId = process.env.BITGO_WALLET_ID!;

      if (!walletPassphrase) {
        return res.status(400).json({
          error: "Missing walletPassphrase (required for BitGo mode)",
        });
      }

      console.log("🏦 Executing payroll via BitGo Enterprise...");

      const bitgoPayments: BitGoPayrollPayment[] = payrollBatch.map((p) => ({
        stealthAddress: p.stealthAddress,
        amountInBaseUnits: p.amountInBaseUnits,
      }));

      const result = await executeStealthPayrollBatch(
        accessToken,
        walletId,
        walletPassphrase,
        bitgoPayments,
      );

      return res.json({
        success: true,
        mode: "bitgo",
        txHash: result.txHash,
        status: result.status,
        ephemeralKeys,
        payrollBatch,
        recipientCount: employees.length,
        timestamp: new Date().toISOString(),
      });
    } else {
      // ── Direct Signing Fallback ──
      // Returns stealth addresses for frontend to broadcast via ethers.js
      console.log("📝 Returning stealth addresses for direct signing...");

      return res.json({
        success: true,
        mode: "direct",
        ephemeralKeys,
        payrollBatch,
        recipientCount: employees.length,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error("Payroll run failed:", error);
    return res.status(500).json({
      error: "Payroll execution failed",
      message: error.message,
    });
  }
});
