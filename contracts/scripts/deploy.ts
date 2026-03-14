import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("═══════════════════════════════════════════════════");
  console.log("  🛡️  PrivaRoll — Deploying Contracts to Base");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance:  ${ethers.formatEther(balance)} ETH`);
  console.log("───────────────────────────────────────────────────");

  // Deploy StealthKeyRegistry
  console.log("\n📦 Deploying StealthKeyRegistry...");
  const StealthKeyRegistry = await ethers.getContractFactory(
    "StealthKeyRegistry",
  );
  const registry = await StealthKeyRegistry.deploy();
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log(`  ✅ StealthKeyRegistry deployed at: ${registryAddress}`);

  // Log deployment summary
  console.log("\n══��════════════════════════════════════════════════");
  console.log("  📋 Deployment Summary");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  StealthKeyRegistry: ${registryAddress}`);
  console.log("═══════════════════════════════════════════════════");
  console.log("\n  ⚠️  Save these addresses in your .env file:");
  console.log(`    STEALTH_REGISTRY_ADDRESS=${registryAddress}`);
  console.log("═══════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
