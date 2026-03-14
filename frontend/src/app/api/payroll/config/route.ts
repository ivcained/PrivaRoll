import { NextResponse } from "next/server";

/**
 * GET /api/payroll/config
 *
 * Returns the current payroll execution mode configuration.
 * Used by the frontend to display the correct UI elements
 * (e.g., show wallet passphrase input for BitGo mode).
 */
export async function GET() {
  const hasBitGo =
    !!process.env.BITGO_ACCESS_TOKEN && !!process.env.BITGO_WALLET_ID;
  const hasDirectKey =
    !!process.env.PAYROLL_PRIVATE_KEY || !!process.env.DEPLOYER_PRIVATE_KEY;

  let mode: "bitgo" | "direct" | "none" = "none";
  if (hasBitGo) mode = "bitgo";
  else if (hasDirectKey) mode = "direct";

  return NextResponse.json({
    mode,
    configured: mode !== "none",
    bitgoEnabled: hasBitGo,
    directEnabled: hasDirectKey,
    coin: process.env.BITGO_COIN || "tbaseeth",
  });
}
