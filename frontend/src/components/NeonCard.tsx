"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface NeonCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "indigo" | "cyan" | "amber" | "emerald" | "rose" | "purple";
  hoverable?: boolean;
  delay?: number;
  variant?: "default" | "solid" | "outlined";
}

const glowMap = {
  indigo: {
    border: "border-neon-indigo/20 hover:border-neon-indigo/40",
    glow: "hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]",
    bg: "bg-neon-indigo/5",
    accentLine: "from-transparent via-neon-indigo/40 to-transparent",
  },
  cyan: {
    border: "border-neon-cyan/20 hover:border-neon-cyan/40",
    glow: "hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)]",
    bg: "bg-neon-cyan/5",
    accentLine: "from-transparent via-neon-cyan/40 to-transparent",
  },
  amber: {
    border: "border-neon-amber/20 hover:border-neon-amber/40",
    glow: "hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]",
    bg: "bg-neon-amber/5",
    accentLine: "from-transparent via-neon-amber/40 to-transparent",
  },
  emerald: {
    border: "border-neon-emerald/20 hover:border-neon-emerald/40",
    glow: "hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]",
    bg: "bg-neon-emerald/5",
    accentLine: "from-transparent via-neon-emerald/40 to-transparent",
  },
  rose: {
    border: "border-neon-rose/20 hover:border-neon-rose/40",
    glow: "hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)]",
    bg: "bg-neon-rose/5",
    accentLine: "from-transparent via-neon-rose/40 to-transparent",
  },
  purple: {
    border: "border-neon-purple/20 hover:border-neon-purple/40",
    glow: "hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]",
    bg: "bg-neon-purple/5",
    accentLine: "from-transparent via-neon-purple/40 to-transparent",
  },
};

export default function NeonCard({
  children,
  className = "",
  glowColor = "indigo",
  hoverable = true,
  delay = 0,
  variant = "default",
}: NeonCardProps) {
  const glow = glowMap[glowColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={hoverable ? { y: -2 } : undefined}
      className={`
        relative rounded-xl border backdrop-blur-sm overflow-hidden
        bg-[#111118]/60
        ${glow.border}
        ${hoverable ? glow.glow : ""}
        transition-all duration-500
        ${className}
      `}
    >
      {/* Top accent line */}
      <div
        className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${glow.accentLine}`}
      />

      {/* Corner accent dots */}
      {hoverable && (
        <>
          <div
            className={`absolute top-0 left-0 w-1 h-1 ${glow.bg} rounded-full opacity-50`}
          />
          <div
            className={`absolute top-0 right-0 w-1 h-1 ${glow.bg} rounded-full opacity-50`}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
