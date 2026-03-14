import { Router, Request, Response } from "express";
import { generateStealthPayment } from "../lib/stealth";

export const payrollRouter = Router();

export interface PayrollPayment {
  stealthAddress: string;
  amountInBaseUnits: string;
}

/**
 * POST /api/payroll/run
 *
 * Execute a batch payroll run. Generates stealth addresses for each employee
 * and broadcasts the ETH transfers directly via ethers.js on Base L2.
 *
 * Body:
 * {
 *   employees: Array<{
 *     ensName?: string,
 *     metaPublicKey: string,
 *     amountETH: string  // in base units (wei, e.g., "5000000000000000" for 0.005 ETH)
 *   }>
 * }
 */
payrollRouter.post("/run", async (req: Request, res: Response) => {
  try {
    const { employees } = req.body;

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

    // 2. Return stealth addresses and ephemeral keys
    // The frontend handles the actual transaction broadcasting via ethers.js
    return res.json({
      success: true,
      ephemeralKeys,
      payrollBatch,
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
