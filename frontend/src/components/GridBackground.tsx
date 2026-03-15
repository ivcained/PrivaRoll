"use client";

import { motion } from "framer-motion";

export default function GridBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base dark gradient - vapor-bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f]" />

      {/* Subtle purple haze overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#1a0a2e]/10 to-transparent" />

      {/* Primary grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Secondary finer grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "15px 15px",
        }}
      />

      {/* Radial glow - top center (indigo) */}
      <motion.div
        animate={{
          opacity: [0.08, 0.15, 0.08],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-radial from-indigo-500/10 via-transparent to-transparent rounded-full blur-3xl"
      />

      {/* Radial glow - bottom left (cyan) */}
      <motion.div
        animate={{
          opacity: [0.06, 0.12, 0.06],
          x: [0, 20, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-[700px] h-[500px] bg-gradient-radial from-cyan-500/8 via-transparent to-transparent rounded-full blur-3xl"
      />

      {/* Radial glow - bottom right (purple) */}
      <motion.div
        animate={{
          opacity: [0.05, 0.1, 0.05],
          x: [0, -15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-radial from-purple-500/8 via-transparent to-transparent rounded-full blur-3xl"
      />

      {/* Central orb glow */}
      <motion.div
        animate={{
          opacity: [0.03, 0.07, 0.03],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-neon-indigo/5 via-transparent to-transparent rounded-full blur-3xl"
      />

      {/* Animated scan line */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ y: ["-100vh", "100vh"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"
        />
      </div>

      {/* Secondary horizontal scan line */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ y: ["100vh", "-100vh"] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent"
        />
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-neon-indigo/30"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}

      {/* Corner vignette overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#0a0a0f]/50" />
    </div>
  );
}
