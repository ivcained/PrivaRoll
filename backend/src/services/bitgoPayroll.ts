import { BitGo } from "bitgo";

/**
 * BitGo Payroll Service
 *
 * Executes batch payroll transactions via BitGo SDK to stealth addresses on Base L2.
 * Uses BitGo's sendMany function for gas-efficient batch ETH transfers.
 *
 * @see https://developers.bitgo.com/docs/get-started-quick-start
 */

// Initialize BitGo for the test environment
const bitgo = new BitGo({ env: "test" });

export interface PayrollPayment {
  stealthAddress: string;
  amountInBaseUnits: string; // Stringified integer in wei (e.g., "5000000000000000" for 0.005 ETH)
}

export interface PayrollResult {
  success: boolean;
  txHash: string;
}

/**
 * Executes a batch payroll transaction via BitGo to Stealth Addresses on Base L2.
 *
 * @param accessToken - BitGo API access token (from .env)
 * @param walletId - The ID of the HR IssuerMultisig wallet in BitGo
 * @param walletPassphrase - The passphrase to unlock the signing key
 * @param payrollBatch - Array of { stealthAddress, amountInBaseUnits }
 * @returns PayrollResult with success status and transaction hash
 */
export async function executeStealthPayrollBatch(
  accessToken: string,
  walletId: string,
  walletPassphrase: string,
  payrollBatch: PayrollPayment[],
): Promise<PayrollResult> {
  try {
    console.log("🏦 Authenticating with BitGo Enterprise...");
    bitgo.authenticateWithAccessToken({ accessToken });

    // 1. Get the ETH wallet on Base Sepolia Testnet
    // Note: BitGo test environment supports 'tbaseeth' for Base Sepolia ETH.
    // In production, switch to 'baseeth' or the appropriate token coin.
    const wallet = await bitgo
      .coin("tbaseeth")
      .wallets()
      .get({ id: walletId });

    console.log(
      `✅ Wallet loaded. Preparing batch transfer for ${payrollBatch.length} employees.`,
    );

    // 2. Format the recipients for BitGo's sendMany function
    const recipients = payrollBatch.map((payment) => ({
      address: payment.stealthAddress,
      amount: payment.amountInBaseUnits,
    }));

    // 3. Execute the batch transaction
    // This leverages BitGo's routing, policy checks, and gas management automatically
    console.log("🚀 Broadcasting stealth batch to Base network...");
    const transaction = await wallet.sendMany({
      recipients: recipients,
      walletPassphrase: walletPassphrase,
      // Optional: Add a hidden memo that stays off-chain in BitGo's DB
      message: `PrivaRoll Batch Run - ${new Date().toISOString()}`,
    });

    console.log(`🎉 Payroll successfully broadcasted!`);
    console.log(`🔗 BaseScan TX Hash: ${transaction.txid}`);

    return {
      success: true,
      txHash: transaction.txid,
    };
  } catch (error) {
    console.error("❌ BitGo Payroll Execution Failed:", error);
    throw error;
  }
}

/**
 * Initializes a BitGo wallet instance for the HR IssuerMultisig.
 * Useful for checking balances, listing pending approvals, etc.
 *
 * @param accessToken - BitGo API access token
 * @param walletId - The wallet ID
 * @returns The wallet instance
 */
export async function getIssuerWallet(accessToken: string, walletId: string) {
  bitgo.authenticateWithAccessToken({ accessToken });
  return await bitgo.coin("tbaseeth").wallets().get({ id: walletId });
}

/**
 * Retrieves the current balance of the HR IssuerMultisig wallet.
 *
 * @param accessToken - BitGo API access token
 * @param walletId - The wallet ID
 * @returns Balance information
 */
export async function getWalletBalance(accessToken: string, walletId: string) {
  const wallet = await getIssuerWallet(accessToken, walletId);
  return {
    balance: wallet.balance(),
    confirmedBalance: wallet.confirmedBalance(),
    spendableBalance: wallet.spendableBalance(),
  };
}
