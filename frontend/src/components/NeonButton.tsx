"use client";

import { motion } from "framer-motion";
import { ReactNode, ButtonHTMLAttributes } from "react";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "cyber";
  size?: "sm" | "md" | "lg";
  glowing?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: {
    base: "bg-gradient-to-r from-neon-indigo to-neon-cyan text-white",
    hover:
      "hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.5)] hover:brightness-110",
    disabled: "disabled:from-gray-700 disabled:to-gray-600",
  },
  secondary: {
    base: "bg-neon-indigo/10 border border-neon-indigo/30 text-neon-indigo",
    hover:
      "hover:bg-neon-indigo/20 hover:border-neon-indigo/50 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]",
    disabled:
      "disabled:bg-gray-800 disabled:border-gray-700 disabled:text-gray-500",
  },
  danger: {
    base: "bg-neon-rose/10 border border-neon-rose/30 text-neon-rose",
    hover:
      "hover:bg-neon-rose/20 hover:border-neon-rose/50 hover:shadow-[0_0_20px_-5px_rgba(244,63,94,0.3)]",
    disabled:
      "disabled:bg-gray-800 disabled:border-gray-700 disabled:text-gray-500",
  },
  ghost: {
    base: "bg-transparent border border-white/10 text-gray-300",
    hover: "hover:bg-white/5 hover:border-white/20",
    disabled:
      "disabled:bg-transparent disabled:border-gray-800 disabled:text-gray-600",
  },
  cyber: {
    base: "bg-gradient-to-r from-neon-cyan/20 to-neon-indigo/20 border border-neon-cyan/30 text-neon-cyan",
    hover:
      "hover:from-neon-cyan/30 hover:to-neon-indigo/30 hover:border-neon-cyan/50 hover:shadow-[0_0_25px_-5px_rgba(34,211,238,0.4)]",
    disabled:
      "disabled:from-gray-800 disabled:to-gray-800 disabled:border-gray-700 disabled:text-gray-500",
  },
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
};

export default function NeonButton({
  children,
  variant = "primary",
  size = "md",
  glowing = false,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: NeonButtonProps) {
  const styles = variantStyles[variant];

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      disabled={disabled}
      className={`
        relative font-semibold transition-all duration-300
        disabled:cursor-not-allowed disabled:opacity-50
        flex items-center justify-center
        ${styles.base}
        ${styles.hover}
        ${styles.disabled}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${glowing && !disabled ? "animate-neon-pulse" : ""}
        ${className}
      `}
      {...(props as any)}
    >
      {/* Inner glow effect for primary variant */}
      {variant === "primary" && !disabled && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-indigo/0 via-white/10 to-neon-cyan/0 opacity-0 hover:opacity-100 transition-opacity duration-500" />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
