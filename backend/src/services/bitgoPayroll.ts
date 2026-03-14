import { BitGo } from "bitgo";

// ──────────────────────────────────────────────
// BitGo Enterprise Payroll Service
// ──────────────────────────────────────────────
//
// Uses BitGo's sendMany API to batch-send ETH to stealth addresses
// on Base L2 via the HR IssuerMultisig wallet.
//
// This provides:
// - Enterprise-grade key management (multi-sig)
// - Batch transactions (gas-efficient)
// - Policy enforcement (spending limits, whitelists)
// - Full auditability inside BitGo dashboard
// ──────────────────────────────────────────────

export interface BitGoPayrollPayment {
  stealthAddress: string;
  amountInBaseUnits: string; // Wei as string (e.g., "5000000000000000" for 0.005 ETH)
}

export interface BitGoPayrollResult {
  success: boolean;
  txHash: string;
  status: string;
  recipientCount: number;
}

export interface BitGoWalletInfo {
  id: string;
  label: string;
  coin: string;
  balance: string;
  confirmedBalance: string;
}

// BitGo coin identifier for Base Sepolia Testnet ETH
// BitGo uses 'tbaseeth' for Base Sepolia testnet
const BITGO_BASE_COIN = process.env.BITGO_COIN || "tbaseeth";

/**
 * Create and authenticate a BitGo SDK instance.
 *
 * @param accessToken - BitGo API access token
 * @returns Authenticated BitGo instance
 */
function createBitGoClient(accessToken: string): BitGo {
  const env = (process.env.BITGO_ENV as "test" | "prod") || "test";
  const bitgo = new BitGo({ env });
  bitgo.authenticateWithAccessToken({ accessToken });
  return bitgo;
}

/**
 * Get information about the HR payroll wallet.
 *
 * @param accessToken - BitGo API access token
 * @param walletId - The HR IssuerMultisig wallet ID in BitGo
 * @returns Wallet information including balance
 */
export async function getWalletInfo(
  accessToken: string,
  walletId: string,
): Promise<BitGoWalletInfo> {
  const bitgo = createBitGoClient(accessToken);
  const wallet = await bitgo.coin(BITGO_BASE_COIN).wallets().get({ id: walletId });

  return {
    id: wallet.id(),
    label: wallet.label(),
    coin: BITGO_BASE_COIN,
    balance: wallet.balanceString() || "0",
    confirmedBalance: wallet.confirmedBalanceString() || "0",
  };
}

/**
 * Execute a batch payroll transaction via BitGo to Stealth Addresses on Base L2.
 *
 * This is the core integration point with BitGo's enterprise infrastructure.
 * It uses the `sendMany` function to batch-send ETH to multiple stealth
 * addresses in a single, gas-efficient transaction.
 *
 * @param accessToken - BitGo API token (stored in .env as BITGO_ACCESS_TOKEN)
 * @param walletId - The ID of the HR IssuerMultisig wallet in BitGo
 * @param walletPassphrase - The passphrase to unlock the signing key
 * @param payrollBatch - Array of { stealthAddress, amountInBaseUnits }
 * @returns Transaction result with hash and status
 */
export async function executeStealthPayrollBatch(
  accessToken: string,
  walletId: string,
  walletPassphrase: string,
  payrollBatch: BitGoPayrollPayment[],
): Promise<BitGoPayrollResult> {
  try {
    console.log("��� Authenticating with BitGo Enterprise...");
    const bitgo = createBitGoClient(accessToken);

    // 1. Get the ETH wallet on Base Testnet
    console.log(`📦 Loading wallet ${walletId} on ${BITGO_BASE_COIN}...`);
    const ethWallet = await bitgo
      .coin(BITGO_BASE_COIN)
      .wallets()
      .get({ id: walletId });

    console.log(
      `✅ Wallet "${ethWallet.label()}" loaded. Balance: ${ethWallet.balanceString()} wei`,
    );
    console.log(
      `🚀 Preparing batch transfer for ${payrollBatch.length} stealth recipients...`,
    );

    // 2. Format the recipients for BitGo's sendMany function
    const recipients = payrollBatch.map((payment) => ({
      address: payment.stealthAddress,
      amount: payment.amountInBaseUnits,
    }));

    // 3. Execute the batch transaction
    // This leverages BitGo's routing, policy checks, and gas management
    console.log("📡 Broadcasting stealth batch to Base network...");
    const transaction = await ethWallet.sendMany({
      recipients: recipients,
      walletPassphrase: walletPassphrase,
      // Optional: Add a hidden memo for enterprise tracking (stays off-chain in BitGo's DB)
      message: `PrivaRoll Batch Run - ${new Date().toISOString()}`,
    });

    const txHash = transaction.txid || transaction.hash || "pending";
    const status = transaction.status || "signed";

    console.log(`🎉 Payroll successfully broadcasted!`);
    console.log(`🔗 BaseScan TX Hash: ${txHash}`);

    return {
      success: true,
      txHash,
      status,
      recipientCount: payrollBatch.length,
    };
  } catch (error: any) {
    console.error("❌ BitGo Payroll Execution Failed:", error.message);
    throw new Error(`BitGo payroll failed: ${error.message}`);
  }
}

/**
 * Validate that the BitGo environment is properly configured.
 *
 * @returns Object describing which BitGo env vars are present
 */
export function validateBitGoConfig(): {
  configured: boolean;
  missing: string[];
  mode: "bitgo" | "direct" | "none";
} {
  const required = [
    "BITGO_ACCESS_TOKEN",
    "BITGO_WALLET_ID",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length === 0) {
    return { configured: true, missing: [], mode: "bitgo" };
  }

  // Check if direct signing mode is available as fallback
  if (process.env.PAYROLL_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY) {
    return { configured: true, missing, mode: "direct" };
  }

  return { configured: false, missing, mode: "none" };
}
