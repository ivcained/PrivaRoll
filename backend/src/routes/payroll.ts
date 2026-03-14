import { Router, Request, Response } from "express";
import { generateStealthPayment } from "../lib/stealth";
import {
  executeStealthPayrollBatch,
  getWalletBalance,
  PayrollPayment,
} from "../services/bitgoPayroll";

export const payrollRouter = Router();

/**
 * POST /api/payroll/run
 *
 * Execute a batch payroll run. Generates stealth addresses for each employee
 * and broadcasts the USDC transfers via BitGo on Base L2.
 *
 * Body:
 * {
 *   walletPassphrase: string,
 *   employees: Array<{
 *     ensName?: string,
 *     metaPublicKey: string,
 *     amountUSDC: string  // in base units (wei for ETH on testnet, e.g., "5000000000000000" for 0.005 ETH)
 *   }>
 * }
 */
payrollRouter.post("/run", async (req: Request, res: Response) => {
  try {
    const { walletPassphrase, employees } = req.body;

    if (!walletPassphrase || !employees || !Array.isArray(employees)) {
      return res.status(400).json({
        error: "Missing required fields: walletPassphrase, employees[]",
      });
    }

    const accessToken = process.env.BITGO_ACCESS_TOKEN;
    const walletId = process.env.BITGO_HR_WALLET_ID;

    if (!accessToken || !walletId) {
      return res.status(500).json({
        error: "Server misconfiguration: BitGo credentials not set",
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
      const { stealthAddress, ephemeralPublicKey } = generateStealthPayment(
        emp.metaPublicKey,
      );

      payrollBatch.push({
        stealthAddress,
        amountInBaseUnits: emp.amountUSDC,
      });

      ephemeralKeys.push({
        ensName: emp.ensName,
        ephemeralPublicKey,
        stealthAddress,
      });
    }

    // 2. Execute via BitGo
    const result = await executeStealthPayrollBatch(
      accessToken,
      walletId,
      walletPassphrase,
      payrollBatch,
    );

    // 3. Return ephemeral keys for on-chain publishing
    // In production, these would also be stored in DB or published to the
    // StealthKeyRegistry contract
    return res.json({
      success: true,
      txHash: result.txHash,
      ephemeralKeys,
      recipientCount: employees.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Payroll run failed:", error);
    return res.status(500).json({
      error: "Payroll execution failed",
      message: error.message,
    });
  }
});

/**
 * GET /api/payroll/balance
 *
 * Get the current balance of the HR IssuerMultisig wallet.
 */
payrollRouter.get("/balance", async (_req: Request, res: Response) => {
  try {
    const accessToken = process.env.BITGO_ACCESS_TOKEN;
    const walletId = process.env.BITGO_HR_WALLET_ID;

    if (!accessToken || !walletId) {
      return res.status(500).json({
        error: "Server misconfiguration: BitGo credentials not set",
      });
    }

    const balance = await getWalletBalance(accessToken, walletId);
    return res.json(balance);
  } catch (error: any) {
    console.error("Balance check failed:", error);
    return res.status(500).json({
      error: "Failed to fetch wallet balance",
      message: error.message,
    });
  }
});
