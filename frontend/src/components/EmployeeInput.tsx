"use client";

import { useEnsAddress, useEnsText } from "wagmi";

/**
 * ENS-integrated employee input component.
 * Resolves .eth names and fetches the stealth meta-key from ENS text records.
 */
export function EmployeeInput({ ensName }: { ensName: string }) {
  // 1. Resolve their standard address
  const { data: mainAddress } = useEnsAddress({ name: ensName });

  // 2. Fetch their Stealth Meta-Key stored in ENS text records
  const { data: stealthMetaKey } = useEnsText({
    name: ensName,
    key: "privaroll.stealth.metakey",
  });

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/50">
      <h3 className="text-lg font-semibold text-white mb-2">
        Employee: {ensName}
      </h3>
      <p className="text-sm text-gray-400 mb-1">
        Public Identity:{" "}
        <span className="font-mono text-gray-300">
          {mainAddress || "Resolving..."}
        </span>
      </p>
      {stealthMetaKey ? (
        <div className="mt-2">
          <p className="text-green-500 text-sm">
            ✅ Stealth Key Found. Ready for private payroll.
          </p>
          <p className="text-xs text-gray-500 font-mono mt-1 truncate">
            Key: {stealthMetaKey}
          </p>
        </div>
      ) : (
        <p className="text-red-500 text-sm mt-2">
          ❌ No Stealth Key registered in ENS.
        </p>
      )}
    </div>
  );
}
