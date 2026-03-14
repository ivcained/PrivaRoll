This is the final piece of the execution pipeline. You have the cryptography to hide the addresses, and now you need the enterprise infrastructure to actually move the money.

To win the BitGo DeFi Composability & Privacy track, you need to show that you are using their SDK programmatically. By using BitGo’s sendMany function, you can execute a batch payroll run—sending USDC to dozens of unlinked stealth addresses—in a single, gas-efficient transaction on Base L2.

Here is the Node.js backend script that your HR dashboard will trigger when they click "Run Payroll."

The BitGo Execution Script (HR Backend)
For this, you will be using the BitGo JS SDK. Assuming you are using Base Sepolia for the hackathon, BitGo typically references this environment using testnet coin identifiers (e.g., tbase for Base Testnet, and tbase:usdc for the USDC token on that network).

Create a new file in your backend/API routes: backend/src/services/bitgoPayroll.ts

TypeScript
import { BitGo } from 'bitgo';

// Initialize BitGo for the test environment
const bitgo = new BitGo({ env: 'test' });

/**
 * Executes a batch payroll transaction via BitGo to Stealth Addresses on Base L2.
 * * @param accessToken - BitGo API token (stored in your .env)
 * @param walletId - The ID of the HR IssuerMultisig wallet in BitGo
 * @param walletPassphrase - The passphrase to unlock the signing key
 * @param payrollBatch - Array of { stealthAddress, amountInBaseUnits }
 */
export async function executeStealthPayrollBatch(
  accessToken: string,
  walletId: string,
  walletPassphrase: string,
  payrollBatch: Array<{ stealthAddress: string; amountInBaseUnits: string }>
) {
  try {
    console.log("🏦 Authenticating with BitGo Enterprise...");
    bitgo.authenticateWithAccessToken({ accessToken });

    // 1. Get the specific USDC wallet on Base Testnet
    // Note: 'tbase:usdc' represents Testnet Base USDC. Adjust if BitGo updates their coin ticker.
    const usdcWallet = await bitgo.coin('tbase:usdc').wallets().get({ id: walletId });

    console.log(`✅ Wallet loaded. Preparing batch transfer for ${payrollBatch.length} employees.`);

    // 2. Format the recipients for BitGo's sendMany function
    const recipients = payrollBatch.map((payment) => ({
      address: payment.stealthAddress,
      amount: payment.amountInBaseUnits, // Must be stringified integer (e.g., "5000000" for 5 USDC if 6 decimals)
    }));

    // 3. Execute the batch transaction
    // This leverages BitGo's routing, policy checks, and gas management automatically
    console.log("🚀 Broadcasting stealth batch to Base network...");
    const transaction = await usdcWallet.sendMany({
      recipients: recipients,
      walletPassphrase: walletPassphrase,
      // Optional: Add a hidden memo or enterprise tracking ID that stays off-chain in BitGo's DB
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
How to tie the whole flow together in your API Route
When your Next.js frontend calls your /api/run-payroll endpoint, here is how the entire architecture synchronizes in just a few lines of code:

TypeScript
import { generateStealthPayment } from '../../../lib/stealth';
import { executeStealthPayrollBatch } from '../../../services/bitgoPayroll';

export async function POST(req: Request) {
  const { hrApproverPassphrase, employeePayments } = await req.json();
  
  const finalBatch = [];
  const publishedEphemeralKeys = [];

  // 1. Generate Stealth Addresses mathematically
  for (const payment of employeePayments) {
    // Math happens off-chain in your server/browser
    const { stealthAddress, ephemeralPublicKey } = generateStealthPayment(payment.employeeMetaKey);
    
    finalBatch.push({
      stealthAddress: stealthAddress,
      amountInBaseUnits: payment.amountUSDC,
    });
    
    publishedEphemeralKeys.push(ephemeralPublicKey);
  }

  // 2. Broadcast via BitGo to Base EVM
  const result = await executeStealthPayrollBatch(
    process.env.BITGO_TEST_TOKEN,
    process.env.HR_MULTISIG_WALLET_ID,
    hrApproverPassphrase,
    finalBatch
  );

  // 3. Save the Ephemeral Keys to your DB or IPFS so employees can scan for them later!
  await saveEphemeralKeysToRegistry(publishedEphemeralKeys);

  return Response.json({ success: true, txHash: result.txHash });
}
The Hackathon Pitch for the BitGo Judges
When the BitGo judges come to your table, show them this exact sendMany script and pitch it like this:

"We didn't just build a smart contract. We built an enterprise integration. Traditional privacy tools require users to manually wrap and unwrap tokens, which breaks enterprise accounting. By using BitGo’s sendMany API, our HR multi-sig stays completely compliant and auditable inside the BitGo dashboard. But because we map the recipients to Diffie-Hellman stealth addresses, the data exported to the public Base network is totally unlinked."