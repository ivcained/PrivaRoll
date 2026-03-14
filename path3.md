This is where the magic happens for the employee. They are looking at a public blockchain, but only their wallet holds the mathematical cryptographic key to unlock the funds.To do this, the employee's browser will take the ephemeral public key (that HR published during the payroll run) and multiply it by their own private meta-key. Because of the beautiful symmetry of Elliptic Curve Cryptography, this produces the exact same shared secret that HR generated, allowing the employee to derive the final spending key.Here is the math powering it:$$p_{stealth} = p_{meta} + \text{hash}(S) \pmod{n}$$(Where $n$ is the secp256k1 curve order).The TypeScript Implementation (Employee Side)Add this to your existing frontend/src/lib/stealth.ts file. This function takes the published ephemeral key and the employee's secret meta-key, and spits out a fully functional ethers.Wallet ready to sweep the ETH on Base.TypeScript/**
 * 3. FOR THE EMPLOYEE: Scan and Derive the Spending Key
 * The employee's browser runs this to find their money and unlock it.
 */
export function deriveStealthPrivateKey(
  stealthPrivateKeyHex: string, 
  ephemeralPublicKeyHex: string
) {
  // 1. Convert hex inputs to bytes/bigints for curve math
  const privKeyBytes = secp.utils.hexToBytes(stealthPrivateKeyHex.replace('0x', ''));
  const privKeyInt = secp.utils.bytesToNumber(privKeyBytes);

  // 2. Reconstruct the Shared Secret!
  // Employee Private Key * HR Ephemeral Public Key = Shared Secret
  const sharedSecret = secp.getSharedSecret(privKeyBytes, ephemeralPublicKeyHex, true);

  // 3. Hash the shared secret to recreate the spending modifier (exactly as HR did)
  const modifierHex = ethers.keccak256(sharedSecret);
  const modifierBytes = secp.utils.hexToBytes(modifierHex.slice(2));
  const modifierInt = secp.utils.bytesToNumber(modifierBytes);

  // 4. Derive the final Stealth Private Key
  // p_stealth = (p_meta + modifier) mod n
  const stealthPrivInt = secp.utils.mod(privKeyInt + modifierInt, secp.CURVE.n);
  const stealthPrivBytes = secp.utils.numberToBytes(stealthPrivInt);
  const stealthPrivateKeyStr = "0x" + secp.utils.bytesToHex(stealthPrivBytes);

  // 5. Create an ethers wallet instance from the derived key
  // We can now use this to interact with the Base network and move the ETH!
  const stealthWallet = new ethers.Wallet(stealthPrivateKeyStr);

  return stealthWallet;
}
How to wire this into your Next.js UI (The "Claim" Button)When the employee logs into the PrivaRoll dashboard, they will click a button that says "Scan for Paychecks." Your app will fetch the list of ephemeral keys published by HR for that month, try to derive the stealth address for each one, and check if it has an ETH balance on Base.Here is what that looks like in your React component:TypeScriptimport { useState } from 'react';
import { ethers } from 'ethers';
import { deriveStealthPrivateKey } from '../lib/stealth';

// Use Base RPC (Testnet: Base Sepolia)
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
// For ETH, we simply check the native balance using provider.getBalance()
// No contract address needed for native ETH transfers

export function EmployeeDashboard({ stealthPrivateKey, publishedEphemeralKeys }) {
  const [foundFunds, setFoundFunds] = useState<string | null>(null);

  async function scanNetwork() {
    console.log("🔍 Scanning Base network for stealth payments...");

    for (const ephemeralKey of publishedEphemeralKeys) {
      try {
        // 1. Mathematically derive the stealth wallet
        const stealthWallet = deriveStealthPrivateKey(stealthPrivateKey, ephemeralKey);
        const stealthWalletConnected = stealthWallet.connect(provider);

        // 2. Check if this unlinked address has ETH on Base
        const balance = await provider.getBalance(stealthWallet.address);

        if (balance > 0n) {
          console.log(`🎉 Found ${ethers.formatEther(balance)} ETH at ${stealthWallet.address}`);
          setFoundFunds(stealthWallet.address);
          
          // Next step: Provide a button for the user to sweep the ETH
          // to their main public wallet or an exchange!
          return;
        }
      } catch (err) {
        // If the math fails or it's not their payment, silently skip
        continue; 
      }
    }
    console.log("No payments found for this period.");
  }

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg">
      <h2 className="text-xl font-bold">Your PrivaRoll Portal</h2>
      <button 
        onClick={scanNetwork} 
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
      >
        Scan Base Network for Paychecks
      </button>

      {foundFunds && (
        <div className="mt-4 p-4 border border-green-500 bg-green-900/20 rounded">
          <p>💰 Paycheck located in Stealth Address: {foundFunds}</p>
          <button className="mt-2 text-sm underline text-green-300">
            Sweep to Main Wallet
          </button>
        </div>
      )}
    </div>
  );
}
The Hackathon Demo Mic-DropWhen you demo this to the judges, show the screen split in half.On the left, show BaseScan. Show that the stealth address 0xABC... has no connection to the employee's public .eth name. It just looks like a random wallet.On the right, have the employee click "Scan Base Network." As soon as the UI flashes green and says "Paycheck located," explain to the judges:"BaseScan doesn't know who owns this money, but our local browser just used Diffie-Hellman key exchange to prove that this specific employee is the only person in the world who can spend it."