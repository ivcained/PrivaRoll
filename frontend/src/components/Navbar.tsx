"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navLinks = [
  { href: "/", label: "Home", icon: "🛡️" },
  { href: "/hr", label: "HR Dashboard", icon: "🏢" },
  { href: "/employee", label: "Employee", icon: "👤" },
  { href: "/setup", label: "Setup", icon: "⚙️" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl bg-[#0a0a0f]/80"
    >
      {/* Neon line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-indigo/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.span
            className="text-2xl"
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            🛡️
          </motion.span>
          <span className="text-lg font-bold bg-gradient-to-r from-neon-indigo to-neon-cyan bg-clip-text text-transparent group-hover:from-neon-cyan group-hover:to-neon-indigo transition-all duration-500">
            FHEPay
          </span>
          <span className="hidden sm:inline-block text-[10px] text-neon-indigo/50 font-mono border border-neon-indigo/20 rounded px-1.5 py-0.5">
            v1.0
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/[0.06] border border-white/[0.08] rounded-lg"
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      duration: 0.6,
                    }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-neon-indigo rounded-full blur-[2px]"
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      duration: 0.6,
                    }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <span className="text-xs">{link.icon}</span>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Network Badge */}
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neon-cyan/20 bg-neon-cyan/5"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan" />
            </span>
            <span className="text-xs text-neon-cyan font-medium">Base</span>
          </motion.div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto scrollbar-none">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                isActive
                  ? "text-white bg-white/[0.06] border border-white/[0.08]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="flex items-center gap-1">
                <span>{link.icon}</span>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </motion.nav>
  );
}
