import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
import { StealthKeyRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("StealthKeyRegistry", function () {
  let registry: StealthKeyRegistry;
  let owner: SignerWithAddress;
  let issuer: SignerWithAddress;
  let employee: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  // Sample 33-byte compressed public key (0x02 prefix + 32 bytes)
  const sampleMetaKey =
    "0x02" + "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
  const sampleEphemeralKey =
    "0x03" + "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5";

  beforeEach(async function () {
    [owner, issuer, employee, unauthorized] = await ethers.getSigners();

    const StealthKeyRegistryFactory = await ethers.getContractFactory(
      "StealthKeyRegistry",
    );
    registry =
      (await StealthKeyRegistryFactory.deploy()) as unknown as StealthKeyRegistry;
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the deployer as owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("should start with payrollRunCounter at 0", async function () {
      expect(await registry.payrollRunCounter()).to.equal(0n);
    });
  });

  describe("Issuer Management", function () {
    it("should allow owner to add an authorized issuer", async function () {
      await registry.addAuthorizedIssuer(issuer.address);
      expect(await registry.authorizedIssuers(issuer.address)).to.be.true;
    });

    it("should allow owner to remove an authorized issuer", async function () {
      await registry.addAuthorizedIssuer(issuer.address);
      await registry.removeAuthorizedIssuer(issuer.address);
      expect(await registry.authorizedIssuers(issuer.address)).to.be.false;
    });

    it("should reject non-owner from adding issuers", async function () {
      await expect(
        registry.connect(unauthorized).addAuthorizedIssuer(issuer.address),
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });

  describe("Stealth Meta Key Registration", function () {
    it("should allow an employee to register their stealth meta key", async function () {
      await registry.connect(employee).registerStealthMetaKey(sampleMetaKey);
      const storedKey = await registry.getStealthMetaKey(employee.address);
      expect(storedKey).to.equal(sampleMetaKey.toLowerCase());
    });

    it("should reject keys with invalid length", async function () {
      const invalidKey = "0x02abcd"; // Too short
      await expect(
        registry.connect(employee).registerStealthMetaKey(invalidKey),
      ).to.be.revertedWith(
        "StealthKeyRegistry: invalid key length (expected 33 bytes compressed)",
      );
    });

    it("should emit StealthMetaKeyRegistered event", async function () {
      await expect(
        registry.connect(employee).registerStealthMetaKey(sampleMetaKey),
      )
        .to.emit(registry, "StealthMetaKeyRegistered")
        .withArgs(employee.address, sampleMetaKey.toLowerCase());
    });
  });

  describe("Payroll Run Publication", function () {
    beforeEach(async function () {
      await registry.addAuthorizedIssuer(issuer.address);
    });

    it("should allow an authorized issuer to publish a payroll run", async function () {
      const stealthAddr = ethers.Wallet.createRandom().address;
      const tx = await registry
        .connect(issuer)
        .publishPayrollRun([sampleEphemeralKey], [stealthAddr]);

      await expect(tx).to.emit(registry, "PayrollRunCreated");
      expect(await registry.payrollRunCounter()).to.equal(1n);
    });

    it("should store ephemeral key entries correctly", async function () {
      const stealthAddr = ethers.Wallet.createRandom().address;
      await registry
        .connect(issuer)
        .publishPayrollRun([sampleEphemeralKey], [stealthAddr]);

      const entryCount = await registry.getPayrollRunEntryCount(0);
      expect(entryCount).to.equal(1n);

      const [ephKey, addr, timestamp] = await registry.getEphemeralKeyEntry(
        0,
        0,
      );
      expect(ephKey).to.equal(sampleEphemeralKey.toLowerCase());
      expect(addr).to.equal(stealthAddr);
      expect(timestamp).to.be.gt(0);
    });

    it("should reject mismatched array lengths", async function () {
      await expect(
        registry.connect(issuer).publishPayrollRun(
          [sampleEphemeralKey],
          [], // empty stealth addresses
        ),
      ).to.be.revertedWith("StealthKeyRegistry: array length mismatch");
    });

    it("should reject empty batches", async function () {
      await expect(
        registry.connect(issuer).publishPayrollRun([], []),
      ).to.be.revertedWith("StealthKeyRegistry: empty batch");
    });

    it("should reject unauthorized callers", async function () {
      await expect(
        registry
          .connect(unauthorized)
          .publishPayrollRun(
            [sampleEphemeralKey],
            [ethers.Wallet.createRandom().address],
          ),
      ).to.be.revertedWith(
        "StealthKeyRegistry: caller is not an authorized issuer",
      );
    });
  });
});
