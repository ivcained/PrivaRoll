import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          blue: "#0052FF",
          dark: "#0a0a0f",
        },
        neon: {
          indigo: "#6366F1",
          cyan: "#22D3EE",
          amber: "#F59E0B",
          emerald: "#10B981",
          rose: "#F43F5E",
          purple: "#A855F7",
        },
        vapor: {
          50: "#f0f0ff",
          100: "#e0e0ff",
          200: "#c4c4ff",
          300: "#9999ff",
          400: "#6666ff",
          500: "#4444ee",
          600: "#3333cc",
          700: "#2222aa",
          800: "#111155",
          900: "#0a0a2e",
          950: "#06061a",
        },
        // Keep backward compat
        privaroll: {
          primary: "#6366F1",
          secondary: "#22D3EE",
          accent: "#F59E0B",
          success: "#10B981",
          danger: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(var(--tw-gradient-stops))",
      },
      animation: {
        scan: "scan 8s ease-in-out infinite",
        "scan-fast": "scan 4s ease-in-out infinite",
        "neon-pulse": "neonPulse 2s ease-in-out infinite alternate",
        "neon-pulse-cyan": "neonPulseCyan 2s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 10s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "glow-line": "glowLine 3s ease-in-out infinite",
        "glow-line-fast": "glowLine 1.5s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "gradient-x": "gradientX 3s linear infinite",
        "pulse-ring": "pulseRing 2s ease-out infinite",
        "cyber-flicker": "cyberFlicker 0.15s infinite",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100vh)" },
          "100%": { transform: "translateY(100vh)" },
        },
        neonPulse: {
          "0%": {
            boxShadow:
              "0 0 5px rgba(99, 102, 241, 0.2), 0 0 20px rgba(99, 102, 241, 0.1)",
          },
          "100%": {
            boxShadow:
              "0 0 10px rgba(99, 102, 241, 0.4), 0 0 40px rgba(99, 102, 241, 0.2)",
          },
        },
        neonPulseCyan: {
          "0%": {
            boxShadow:
              "0 0 5px rgba(34, 211, 238, 0.2), 0 0 20px rgba(34, 211, 238, 0.1)",
          },
          "100%": {
            boxShadow:
              "0 0 10px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glowLine: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.8" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gradientX: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        cyberFlicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
      boxShadow: {
        "neon-indigo":
          "0 0 15px -3px rgba(99, 102, 241, 0.3), 0 0 30px -5px rgba(99, 102, 241, 0.15)",
        "neon-cyan":
          "0 0 15px -3px rgba(34, 211, 238, 0.3), 0 0 30px -5px rgba(34, 211, 238, 0.15)",
        "neon-amber":
          "0 0 15px -3px rgba(245, 158, 11, 0.3), 0 0 30px -5px rgba(245, 158, 11, 0.15)",
        "neon-emerald":
          "0 0 15px -3px rgba(16, 185, 129, 0.3), 0 0 30px -5px rgba(16, 185, 129, 0.15)",
        "neon-rose":
          "0 0 15px -3px rgba(244, 63, 94, 0.3), 0 0 30px -5px rgba(244, 63, 94, 0.15)",
        "neon-purple":
          "0 0 15px -3px rgba(168, 85, 247, 0.3), 0 0 30px -5px rgba(168, 85, 247, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
