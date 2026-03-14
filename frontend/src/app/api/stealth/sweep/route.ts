import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

/**
 * POST /api/stealth/sweep
 *
 * Sweep ETH from a stealth address to a destination wallet.
 * The client derives the stealth spending private key locally and sends it here.
 *
 * Body: {
 *   stealthPrivateKey: string  - The derived stealth spending private key (hex)
 *   destinationAddress: string - Where to send the ETH
 * }
 *
 * Returns: { txHash, amount, from, to }
 */
export async function POST(req: NextRequest) {
  try {
    const { stealthPrivateKey, destinationAddress } = await req.json();

    if (!stealthPrivateKey || !destinationAddress) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: stealthPrivateKey, destinationAddress",
        },
        { status: 400 },
      );
    }

    // Validate destination address
    if (!ethers.isAddress(destinationAddress)) {
      return NextResponse.json(
        { error: "Invalid destination address" },
        { status: 400 },
      );
    }

    const rpcUrl =
      process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(
      stealthPrivateKey.startsWith("0x")
        ? stealthPrivateKey
        : `0x${stealthPrivateKey}`,
      provider,
    );

    const stealthAddress = wallet.address;
    console.log(`🔑 Sweeping from stealth address: ${stealthAddress}`);

    // Check balance
    const balance = await provider.getBalance(stealthAddress);
    console.log(
      `💰 Stealth address balance: ${ethers.formatEther(balance)} ETH`,
    );

    if (balance === BigInt(0)) {
      return NextResponse.json(
        {
          error: `No ETH balance found at stealth address ${stealthAddress}`,
          stealthAddress,
          balance: "0",
        },
        { status: 400 },
      );
    }

    // Estimate gas cost for the transfer using EIP-1559 fees
    const feeData = await provider.getFeeData();
    const gasLimit = BigInt(21000); // Standard ETH transfer

    // Use maxFeePerGas for EIP-1559 chains (like Base), with a 20% buffer for safety
    // This ensures we don't underestimate the gas cost
    const maxFeePerGas =
      feeData.maxFeePerGas ||
      feeData.gasPrice ||
      ethers.parseUnits("1", "gwei");
    const maxPriorityFeePerGas =
      feeData.maxPriorityFeePerGas || ethers.parseUnits("1", "gwei");

    // Add 20% buffer to maxFeePerGas to handle fee fluctuations
    const bufferedMaxFee = (maxFeePerGas * BigInt(120)) / BigInt(100);
    const gasCost = gasLimit * bufferedMaxFee;

    console.log(
      `⛽ Gas estimate: maxFeePerGas=${ethers.formatUnits(maxFeePerGas, "gwei")} gwei, buffered=${ethers.formatUnits(bufferedMaxFee, "gwei")} gwei, total cost=${ethers.formatEther(gasCost)} ETH`,
    );

    if (balance <= gasCost) {
      return NextResponse.json(
        {
          error: `Balance (${ethers.formatEther(balance)} ETH) is too low to cover gas costs (${ethers.formatEther(gasCost)} ETH)`,
          stealthAddress,
          balance: ethers.formatEther(balance),
          gasCost: ethers.formatEther(gasCost),
        },
        { status: 400 },
      );
    }

    // Send the full balance minus gas cost
    const amountToSend = balance - gasCost;

    console.log(
      `🚀 Sweeping ${ethers.formatEther(amountToSend)} ETH to ${destinationAddress}`,
    );

    const tx = await wallet.sendTransaction({
      to: destinationAddress,
      value: amountToSend,
      gasLimit,
      maxFeePerGas: bufferedMaxFee,
      maxPriorityFeePerGas,
    });

    console.log(`✅ Sweep transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait(1);

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      from: stealthAddress,
      to: destinationAddress,
      amount: ethers.formatEther(amountToSend),
      gasUsed: receipt?.gasUsed?.toString() || "21000",
      blockNumber: receipt?.blockNumber,
    });
  } catch (error: any) {
    console.error("Sweep failed:", error);
    return NextResponse.json(
      {
        error: `Sweep failed: ${error.message || String(error)}`,
      },
      { status: 500 },
    );
  }
}
