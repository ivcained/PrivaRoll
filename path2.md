This is the absolute core of the Base EVM pivot. To make Stealth Addresses work without massive gas fees, all the heavy cryptographic lifting happens right in the HR manager's browser.By the time the transaction hits Base, it's just a standard, cheap ETH transfer.Here is the underlying Elliptic Curve Diffie-Hellman (ECDH) math you need.The Cryptography (How it works)To ensure HR can generate an address that only the employee can access (without HR knowing the private key), we use elliptic curve point addition.HR generates a random "ephemeral" key pair.HR combines their ephemeral private key with the Employee's public Meta-Key to create a Shared Secret ($S$).HR hashes that secret and multiplies it by the generator point, adding it to the employee's public key to get the final stealth address:$$P_{stealth} = P_{meta} + \text{hash}(S) \times G$$The employee does the reverse math to derive the private key:$$p_{stealth} = p_{meta} + \text{hash}(S) \pmod{n}$$The TypeScript ImplementationTo make this clean and mathematically accurate in the browser, we will use ethers and @noble/secp256k1 (the gold standard for JS elliptic curve math).Install the required packages in your Next.js frontend:Bashnpm install ethers @noble/secp256k1
Create a new file: frontend/src/lib/stealth.tsTypeScriptimport { ethers } from 'ethers';
import * as secp from '@noble/secp256k1';

/**
 * 1. FOR THE EMPLOYEE: Generate their Stealth Meta-Keys
 * They run this once and save the 'stealthPublicKey' to their ENS text records.
 */
export function generateEmployeeMetaKeys() {
  // Generate a random private key for the stealth identity 
  // (In a real app, derive this deterministically from their main wallet signature)
  const stealthPrivateKey = secp.utils.randomPrivateKey();
  const stealthPublicKey = secp.getPublicKey(stealthPrivateKey, true); // Compressed public key

  return {
    privateKey: secp.utils.bytesToHex(stealthPrivateKey),
    publicKey: secp.utils.bytesToHex(stealthPublicKey),
  };
}

/**
 * 2. FOR HR: Generate the One-Time Stealth Address
 * HR's browser runs this using the Employee's public key retrieved from ENS.
 */
export function generateStealthPayment(employeePublicKeyHex: string) {
  // 1. HR generates a random ephemeral private key for this specific paycheck
  const ephemeralPrivateKey = secp.utils.randomPrivateKey();
  const ephemeralPublicKey = secp.getPublicKey(ephemeralPrivateKey, true);

  // 2. HR computes the Shared Secret using ECDH
  // Shared Secret = ephemeral_priv * employee_pub
  const sharedSecret = secp.getSharedSecret(ephemeralPrivateKey, employeePublicKeyHex, true);

  // 3. Hash the shared secret to create a spending modifier
  // We use ethers.keccak256 to match EVM standards
  const modifierHex = ethers.keccak256(sharedSecret);
  const modifierBytes = secp.utils.hexToBytes(modifierHex.slice(2));

  // 4. Calculate the final Stealth Public Key
  // P_stealth = P_meta + (modifier * G)
  const stealthPublicKeyPoint = secp.ProjectivePoint.fromHex(employeePublicKeyHex)
    .add(secp.ProjectivePoint.fromPrivateKey(modifierBytes));
  
  const stealthPublicKeyHex = stealthPublicKeyPoint.toHex(false); // Uncompressed for Ethereum address derivation

  // 5. Derive the standard Ethereum address from the uncompressed public key
  // Ethereum addresses are the last 20 bytes of the keccak256 hash of the public key (without the 0x04 prefix)
  const pubKeyHash = ethers.keccak256("0x" + stealthPublicKeyHex.slice(2));
  const stealthAddress = ethers.getAddress("0x" + pubKeyHash.slice(-40));

  return {
    stealthAddress, // HR sends ETH here via BitGo
    ephemeralPublicKey: secp.utils.bytesToHex(ephemeralPublicKey), // Must be published so the employee can find the payment!
  };
}
How to wire this into your Next.js UIWhen the HR Manager clicks "Execute Payroll", your frontend logic will look exactly like this:TypeScriptimport { generateStealthPayment } from '../lib/stealth';
import { useEnsText } from 'wagmi';

async function executePayroll(employeeEnsName: string, amountETH: string) {
  // 1. Get the employee's public meta-key from ENS
  const employeePublicKey = await fetchEnsTextRecord(employeeEnsName, 'privaroll.stealth.metakey');
  
  if (!employeePublicKey) throw new Error("Employee not registered for PrivaRoll");

  // 2. Generate the one-time stealth address and the ephemeral key
  const { stealthAddress, ephemeralPublicKey } = generateStealthPayment(employeePublicKey);

  console.log(`Sending ${amountETH} ETH to unlinked address: ${stealthAddress}`);
  console.log(`Ephemeral Key (to publish): ${ephemeralPublicKey}`);

  // 3. Send these details to your BitGo backend integration
  // BitGo batches the ETH transfers to 'stealthAddress'
  // You also log the 'ephemeralPublicKey' to a public registry contract or database
}
The "Aha!" Moment for the JudgesIf a judge asks, "Wait, how do you prevent HR from stealing the funds since they generated the address?"You point directly to this code and say: "HR generates the address, but because of elliptic curve point addition, HR only knows the ephemeral key. They do not know the employee's private meta-key. Therefore, HR cannot derive the final private key needed to spend the funds. Only the employee can."