"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NeonCard from "@/components/NeonCard";
import NeonButton from "@/components/NeonButton";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const featureCards = [
  {
    icon: "🔒",
    title: "Stealth Addresses",
    description: "ERC-5564 compliant one-time addresses for every payment",
    color: "text-neon-indigo",
  },
  {
    icon: "🏦",
    title: "BitGo Multi-Sig",
    description: "Enterprise-grade custody with policy-enforced batch transfers",
    color: "text-neon-cyan",
  },
  {
    icon: "📋",
    title: "ENS Integration",
    description: "Store stealth meta-keys in ENS text records for auto-lookup",
    color: "text-neon-purple",
  },
  {
    icon: "⛓️",
    title: "Base L2",
    description: "Low-cost, fast transactions on Coinbase's L2 rollup",
    color: "text-neon-emerald",
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-8">
      {/* Hero Section */}
      <motion.div
        className="text-center max-w-3xl mx-auto"
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        {/* Animated Shield Icon */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <motion.div className="relative inline-block">
            <motion.span
              className="text-7xl inline-block"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              🛡️
            </motion.span>
            {/* Glow ring behind icon */}
            <motion.div
              className="absolute inset-0 rounded-full bg-neon-indigo/10 blur-xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>

        {/* Title with neon glow */}
        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="text-6xl md:text-7xl font-bold mb-4"
        >
          <span className="bg-gradient-to-r from-neon-indigo via-neon-cyan to-neon-indigo bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-text">
            PrivaRoll
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="text-xl text-gray-400 mb-2 neon-text-cyan"
        >
          Public Solvency. Unlinkable Distributions.
        </motion.p>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="text-lg text-gray-500 mb-8"
        >
          Enterprise Web3 Payroll on Base
        </motion.p>

        {/* Network Badges */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-12 flex-wrap"
        >
          {[
            {
              label: "Deployed on Base EVM",
              color:
                "bg-neon-indigo/10 border-neon-indigo/30 text-neon-indigo",
            },
            {
              label: "ENS Integrated",
              color:
                "bg-neon-purple/10 border-neon-purple/30 text-neon-purple",
            },
            {
              label: "BitGo Enterprise",
              color:
                "bg-neon-emerald/10 border-neon-emerald/30 text-neon-emerald",
            },
          ].map((badge) => (
            <motion.span
              key={badge.label}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`px-3 py-1 border rounded-full text-sm ${badge.color} backdrop-blur-sm`}
            >
              {badge.label}
            </motion.span>
          ))}
        </motion.div>

        {/* Navigation Cards */}
        <motion.div
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <Link href="/hr">
            <NeonCard glowColor="indigo" delay={0.2} className="p-6 h-full">
              <motion.div
                className="text-3xl mb-3"
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                🏢
              </motion.div>
              <h2 className="text-lg font-semibold mb-2 text-neon-indigo">
                HR Dashboard
              </h2>
              <p className="text-sm text-gray-500">
                Run payroll via BitGo multi-sig, batch ETH transfers to stealth
                addresses
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-neon-indigo/60">
                <span>Open Dashboard</span>
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </div>
            </NeonCard>
          </Link>

          <Link href="/employee">
            <NeonCard glowColor="cyan" delay={0.3} className="p-6 h-full">
              <motion.div
                className="text-3xl mb-3"
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
              >
                👤
              </motion.div>
              <h2 className="text-lg font-semibold mb-2 text-neon-cyan">
                Employee Portal
              </h2>
              <p className="text-sm text-gray-500">
                Scan for paychecks, derive spending keys, sweep ETH to your
                wallet
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-neon-cyan/60">
                <span>Open Portal</span>
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </div>
            </NeonCard>
          </Link>

          <Link href="/setup">
            <NeonCard glowColor="amber" delay={0.4} className="p-6 h-full">
              <motion.div
                className="text-3xl mb-3"
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.6,
                }}
              >
                ⚙️
              </motion.div>
              <h2 className="text-lg font-semibold mb-2 text-neon-amber">
                Setup & Keys
              </h2>
              <p className="text-sm text-gray-500">
                Generate stealth meta-keys, configure ENS text records, manage
                identity
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-neon-amber/60">
                <span>Configure</span>
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </div>
            </NeonCard>
          </Link>
        </motion.div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-16 max-w-4xl mx-auto w-full"
      >
        <h3 className="text-lg font-semibold text-gray-400 mb-6 text-center">
          Core Technology
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featureCards.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              whileHover={{ y: -3 }}
              className="p-4 rounded-xl bg-[#111118]/60 border border-white/[0.06] backdrop-blur-sm text-center"
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h4 className={`text-sm font-semibold mb-1 ${feature.color}`}>
                {feature.title}
              </h4>
              <p className="text-xs text-gray-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Architecture Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-12 max-w-2xl mx-auto text-center"
      >
        <h3 className="text-lg font-semibold text-gray-400 mb-4">
          How It Works
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 flex-wrap">
          {[
            { label: "ENS Meta-Key", highlight: false },
            { label: "Stealth Derivation", highlight: false },
            { label: "BitGo Batch TX", highlight: true },
            { label: "Private Retrieval", highlight: false },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              {i > 0 && (
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                  className="text-neon-indigo"
                >
                  →
                </motion.span>
              )}
              <motion.span
                whileHover={{ y: -2 }}
                className={`px-3 py-1.5 rounded-lg ${
                  step.highlight
                    ? "bg-neon-indigo/10 border border-neon-indigo/30 text-neon-indigo"
                    : "bg-white/[0.04] border border-white/[0.08] text-gray-400"
                }`}
              >
                {step.label}
              </motion.span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* BitGo Integration Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="mt-8 max-w-xl mx-auto text-center"
      >
        <NeonCard glowColor="indigo" hoverable={false} delay={1}>
          <div className="p-4">
            <p className="text-xs text-gray-500">
              🏦{" "}
              <strong className="text-gray-400">
                BitGo Enterprise Integration:
              </strong>{" "}
              HR multi-sig sends ETH to stealth addresses via BitGo&apos;s{" "}
              <code className="text-neon-indigo font-mono">sendMany</code> API.
              All transfers are batched, policy-enforced, and auditable — but
              recipients remain unlinkable on Base L2.
            </p>
          </div>
        </NeonCard>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="mt-12 flex flex-col sm:flex-row gap-4"
      >
        <Link href="/hr">
          <NeonButton variant="primary" size="lg">
            🏢 Launch HR Dashboard
          </NeonButton>
        </Link>
        <Link href="/setup">
          <NeonButton variant="cyber" size="lg">
            ⚙️ Generate Stealth Keys
          </NeonButton>
        </Link>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.3 }}
        className="mt-20 text-center"
      >
        <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
          <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-neon-indigo/30" />
          <p>Built for ETHMumbai 2026 — Stealth Address Payroll on Base L2</p>
          <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-neon-indigo/30" />
        </div>
      </motion.footer>
    </main>
  );
}
