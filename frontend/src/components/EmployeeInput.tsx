"use client";

import { motion } from "framer-motion";
import { useEnsAddress, useEnsText } from "wagmi";
import NeonCard from "./NeonCard";

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
    <NeonCard
      glowColor={stealthMetaKey ? "emerald" : "rose"}
      hoverable
      className="p-4"
    >
      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <span className="text-sm">👤</span>
        {ensName}
      </h3>
      <p className="text-sm text-gray-400 mb-1">
        Public Identity:{" "}
        <span className="font-mono text-gray-300 text-xs">
          {mainAddress || (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-gray-500"
            >
              Resolving...
            </motion.span>
          )}
        </span>
      </p>
      {stealthMetaKey ? (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 rounded-lg bg-neon-emerald/5 border border-neon-emerald/20"
        >
          <p className="text-neon-emerald text-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-neon-emerald rounded-full animate-pulse" />
            Stealth Key Found — Ready for private payroll
          </p>
          <p className="text-xs text-gray-500 font-mono mt-1 truncate">
            Key: {stealthMetaKey}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 rounded-lg bg-neon-rose/5 border border-neon-rose/20"
        >
          <p className="text-neon-rose text-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-neon-rose rounded-full" />
            No Stealth Key registered in ENS
          </p>
        </motion.div>
      )}
    </NeonCard>
  );
}
