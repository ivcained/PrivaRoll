import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PrivaRoll — Private Web3 Payroll on Base",
  description:
    "Enterprise payroll with stealth addresses on Base EVM. Public solvency, unlinkable distributions.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-base-dark text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
